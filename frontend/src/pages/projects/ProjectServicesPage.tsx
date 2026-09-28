import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Boxes, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageSection, PageSectionHeader } from "@/components/layout/PageSection";
import { DeploymentMethodBadge } from "@/components/projects/DeploymentMethodBadge";
import { ServicePortEditor } from "@/components/projects/ServicePortEditor";
import { projectQueryKey, useProject } from "@/components/projects/project-context";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { projectSectionPath } from "@/constants/routes";
import { toastApiError, toastSuccess } from "@/lib/toast";
import * as projectsService from "@/services/projects.service";

export function ProjectServicesPage() {
  const project = useProject();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) => projectsService.deleteService(project.id, serviceId),
    onSuccess: () => {
      toastSuccess("Service removed.");
      void queryClient.invalidateQueries({ queryKey: projectQueryKey(project.id) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => toastApiError(err, "Failed to delete service"),
  });

  const handleDelete = async (serviceId: string, name: string) => {
    const confirmed = await confirm({
      title: "Delete service",
      description: `Remove “${name}” from this project? Future deploys will no longer include it.`,
      confirmLabel: "Delete service",
    });
    if (confirmed) {
      deleteMutation.mutate(serviceId);
    }
  };

  const newServicePath = projectSectionPath(project.id, "services/new");

  return (
    <PageSection>
      <PageSectionHeader
        title="Services"
        description="How this repository is built and run on the server."
        actions={
          project.services.length > 0 ? (
            <Button size="sm" asChild>
              <Link to={newServicePath}>
                <Plus className="h-4 w-4" />
                Add service
              </Link>
            </Button>
          ) : undefined
        }
      />

      {project.services.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No services yet"
          description="Add a Dockerfile, Compose file, or pre-built image so DeployHub knows how to run this app."
          action={
            <Button size="sm" asChild>
              <Link to={newServicePath}>
                <Plus className="h-4 w-4" />
                Add service
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {project.services.map((service) => (
            <article key={service.id} className="rounded-lg border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{service.name}</h3>
                    <DeploymentMethodBadge method={service.deploymentMethod} />
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  )}
                  <p className="font-mono text-xs text-muted-foreground">
                    {service.deploymentMethod === "DOCKERFILE" &&
                      `${service.dockerfilePath} · context ${service.buildContext}`}
                    {service.deploymentMethod === "COMPOSE" && service.composeFilePath}
                    {service.deploymentMethod === "IMAGE" && service.imageName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${service.name}`}
                  disabled={deleteMutation.isPending}
                  onClick={() => void handleDelete(service.id, service.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {(service.deploymentMethod === "DOCKERFILE" || service.deploymentMethod === "IMAGE") && (
                <ServicePortEditor
                  projectId={project.id}
                  serviceId={service.id}
                  serviceName={service.name}
                  port={service.port}
                />
              )}
            </article>
          ))}
        </div>
      )}
    </PageSection>
  );
}
