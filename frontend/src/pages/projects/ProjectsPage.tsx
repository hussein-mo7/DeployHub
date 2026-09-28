import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ListLoadingSkeleton } from "@/components/ui/loading-state";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { ProjectList } from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import * as projectsService from "@/services/projects.service";

export function ProjectsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsService.listProjects,
  });

  const projects = data?.projects ?? [];

  return (
    <>
      <Header
        title="Projects"
        description="Connect GitHub repositories and define how each app deploys."
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link to={ROUTES.PROJECT_NEW}>
              <Plus className="h-4 w-4" />
              New project
            </Link>
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent>
          {!isLoading && !isError && projects.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </p>
          )}

          {isLoading && <ListLoadingSkeleton rows={3} />}

          {isError && (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(error, "Failed to load projects")}
            </p>
          )}

          {!isLoading && !isError && <ProjectList projects={projects} />}
        </PageContent>
      </div>
    </>
  );
}
