import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, Rocket, Search } from "lucide-react";
import { DeploymentStatusBadge } from "@/components/deployments/DeploymentStatusBadge";
import { LogViewer } from "@/components/deployments/LogViewer";
import { EmptyState } from "@/components/layout/EmptyState";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { projectDetailPath, ROUTES } from "@/constants/routes";
import { useDeploymentLiveUpdates } from "@/hooks/useDeploymentLiveUpdates";
import { cn } from "@/lib/utils";
import { deploymentDetailQueryKey } from "@/lib/deployment-cache";
import { formatDateTime, formatDistanceToNow } from "@/lib/format-date";
import { formatDeploymentTrigger } from "@/lib/format-deployment";
import * as deploymentsService from "@/services/deployments.service";
import type { DeploymentStatus, DeploymentSummary } from "@/types/deployments.types";

const selectClassName =
  "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[140px]";

type StatusFilter = "all" | "active" | DeploymentStatus;

function matchesStatusFilter(deployment: DeploymentSummary, filter: StatusFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "active") {
    return deploymentsService.isActiveDeploymentStatus(deployment.status);
  }
  return deployment.status === filter;
}

function DeploymentLogPanel({
  deploymentId,
  summary,
}: {
  deploymentId: string;
  summary: DeploymentSummary | undefined;
}) {
  const { data, isLoading } = useQuery({
    queryKey: deploymentDetailQueryKey(deploymentId),
    queryFn: () => deploymentsService.getDeployment(deploymentId),
  });

  const deployment = data?.deployment;
  const isActive =
    summary && deploymentsService.isActiveDeploymentStatus(summary.status);

  return (
    <div className="flex h-full min-h-[280px] flex-col gap-3 lg:min-h-[420px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {summary && <DeploymentStatusBadge status={summary.status} />}
          {summary && (
            <span className="text-sm font-medium text-foreground">
              {summary.projectName} · {summary.environmentName}
            </span>
          )}
          {deployment?.errorMessage && (
            <span className="text-sm text-destructive">{deployment.errorMessage}</span>
          )}
          {isActive && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          )}
        </div>
        {summary && (
          <Button variant="outline" size="sm" asChild>
            <Link to={projectDetailPath(summary.projectId)}>
              <ExternalLink className="h-4 w-4" />
              Open project
            </Link>
          </Button>
        )}
      </div>

      {summary && (
        <p className="text-xs text-muted-foreground">
          {formatDeploymentTrigger(summary.trigger)}
          {summary.gitCommitSha && (
            <>
              {" · "}
              <span className="font-mono">{summary.gitCommitSha.slice(0, 7)}</span>
            </>
          )}
          {" · "}
          <span title={formatDateTime(summary.createdAt)}>
            {formatDateTime(summary.createdAt)}
          </span>
        </p>
      )}

      <LogViewer
        logs={deployment?.logs}
        isLoading={isLoading && !deployment}
        followKey={deploymentId}
      />
    </div>
  );
}

export function DeploymentsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useDeploymentLiveUpdates({ deploymentId: selectedId });

  const { data: deployments, isLoading, isError } = useQuery({
    queryKey: ["deployments", "recent"],
    queryFn: () => deploymentsService.listRecentDeployments(80),
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some((d) =>
        deploymentsService.isActiveDeploymentStatus(d.status),
      );
      return hasActive ? 15000 : false;
    },
  });

  const projectOptions = useMemo(() => {
    if (!deployments) {
      return [];
    }
    const map = new Map<string, string>();
    for (const d of deployments) {
      map.set(d.projectId, d.projectName);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [deployments]);

  const filtered = useMemo(() => {
    if (!deployments) {
      return [];
    }
    const q = search.trim().toLowerCase();
    return deployments.filter((d) => {
      if (!matchesStatusFilter(d, statusFilter)) {
        return false;
      }
      if (projectFilter !== "all" && d.projectId !== projectFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        d.projectName.toLowerCase().includes(q) ||
        d.environmentName.toLowerCase().includes(q) ||
        (d.gitCommitSha?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [deployments, statusFilter, projectFilter, search]);

  useEffect(() => {
    if (selectedId && !filtered.some((d) => d.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const selectedSummary = filtered.find((d) => d.id === selectedId);

  return (
    <>
      <Header
        title="Deployments"
        description="Browse deployment history and stream logs across all projects."
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent>
          <Card className="w-full shadow-sm">
            <CardHeader className="flex flex-col gap-4 space-y-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">Deployment history</CardTitle>
                  <CardDescription>
                    Filter runs, pick one from the list, and read logs in the panel.
                    Active jobs refresh automatically.
                  </CardDescription>
                </div>
              </div>

              {deployments && deployments.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="relative min-w-0 flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search project, environment, commit…"
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="deploy-filter-status" className="text-xs text-muted-foreground">
                        Status
                      </Label>
                      <select
                        id="deploy-filter-status"
                        className={selectClassName}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILED">Failed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="RUNNING">Running</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deploy-filter-project" className="text-xs text-muted-foreground">
                        Project
                      </Label>
                      <select
                        id="deploy-filter-project"
                        className={selectClassName}
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                      >
                        <option value="all">All projects</option>
                        {projectOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {isLoading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading deployments…
                </p>
              )}
              {isError && (
                <p className="text-sm text-destructive">Failed to load deployments.</p>
              )}
              {!isLoading && !isError && deployments?.length === 0 && (
                <EmptyState
                  icon={Rocket}
                  title="No deployments yet"
                  description="Open a project, choose an environment, and run Deploy now."
                  action={
                    <Button size="sm" asChild variant="secondary">
                      <Link to={ROUTES.PROJECTS}>Go to projects</Link>
                    </Button>
                  }
                />
              )}

              {!isLoading && !isError && deployments && deployments.length > 0 && (
                <>
                  {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No deployments match your filters. Try clearing search or filters.
                    </p>
                  ) : (
                    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-start">
                      <div className="order-1 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {filtered.length} deployment{filtered.length === 1 ? "" : "s"}
                        </p>
                        <ul
                          className="max-h-[min(420px,50vh)] divide-y overflow-y-auto rounded-lg border bg-card lg:max-h-[calc(100vh-16rem)]"
                          role="listbox"
                          aria-label="Deployments"
                        >
                          {filtered.map((deployment) => {
                            const isSelected = selectedId === deployment.id;
                            return (
                              <li key={deployment.id}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  className={cn(
                                    "flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                                    isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                                  )}
                                  onClick={() => setSelectedId(deployment.id)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <DeploymentStatusBadge status={deployment.status} />
                                    <span
                                      className="shrink-0 text-xs text-muted-foreground"
                                      title={formatDateTime(deployment.createdAt)}
                                    >
                                      {formatDistanceToNow(deployment.createdAt)}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-foreground">
                                    {deployment.projectName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {deployment.environmentName} ·{" "}
                                    {formatDeploymentTrigger(deployment.trigger)}
                                  </span>
                                  {deployment.errorMessage && (
                                    <span className="line-clamp-2 text-xs text-destructive">
                                      {deployment.errorMessage}
                                    </span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div
                        className={cn(
                          "order-2 rounded-lg border bg-muted/10 p-4 shadow-sm",
                          !selectedId &&
                            "hidden min-h-[280px] items-center justify-center lg:flex lg:min-h-[420px]",
                        )}
                      >
                        {!selectedId ? (
                          <p className="text-sm text-muted-foreground">
                            Select a deployment to view logs
                          </p>
                        ) : (
                          <DeploymentLogPanel
                            deploymentId={selectedId}
                            summary={selectedSummary}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </PageContent>
      </div>
    </>
  );
}
