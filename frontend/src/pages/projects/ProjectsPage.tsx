import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageContent } from "@/components/layout/PageContent";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { ProjectList } from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/button";
import { projectDetailPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import * as projectsService from "@/services/projects.service";

const PROJECTS_QUERY_KEY = ["projects"];

export function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: projectsService.listProjects,
  });

  const createMutation = useMutation({
    mutationFn: projectsService.createProject,
    onSuccess: (result) => {
      setShowCreateForm(false);
      setCreateError(null);
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      navigate(projectDetailPath(result.project.id));
    },
    onError: (err) => {
      setCreateError(getApiErrorMessage(err, "Failed to create project"));
    },
  });

  const projects = data?.projects ?? [];

  return (
    <>
      <Header
        title="Projects"
        description="Connect GitHub repositories and define how each app deploys."
        actions={
          !showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Create project
            </Button>
          ) : undefined
        }
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent>
          {!isLoading && !isError && projects.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </p>
          )}

          {showCreateForm && (
            <CreateProjectForm
              onSubmit={async (values) => {
                setCreateError(null);
                await createMutation.mutateAsync(values);
              }}
              onCancel={() => {
                setShowCreateForm(false);
                setCreateError(null);
              }}
              isSubmitting={createMutation.isPending}
              error={createError}
            />
          )}

          {isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading projects…
            </p>
          )}

          {isError && (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(error, "Failed to load projects")}
            </p>
          )}

          {!isLoading && !isError && (
            <ProjectList
              projects={projects}
              onCreateProject={!showCreateForm ? () => setShowCreateForm(true) : undefined}
            />
          )}
        </PageContent>
      </div>
    </>
  );
}
