import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Boxes, Plus, Server } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageSection, PageSectionHeader, PageSections } from "@/components/layout/PageSection";
import { DeploymentMethodBadge } from "@/components/projects/DeploymentMethodBadge";
import {
  EnvironmentOverviewCard,
  environmentDeploymentsQueryKey,
} from "@/components/projects/EnvironmentOverviewCard";
import { FirstDeployChecklist } from "@/components/projects/FirstDeployChecklist";
import { useProject } from "@/components/projects/project-context";
import { Button } from "@/components/ui/button";
import { projectSectionPath } from "@/constants/routes";
import { buildProjectFirstDeploySteps, isChecklistComplete } from "@/lib/first-deploy-checklist";
import { formatDateTime } from "@/lib/format-date";
import * as deploymentsService from "@/services/deployments.service";
import * as githubService from "@/services/github.service";

export function ProjectOverviewPage() {
  const project = useProject();

  const { data: githubIntegration } = useQuery({
    queryKey: ["github", "integration"],
    queryFn: githubService.getIntegration,
  });

  const deploymentQueries = useQueries({
    queries: project.environments.map((environment) => ({
      queryKey: environmentDeploymentsQueryKey(project.id, environment.id),
      queryFn: () => deploymentsService.listEnvironmentDeployments(project.id, environment.id),
    })),
  });
  const hasAnyDeployment = deploymentQueries.some((query) => (query.data?.deployments.length ?? 0) > 0);

  const steps = buildProjectFirstDeploySteps({
    githubConnected: githubIntegration?.integration.connected === true,
    project,
    hasAnyDeployment,
  });

  return (
    <PageSections className="gap-8">
      {!isChecklistComplete(steps) && (
        <FirstDeployChecklist
          title="Get this project live"
          description="Each step links to the page where you finish it."
          steps={steps}
        />
      )}

      <PageSection>
        <PageSectionHeader
          title="Environments"
          description="Deploy, view logs, or edit variables."
          actions={
            project.environments.length > 0 ? (
              <Button size="sm" variant="outline" asChild>
                <Link to={projectSectionPath(project.id, "environments/new")}>
                  <Plus className="h-4 w-4" />
                  Add environment
                </Link>
              </Button>
            ) : undefined
          }
        />

        {project.environments.length === 0 ? (
          <EmptyState
            icon={Server}
            title="No environments yet"
            description="An environment binds a branch to a server — create one to start deploying."
            action={
              <Button size="sm" asChild>
                <Link to={projectSectionPath(project.id, "environments/new")}>
                  <Plus className="h-4 w-4" />
                  Add environment
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {project.environments.map((environment) => (
              <EnvironmentOverviewCard
                key={environment.id}
                projectId={project.id}
                environment={environment}
                canDeploy={project.services.length > 0}
              />
            ))}
          </div>
        )}
      </PageSection>

      <div className="grid gap-10 lg:grid-cols-2">
        <PageSection>
          <PageSectionHeader
            title="Services"
            actions={
              <Link
                to={projectSectionPath(project.id, "services")}
                className="text-xs font-medium text-primary hover:underline"
              >
                Manage
              </Link>
            }
          />
          {project.services.length === 0 ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-4">
              <div className="flex items-center gap-3">
                <Boxes className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No build configured yet.</p>
              </div>
              <Button size="sm" asChild>
                <Link to={projectSectionPath(project.id, "services/new")}>Add service</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {project.services.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {service.deploymentMethod === "DOCKERFILE" && service.dockerfilePath}
                      {service.deploymentMethod === "COMPOSE" && service.composeFilePath}
                      {service.deploymentMethod === "IMAGE" && service.imageName}
                      {service.port != null && ` · :${service.port}`}
                    </p>
                  </div>
                  <DeploymentMethodBadge method={service.deploymentMethod} />
                </li>
              ))}
            </ul>
          )}
        </PageSection>

        <PageSection>
          <PageSectionHeader title="Details" />
          <dl className="space-y-3 text-sm">
            <DetailLine label="Repository">
              <a
                href={`https://github.com/${project.repoFullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary hover:underline"
              >
                {project.repoFullName}
              </a>
            </DetailLine>
            <DetailLine label="Environments">{project.environments.length}</DetailLine>
            <DetailLine label="Services">{project.services.length}</DetailLine>
            <DetailLine label="Created">{formatDateTime(project.createdAt)}</DetailLine>
          </dl>
        </PageSection>
      </div>
    </PageSections>
  );
}

function DetailLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}
