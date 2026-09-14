import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import { saveEnvironmentVariablesSchema } from "@/lib/validations/projects.schema";
import * as projectsService from "@/services/projects.service";
import type { EnvVariableDraft } from "@/types/projects.types";

const emptyRow = (): EnvVariableDraft => ({
  key: "",
  value: "",
  isSecret: false,
});

function variablesToDrafts(
  variables: Awaited<
    ReturnType<typeof projectsService.listEnvironmentVariables>
  >["variables"],
): EnvVariableDraft[] {
  if (variables.length === 0) {
    return [emptyRow()];
  }

  return variables.map((variable) => ({
    key: variable.key,
    value: variable.isSecret ? "" : (variable.value ?? ""),
    isSecret: variable.isSecret,
    hasStoredSecret: variable.isSecret && variable.hasValue,
  }));
}

interface EnvironmentVariablesPanelProps {
  projectId: string;
  environmentId: string;
  environmentName: string;
}

export function EnvironmentVariablesPanel({
  projectId,
  environmentId,
  environmentName,
}: EnvironmentVariablesPanelProps) {
  const queryClient = useQueryClient();
  const queryKey = ["projects", projectId, "environments", environmentId, "variables"];
  const [rows, setRows] = useState<EnvVariableDraft[]>([emptyRow()]);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => projectsService.listEnvironmentVariables(projectId, environmentId),
  });

  useEffect(() => {
    if (data?.variables) {
      setRows(variablesToDrafts(data.variables));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (redeploy: boolean) => {
      const payload = {
        variables: rows
          .filter((row) => row.key.trim())
          .map((row) => ({
            key: row.key.trim(),
            ...(row.value.trim() ? { value: row.value } : {}),
            isSecret: row.isSecret,
          })),
        redeploy,
      };

      const parsed = saveEnvironmentVariablesSchema.safeParse(payload);
      if (!parsed.success) {
        const errors: Record<number, string> = {};
        parsed.error.errors.forEach((issue) => {
          const index = issue.path[1];
          if (typeof index === "number") {
            errors[index] = issue.message;
          }
        });
        setFieldErrors(errors);
        throw new Error("Validation failed");
      }

      setFieldErrors({});
      return projectsService.saveEnvironmentVariables(projectId, environmentId, parsed.data);
    },
    onSuccess: (result, redeploy) => {
      setActionError(null);
      setSuccessMessage(
        redeploy
          ? "Variables saved and redeploy queued."
          : "Variables saved.",
      );
      queryClient.setQueryData(queryKey, { variables: result.variables });
      setRows(variablesToDrafts(result.variables));
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "Validation failed") {
        return;
      }
      setActionError(getApiErrorMessage(err, "Failed to save variables"));
    },
  });

  const updateRow = (index: number, patch: Partial<EnvVariableDraft>) => {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }
        const next = { ...row, ...patch };
        if (patch.value !== undefined && patch.value.trim()) {
          next.hasStoredSecret = false;
        }
        if (patch.isSecret === false) {
          next.hasStoredSecret = false;
        }
        return next;
      }),
    );
  };

  const addRow = () => {
    setRows((current) => [...current, emptyRow()]);
  };

  const removeRow = (index: number) => {
    setRows((current) => (current.length === 1 ? [emptyRow()] : current.filter((_, i) => i !== index)));
  };

  return (
    <div className="mt-4 space-y-4 rounded-md border border-dashed p-4">
      <div>
        <h5 className="text-sm font-medium">Environment variables</h5>
        <p className="text-xs text-muted-foreground">
          Configure runtime variables for {environmentName}. Secrets are encrypted and masked.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading variables...</p>}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, "Failed to load variables")}
        </p>
      )}

      {actionError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          {successMessage}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <div className="space-y-2">
                  <Label htmlFor={`env-key-${environmentId}-${index}`}>Key</Label>
                  <Input
                    id={`env-key-${environmentId}-${index}`}
                    placeholder="MONGODB_URI"
                    value={row.key}
                    onChange={(e) => updateRow(index, { key: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`env-value-${environmentId}-${index}`}>Value</Label>
                  <Input
                    id={`env-value-${environmentId}-${index}`}
                    type={row.isSecret ? "password" : "text"}
                    placeholder={
                      row.isSecret && row.hasStoredSecret
                        ? "Leave blank to keep saved secret"
                        : row.isSecret
                          ? "Secret value"
                          : "production"
                    }
                    value={row.value}
                    onChange={(e) => updateRow(index, { value: e.target.value })}
                  />
                  {row.isSecret && row.hasStoredSecret && !row.value.trim() && (
                    <p className="text-xs text-muted-foreground">
                      Secret saved on server (hidden). Type a new value to replace it.
                    </p>
                  )}
                </div>

                <div className="flex items-end gap-2 pb-2">
                  <input
                    id={`env-secret-${environmentId}-${index}`}
                    type="checkbox"
                    checked={row.isSecret}
                    onChange={(e) => updateRow(index, { isSecret: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor={`env-secret-${environmentId}-${index}`} className="font-normal">
                    Secret
                  </Label>
                </div>

                <div className="flex items-end pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {fieldErrors[index] && (
                  <p className="text-xs text-destructive md:col-span-4">{fieldErrors[index]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4" />
              Add variable
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => {
                setSuccessMessage(null);
                void saveMutation.mutateAsync(false);
              }}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => {
                setSuccessMessage(null);
                void saveMutation.mutateAsync(true);
              }}
            >
              {saveMutation.isPending ? "Saving..." : "Save & redeploy"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
