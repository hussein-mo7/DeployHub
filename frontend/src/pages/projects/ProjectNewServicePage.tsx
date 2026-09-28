import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import {
  ServiceBuildFields,
  defaultServiceDraft,
  serviceDraftToPayload,
} from "@/components/projects/ServiceBuildFields";
import { projectQueryKey, useProject } from "@/components/projects/project-context";
import {
  WizardPanel,
  WizardPanelBody,
  WizardPanelFooter,
  WizardPanelHeader,
} from "@/components/layout/WizardPanel";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/ui/form-field";
import { ButtonSpinner } from "@/components/ui/loading-state";
import { projectSectionPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodFieldErrors } from "@/lib/form-errors";
import { toastSuccess } from "@/lib/toast";
import { createServiceSchema } from "@/lib/validations/projects.schema";
import * as projectsService from "@/services/projects.service";

export function ProjectNewServicePage() {
  const project = useProject();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() =>
    defaultServiceDraft(project.services.length === 0 ? "web" : ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof projectsService.createService>[1]) =>
      projectsService.createService(project.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKey(project.id) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (project.environments.length === 0) {
        toastSuccess("Service added — next, choose where it runs.");
        navigate(projectSectionPath(project.id, "environments/new"));
      } else {
        toastSuccess("Service added. Redeploy to include it.");
        navigate(projectSectionPath(project.id, "services"));
      }
    },
    onError: (err) => setSubmitError(getApiErrorMessage(err, "Failed to add service")),
  });

  const handleSubmit = () => {
    setErrors({});
    setSubmitError(null);
    const result = createServiceSchema.safeParse(serviceDraftToPayload(draft));
    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }
    createMutation.mutate(result.data);
  };

  return (
    <WizardPanel className="mx-auto max-w-3xl">
      <WizardPanelHeader
        title="Add a service"
        description={`A service tells DeployHub how to build and run part of ${project.name}.`}
      />
      <WizardPanelBody>
        <FormErrorBanner message={submitError} />
        <ServiceBuildFields value={draft} onChange={setDraft} errors={errors} />
      </WizardPanelBody>
      <WizardPanelFooter>
        <Button
          variant="ghost"
          onClick={() => navigate(projectSectionPath(project.id, "services"))}
          disabled={createMutation.isPending}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <ButtonSpinner className="mr-2" />
              Adding…
            </>
          ) : (
            "Add service"
          )}
        </Button>
      </WizardPanelFooter>
    </WizardPanel>
  );
}
