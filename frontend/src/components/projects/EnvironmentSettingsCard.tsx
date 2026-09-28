import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { PageSection, PageSectionHeader } from "@/components/layout/PageSection";
import { projectQueryKey } from "@/components/projects/project-context";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FormField, nativeSelectClassName } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ButtonSpinner } from "@/components/ui/loading-state";
import { toastApiError, toastSuccess } from "@/lib/toast";
import * as projectsService from "@/services/projects.service";
import * as serversService from "@/services/servers.service";
import type { EnvironmentSummary } from "@/types/projects.types";

/** Name, branch, server, auto-deploy, and delete for one environment. */
export function EnvironmentSettingsCard({
  projectId,
  environment,
}: {
  projectId: string;
  environment: EnvironmentSummary;
}) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const [form, setForm] = useState({
    name: environment.name,
    branch: environment.branch,
    serverId: environment.serverId,
  });

  const { data: serversData } = useQuery({
    queryKey: ["servers"],
    queryFn: serversService.listServers,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const updateMutation = useMutation({
    mutationFn: (input: Parameters<typeof projectsService.updateEnvironment>[2]) =>
      projectsService.updateEnvironment(projectId, environment.id, input),
    onSuccess: (_result, input) => {
      refresh();
      if (input.autoDeployEnabled === undefined) {
        toastSuccess("Environment updated.");
      }
    },
    onError: (err) => toastApiError(err, "Failed to update environment"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsService.deleteEnvironment(projectId, environment.id),
    onSuccess: () => {
      toastSuccess(`${environment.name} deleted.`);
      refresh();
    },
    onError: (err) => toastApiError(err, "Failed to delete environment"),
  });

  const formDirty =
    form.name.trim() !== environment.name ||
    form.branch.trim() !== environment.branch ||
    form.serverId !== environment.serverId;

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete ${environment.name}`,
      description:
        "Variables and deploy history for this environment are removed. Containers already running on the server are not stopped.",
      confirmLabel: "Delete environment",
      confirmMatch: environment.name,
    });
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  const servers = serversData?.servers ?? [
    { id: environment.serverId, name: environment.serverName, status: environment.serverStatus },
  ];

  return (
    <PageSection>
      <PageSectionHeader
        title="Environment"
        description={`Where ${environment.name} deploys, and whether pushes deploy automatically.`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id={`env-${environment.id}-name`} label="Name">
          <Input
            id={`env-${environment.id}-name`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>
        <FormField id={`env-${environment.id}-branch`} label="Branch">
          <Input
            id={`env-${environment.id}-branch`}
            className="font-mono text-xs"
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
          />
        </FormField>
        <FormField id={`env-${environment.id}-server`} label="Server">
          <select
            id={`env-${environment.id}-server`}
            className={nativeSelectClassName}
            value={form.serverId}
            onChange={(e) => setForm({ ...form, serverId: e.target.value })}
          >
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name} · {server.status.toLowerCase()}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-input"
            checked={environment.autoDeployEnabled}
            disabled={updateMutation.isPending}
            onChange={(e) => updateMutation.mutate({ autoDeployEnabled: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-medium text-foreground">Auto deploy on push</span>
            <span className="block text-xs text-muted-foreground">
              Deploy when commits land on <span className="font-mono">{environment.branch}</span>.
            </span>
          </span>
        </label>
        <div className="flex shrink-0 gap-2">
          {formDirty && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setForm({
                  name: environment.name,
                  branch: environment.branch,
                  serverId: environment.serverId,
                })
              }
            >
              Discard
            </Button>
          )}
          <Button
            size="sm"
            disabled={!formDirty || updateMutation.isPending}
            onClick={() =>
              updateMutation.mutate({
                name: form.name.trim(),
                branch: form.branch.trim(),
                serverId: form.serverId,
              })
            }
          >
            {updateMutation.isPending && formDirty && <ButtonSpinner className="mr-2" />}
            Save environment
          </Button>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-destructive/25 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Delete this environment</p>
          <p className="text-xs text-muted-foreground">
            You’ll be asked to type its name. This cannot be undone.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="shrink-0"
          disabled={deleteMutation.isPending}
          onClick={() => void handleDelete()}
        >
          <Trash2 className="h-4 w-4" />
          {deleteMutation.isPending ? "Deleting…" : "Delete environment"}
        </Button>
      </div>
    </PageSection>
  );
}
