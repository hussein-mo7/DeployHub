import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DeploymentStatusBadge } from "@/components/deployments/DeploymentStatusBadge";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { projectDetailPath } from "@/constants/routes";
import { useDeploymentLiveUpdates } from "@/hooks/useDeploymentLiveUpdates";
import { deploymentDetailQueryKey } from "@/lib/deployment-cache";
import { formatDateTime } from "@/lib/format-date";
import * as deploymentsService from "@/services/deployments.service";

export function DeploymentsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useDeploymentLiveUpdates({ deploymentId: expandedId });

  const { data: deployments, isLoading, isError } = useQuery({
    queryKey: ["deployments", "recent"],
    queryFn: () => deploymentsService.listRecentDeployments(40),
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some((d) =>
        deploymentsService.isActiveDeploymentStatus(d.status),
      );
      return hasActive ? 15000 : false;
    },
  });

  const { data: expandedDetail, isLoading: detailLoading } = useQuery({
    queryKey: deploymentDetailQueryKey(expandedId ?? ""),
    queryFn: () => deploymentsService.getDeployment(expandedId!),
    enabled: Boolean(expandedId),
  });

  return (
    <>
      <Header
        title="Deployments"
        description="Recent deployment runs across all projects. Open a project environment to trigger a new deploy."
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent deployments</CardTitle>
            <CardDescription>
              Select a row to view logs. Active deployments refresh automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </p>
            )}
            {isError && (
              <p className="text-sm text-destructive">Failed to load deployments.</p>
            )}
            {!isLoading && !isError && deployments?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No deployments yet. Open a project, pick an environment, and use Deploy now.
              </p>
            )}
            {deployments && deployments.length > 0 && (
              <div className="space-y-2">
                <ul className="divide-y rounded-md border">
                  {deployments.map((deployment) => (
                    <li key={deployment.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                        onClick={() =>
                          setExpandedId((current) =>
                            current === deployment.id ? null : deployment.id,
                          )
                        }
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <DeploymentStatusBadge status={deployment.status} />
                            <span className="font-medium">
                              {deployment.projectName} · {deployment.environmentName}
                            </span>
                          </div>
                          {deployment.errorMessage && (
                            <p className="text-xs text-destructive">{deployment.errorMessage}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(deployment.createdAt)}
                        </span>
                      </button>
                      {expandedId === deployment.id && (
                        <div className="border-t bg-muted/20 px-4 py-3">
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={projectDetailPath(deployment.projectId)}>
                                Open project
                              </Link>
                            </Button>
                          </div>
                          <div className="max-h-64 overflow-y-auto rounded-md border bg-background p-3 font-mono text-xs">
                            {detailLoading && !expandedDetail ? (
                              <p className="text-muted-foreground">Loading logs…</p>
                            ) : (
                              expandedDetail?.deployment.logs.map((log) => (
                                <div key={log.id} className="whitespace-pre-wrap break-all">
                                  {log.message}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
