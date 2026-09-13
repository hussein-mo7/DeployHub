import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { checkHealth } from "@/services/api";
import * as projectsService from "@/services/projects.service";
import * as serversService from "@/services/servers.service";

export function DashboardPage() {
  const { data: health, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
  });

  const { data: serversData } = useQuery({
    queryKey: ["servers"],
    queryFn: serversService.listServers,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsService.listProjects,
  });

  const servers = serversData?.servers ?? [];
  const projects = projectsData?.projects ?? [];
  const onlineCount = servers.filter((server) => server.status === "ONLINE").length;

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of your servers, projects, and deployments."
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Servers</CardDescription>
              <CardTitle className="text-3xl">{servers.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {servers.length === 0
                  ? "Add your first VPS to get started"
                  : `${onlineCount} online · ${servers.length - onlineCount} other`}
              </p>
              {servers.length > 0 && (
                <Link to={ROUTES.SERVERS} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                  View servers
                </Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Projects</CardDescription>
              <CardTitle className="text-3xl">{projects.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {projects.length === 0
                  ? "No projects configured yet"
                  : `${projects.length} project${projects.length === 1 ? "" : "s"} linked`}
              </p>
              {projects.length > 0 && (
                <Link
                  to={ROUTES.PROJECTS}
                  className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                >
                  View projects
                </Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Deployments</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Deploy your first application</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>API Status</CardDescription>
              <CardTitle className="text-3xl">
                {isLoading ? "..." : isError ? "Down" : "OK"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {health?.services?.database === "connected" ? "Backend connected" : "Checking..."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
