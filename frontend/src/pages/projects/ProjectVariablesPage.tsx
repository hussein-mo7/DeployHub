import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, KeyRound, Plus } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { environmentDeploymentsQueryKey } from "@/components/projects/EnvironmentOverviewCard";
import { EnvironmentPicker } from "@/components/projects/EnvironmentPicker";
import { EnvironmentSettingsCard } from "@/components/projects/EnvironmentSettingsCard";
import { EnvironmentVariablesPanel } from "@/components/projects/EnvironmentVariablesPanel";
import { useProject, useSelectedEnvironment } from "@/components/projects/project-context";
import { PageSection, PageSectionHeader } from "@/components/layout/PageSection";
import { Button } from "@/components/ui/button";
import { projectSectionPath } from "@/constants/routes";
import { toastSuccess } from "@/lib/toast";

export function ProjectVariablesPage() {
  const project = useProject();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { environment, selectEnvironment } = useSelectedEnvironment(project);

  if (!environment) {
    return (
      <EmptyState
        icon={KeyRound}
        title="No environments yet"
        description="Variables belong to an environment. Create one first."
        action={
          <Button size="sm" asChild>
            <Link to={projectSectionPath(project.id, "environments/new")}>
              <Plus className="h-4 w-4" />
              Add environment
            </Link>
          </Button>
        }
      />
    );
  }

  const deploymentsPath = projectSectionPath(project.id, "deployments", environment.id);

  return (
    <div className="space-y-5">
      <EnvironmentPicker
        projectId={project.id}
        environments={project.environments}
        selectedId={environment.id}
        onSelect={selectEnvironment}
      />

      <EnvironmentSettingsCard key={`${environment.id}-settings`} projectId={project.id} environment={environment} />

      <PageSection>
        <PageSectionHeader
          title="Variables"
          description="Injected at deploy time. Save keeps them for the next deploy; Save & redeploy applies them now."
          actions={
            <Button size="sm" variant="ghost" asChild>
              <Link to={deploymentsPath}>
                Go to deployments
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <EnvironmentVariablesPanel
          key={environment.id}
          embedded
          projectId={project.id}
          environmentId={environment.id}
          environmentName={environment.name}
          onSaved={(redeployQueued) => {
            if (redeployQueued) {
              void queryClient.invalidateQueries({
                queryKey: environmentDeploymentsQueryKey(project.id, environment.id),
              });
              toastSuccess("Variables saved — redeploy started.");
              navigate(deploymentsPath);
            } else {
              toastSuccess("Variables saved.");
            }
          }}
        />
      </PageSection>
    </div>
  );
}
