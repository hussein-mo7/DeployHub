import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  FolderKanban,
  Plus,
  Rocket,
  Server,
  ServerOff,
} from "lucide-react";
import { DeploymentStatusBadge } from "@/components/deployments/DeploymentStatusBadge";
import { EmptyState } from "@/components/layout/EmptyState";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { projectDetailPath, ROUTES } from "@/constants/routes";
import { formatDateTime, formatDistanceToNow } from "@/lib/format-date";
import { checkHealth } from "@/services/api";
import * as deploymentsService from "@/services/deployments.service";
import * as projectsService from "@/services/projects.service";
import * as serversService from "@/services/servers.service";

const RECENT_LIMIT = 8;

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
  linkLabel,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof Server;
  to?: string;
  linkLabel?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {label}
        </CardDescription>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
        {to && linkLabel && (
          <Link
            to={to}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {linkLabel}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: health, isLoading: healthLoading, isError: healthError } = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
  });

  const { data: serversData, isLoading: serversLoading } = useQuery({
    queryKey: ["servers"],
    queryFn: serversService.listServers,
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsService.listProjects,
  });

  const { data: recentDeployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ["deployments", "recent"],
    queryFn: () => deploymentsService.listRecentDeployments(50),
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some((d) =>
        deploymentsService.isActiveDeploymentStatus(d.status),
      );
      return hasActive ? 15000 : false;
    },
  });

  const servers = serversData?.servers ?? [];
  const projects = projectsData?.projects ?? [];
  const deployments = recentDeployments ?? [];
  const recentRows = deployments.slice(0, RECENT_LIMIT);

  const onlineCount = servers.filter((server) => server.status === "ONLINE").length;
  const successCount = deployments.filter((d) => d.status === "SUCCESS").length;
  const activeCount = deployments.filter((d) =>
    deploymentsService.isActiveDeploymentStatus(d.status),
  ).length;
  const failedRecent = deployments.filter((d) => d.status === "FAILED").length;

  const apiOk = !healthLoading && !healthError && health?.status === "ok";
  const showAgentWarning = servers.length > 0 && onlineCount === 0;
  const isEmptyAccount = !serversLoading && !projectsLoading && servers.length === 0 && projects.length === 0;

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of infrastructure, projects, and recent deployment activity."
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent>
          {showAgentWarning && (
            <div
              className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              role="status"
            >
              <div className="flex gap-3">
                <ServerOff className="h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-medium text-foreground">No agents online</p>
                  <p className="text-xs text-muted-foreground">
                    Deployments need at least one server with an online agent. Check your VPS and
                    agent process.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0 border-amber-600/30">
                <Link to={ROUTES.SERVERS}>View servers</Link>
              </Button>
            </div>
          )}

          {isEmptyAccount && (
            <Card className="border-dashed shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Get started with DeployHub</CardTitle>
                <CardDescription>
                  Add a server → install the agent (SSH on server detail or manual token) → connect
                  GitHub in Settings → create a project. Run{" "}
                  <span className="font-mono text-xs">npm run worker</span> locally so deploys and
                  bootstrap jobs execute.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to={ROUTES.SERVERS}>
                    <Plus className="h-4 w-4" />
                    Add server
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={ROUTES.SETTINGS}>Connect GitHub</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              label="Servers"
              value={serversLoading ? "—" : servers.length}
              hint={
                servers.length === 0
                  ? "Register a VPS as a deploy target"
                  : `${onlineCount} online · ${servers.length - onlineCount} offline or unknown`
              }
              icon={Server}
              to={servers.length > 0 ? ROUTES.SERVERS : undefined}
              linkLabel={servers.length > 0 ? "Manage servers" : undefined}
            />
            <StatCard
              label="Projects"
              value={projectsLoading ? "—" : projects.length}
              hint={
                projects.length === 0
                  ? "Link a GitHub repo and services"
                  : `${projects.length} configured`
              }
              icon={FolderKanban}
              to={projects.length > 0 ? ROUTES.PROJECTS : undefined}
              linkLabel={projects.length > 0 ? "View projects" : undefined}
            />
            <StatCard
              label="Deployments"
              value={deploymentsLoading ? "—" : deployments.length}
              hint={
                deployments.length === 0
                  ? "Trigger a deploy from a project environment"
                  : `${successCount} succeeded${activeCount > 0 ? ` · ${activeCount} in progress` : ""}${failedRecent > 0 ? ` · ${failedRecent} failed` : ""}`
              }
              icon={Rocket}
              to={deployments.length > 0 ? ROUTES.DEPLOYMENTS : undefined}
              linkLabel={deployments.length > 0 ? "Full history" : undefined}
            />
            <StatCard
              label="Control plane"
              value={healthLoading ? "…" : apiOk ? "Healthy" : "Issue"}
              hint={
                apiOk
                  ? "API, database, and Redis connected"
                  : "Check backend and Docker Redis"
              }
              icon={Activity}
            />
          </div>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Recent deployments</CardTitle>
                <CardDescription>
                  Latest runs across all environments. Active jobs refresh automatically.
                </CardDescription>
              </div>
              {deployments.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.DEPLOYMENTS}>View all</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {deploymentsLoading && (
                <p className="text-sm text-muted-foreground">Loading activity…</p>
              )}
              {!deploymentsLoading && recentRows.length === 0 && (
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
              {recentRows.length > 0 && (
                <>
                  <ul className="space-y-3 md:hidden">
                    {recentRows.map((deployment) => (
                      <li
                        key={deployment.id}
                        className="rounded-lg border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <DeploymentStatusBadge status={deployment.status} />
                          <span
                            className="text-xs text-muted-foreground"
                            title={formatDateTime(deployment.createdAt)}
                          >
                            {formatDistanceToNow(deployment.createdAt)}
                          </span>
                        </div>
                        <Link
                          to={projectDetailPath(deployment.projectId)}
                          className="mt-2 block font-medium text-foreground hover:text-primary"
                        >
                          {deployment.projectName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {deployment.environmentName} ·{" "}
                          <span className="font-mono">{deployment.trigger}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto rounded-md border md:block">
                    <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium">Project</th>
                        <th className="px-4 py-2.5 font-medium">Trigger</th>
                        <th className="px-4 py-2.5 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRows.map((deployment) => (
                        <tr
                          key={deployment.id}
                          className="border-b last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            <DeploymentStatusBadge status={deployment.status} />
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={projectDetailPath(deployment.projectId)}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {deployment.projectName}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {deployment.environmentName}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-muted-foreground">
                              {deployment.trigger}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <span title={formatDateTime(deployment.createdAt)}>
                              {formatDistanceToNow(deployment.createdAt)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </PageContent>
      </div>
    </>
  );
}
