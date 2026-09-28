import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { projectQueryKey, useProject } from "@/components/projects/project-context";
import { Button } from "@/components/ui/button";
import { PageSection, PageSectionHeader, PageSections } from "@/components/layout/PageSection";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ButtonSpinner } from "@/components/ui/loading-state";
import { ROUTES } from "@/constants/routes";
import { zodFieldErrors } from "@/lib/form-errors";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { updateProjectSchema } from "@/lib/validations/projects.schema";
import * as projectsService from "@/services/projects.service";

export function ProjectSettingsPage() {
  const project = useProject();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const saved = {
    name: project.name,
    description: project.description ?? "",
    repoOwner: project.repoOwner,
    repoName: project.repoName,
  };
  const [form, setForm] = useState(saved);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = (Object.keys(saved) as Array<keyof typeof saved>).some(
    (key) => form[key].trim() !== saved[key],
  );

  const updateMutation = useMutation({
    mutationFn: () =>
      projectsService.updateProject(project.id, {
        name: form.name.trim(),
        description: form.description.trim() ? form.description.trim() : null,
        repoOwner: form.repoOwner.trim(),
        repoName: form.repoName.trim(),
      }),
    onSuccess: () => {
      toastSuccess("Project settings saved.");
      void queryClient.invalidateQueries({ queryKey: projectQueryKey(project.id) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => toastApiError(err, "Failed to update project"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsService.deleteProject(project.id),
    onSuccess: () => {
      toastSuccess(`${project.name} deleted.`);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(ROUTES.PROJECTS);
    },
    onError: (err) => toastApiError(err, "Failed to delete project"),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = updateProjectSchema.safeParse({
      name: form.name,
      description: form.description.trim() ? form.description.trim() : null,
      repoOwner: form.repoOwner,
      repoName: form.repoName,
    });
    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return;
    }
    updateMutation.mutate();
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete this project",
      description: `This permanently removes “${project.name}”, including services, environments, variables, and deploy history. Containers already running on your servers are not stopped.`,
      confirmLabel: "Delete project",
      confirmMatch: project.name,
    });
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  return (
    <PageSections className="w-full">
      <PageSection>
        <PageSectionHeader
          title="General"
          description="Name, description, and the repository DeployHub clones."
        />
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="settings-name" label="Project name" error={errors.name}>
                <Input
                  id="settings-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </FormField>
              <FormField id="settings-description" label="Description" optional error={errors.description}>
                <Input
                  id="settings-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormField>
              <FormField id="settings-owner" label="Repository owner" error={errors.repoOwner}>
                <Input
                  id="settings-owner"
                  value={form.repoOwner}
                  onChange={(e) => setForm({ ...form, repoOwner: e.target.value })}
                />
              </FormField>
              <FormField id="settings-repo" label="Repository name" error={errors.repoName}>
                <Input
                  id="settings-repo"
                  value={form.repoName}
                  onChange={(e) => setForm({ ...form, repoName: e.target.value })}
                />
              </FormField>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
              {isDirty && (
                <Button type="button" variant="ghost" onClick={() => setForm(saved)}>
                  Discard
                </Button>
              )}
              <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                {updateMutation.isPending && <ButtonSpinner className="mr-2" />}
                Save changes
              </Button>
            </div>
          </form>
      </PageSection>

      <PageSection className="border-t border-destructive/25 pt-10">
        <PageSectionHeader
          title={<span className="text-destructive">Danger zone</span>}
          className="border-destructive/20"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Delete this project</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Removes services, environments, variables, and history. You’ll type{" "}
              <span className="font-mono text-foreground">{project.name}</span> to confirm.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="shrink-0"
            disabled={deleteMutation.isPending}
            onClick={() => void handleDelete()}
          >
            <Trash2 className="h-4 w-4" />
            {deleteMutation.isPending ? "Deleting…" : "Delete project"}
          </Button>
        </div>
      </PageSection>
    </PageSections>
  );
}
