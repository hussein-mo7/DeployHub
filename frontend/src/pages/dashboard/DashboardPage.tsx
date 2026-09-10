import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkHealth } from "@/services/api";

export function DashboardPage() {
  const { data: health, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
  });

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
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Add your first VPS to get started</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Projects</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">No projects configured yet</p>
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
