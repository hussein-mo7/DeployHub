import { Link } from "react-router-dom";
import { Plus, Rocket } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { EnvironmentDeploymentsPanel } from "@/components/projects/EnvironmentDeploymentsPanel";
import { EnvironmentPicker } from "@/components/projects/EnvironmentPicker";
import { useProject, useSelectedEnvironment } from "@/components/projects/project-context";
import { Button } from "@/components/ui/button";
import { projectSectionPath } from "@/constants/routes";
import type { ServerStatus } from "@/types/servers.types";

export function ProjectDeploymentsPage() {
  const project = useProject();
  const { environment, selectEnvironment } = useSelectedEnvironment(project);

  if (!environment) {
    return (
      <EmptyState
        icon={Rocket}
        title="Nothing to deploy yet"
        description="Create an environment to choose a server and branch, then deploy from here."
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

  return (
    <div className="space-y-5">
      <EnvironmentPicker
        projectId={project.id}
        environments={project.environments}
        selectedId={environment.id}
        onSelect={selectEnvironment}
      />
      <EnvironmentDeploymentsPanel
        key={environment.id}
        embedded
        size="page"
        projectId={project.id}
        environmentId={environment.id}
        serverStatus={environment.serverStatus as ServerStatus}
        canDeploy={project.services.length > 0}
      />
    </div>
  );
}
