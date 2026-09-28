import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import {
  EnvironmentFields,
  defaultEnvironmentDraft,
  type EnvironmentDraft,
} from "@/components/projects/EnvironmentFields";
import { projectQueryKey, useProject } from "@/components/projects/project-context";
import {
  WizardPanel,
  WizardPanelBody,
  WizardPanelFooter,
  WizardPanelHeader,
} from "@/components/layout/WizardPanel";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/ui/form-field";
import { ButtonSpinner, SectionLoadingState } from "@/components/ui/loading-state";
import { projectSectionPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodFieldErrors } from "@/lib/form-errors";
import { toastSuccess } from "@/lib/toast";
import { createEnvironmentSchema } from "@/lib/validations/projects.schema";
import * as githubService from "@/services/github.service";
import * as projectsService from "@/services/projects.service";
import * as serversService from "@/services/servers.service";

export function ProjectNewEnvironmentPage() {
  const project = useProject();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<EnvironmentDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: serversData, isLoading: serversLoading } = useQuery({
    queryKey: ["servers"],
    queryFn: serversService.listServers,
  });
  const servers = serversData?.servers ?? [];

  const { data: branchesData } = useQuery({
    queryKey: ["github", "branches", project.repoOwner, project.repoName],
    queryFn: () => githubService.listBranches(project.repoOwner, project.repoName),
    retry: false,
  });

  const firstEnvironment = project.environments.length === 0;
  const value =
    draft ??
    ({
      ...defaultEnvironmentDraft(servers),
      name: firstEnvironment ? "Production" : "Staging",
    } satisfies EnvironmentDraft);

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof projectsService.createEnvironment>[1]) =>
      projectsService.createEnvironment(project.id, input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKey(project.id) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      toastSuccess(`${result.environment.name} created — add variables, then deploy.`);
      navigate(projectSectionPath(project.id, "variables", result.environment.id));
    },
    onError: (err) => setSubmitError(getApiErrorMessage(err, "Failed to create environment")),
  });

  const handleSubmit = () => {
    setErrors({});
    setSubmitError(null);
    const result = createEnvironmentSchema.safeParse(value);
    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }
    createMutation.mutate(result.data);
  };

  return (
    <WizardPanel className="mx-auto max-w-3xl">
      <WizardPanelHeader
        title={firstEnvironment ? "Create your first environment" : "Add an environment"}
        description={`Choose the server and branch ${project.name} deploys to. Variables come next.`}
      />
      <WizardPanelBody>
        <FormErrorBanner message={submitError} />
        {serversLoading ? (
          <SectionLoadingState label="Loading servers…" />
        ) : (
          <EnvironmentFields
            value={value}
            onChange={setDraft}
            errors={errors}
            servers={servers}
            branchSuggestions={branchesData?.branches.map((branch) => branch.name)}
          />
        )}
      </WizardPanelBody>
      <WizardPanelFooter>
        <Button
          variant="ghost"
          onClick={() => navigate(projectSectionPath(project.id))}
          disabled={createMutation.isPending}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending || servers.length === 0}>
          {createMutation.isPending ? (
            <>
              <ButtonSpinner className="mr-2" />
              Creating…
            </>
          ) : (
            "Create environment"
          )}
        </Button>
      </WizardPanelFooter>
    </WizardPanel>
  );
}
