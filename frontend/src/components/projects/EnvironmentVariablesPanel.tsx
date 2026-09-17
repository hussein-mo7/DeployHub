import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { saveEnvironmentVariablesSchema } from "@/lib/validations/projects.schema";
import * as projectsService from "@/services/projects.service";
import type { EnvVariableDraft } from "@/types/projects.types";

const SECRET_MASK_DISPLAY = "••••••••";

const emptyRow = (): EnvVariableDraft => ({
  key: "",
  value: "",
  isSecret: true,
});

function variablesToDrafts(
  variables: Awaited<
    ReturnType<typeof projectsService.listEnvironmentVariables>
  >["variables"],
): EnvVariableDraft[] {
  if (variables.length === 0) {
    return [emptyRow()];
  }

  return variables.map((variable) => {
    const encrypted = variable.isSecret || variable.hasValue;
    return {
      id: variable.id,
      key: variable.key,
      value: variable.isSecret ? "" : (variable.value ?? ""),
      isSecret: true,
      maskedValue: variable.maskedValue,
      hasStoredSecret: encrypted && variable.hasValue,
    };
  });
}

function snapshotRows(rows: EnvVariableDraft[]): string {
  return JSON.stringify(
    rows
      .filter((row) => row.key.trim())
      .map((row) => ({
        id: row.id ?? null,
        key: row.key.trim(),
        value: row.value.trim(),
      })),
  );
}

interface EnvironmentVariablesPanelProps {
  projectId: string;
  environmentId: string;
  environmentName: string;
  embedded?: boolean;
}

export function EnvironmentVariablesPanel({
  projectId,
  environmentId,
  environmentName,
  embedded = false,
}: EnvironmentVariablesPanelProps) {
  const queryClient = useQueryClient();
  const queryKey = ["projects", projectId, "environments", environmentId, "variables"];
  const [rows, setRows] = useState<EnvVariableDraft[]>([emptyRow()]);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
  const [revealLoadingId, setRevealLoadingId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => projectsService.listEnvironmentVariables(projectId, environmentId),
  });

  useEffect(() => {
    if (!data?.variables) {
      return;
    }
    const drafts = variablesToDrafts(data.variables);
    setRows(drafts);
    setSavedSnapshot(snapshotRows(drafts));
    setRevealedValues({});
    setFieldErrors({});
    setActionError(null);
  }, [data?.variables, environmentId, projectId]);

  const isDirty = useMemo(
    () => snapshotRows(rows) !== savedSnapshot,
    [rows, savedSnapshot],
  );

  const saveMutation = useMutation({
    mutationFn: (redeploy: boolean) => {
      const payload = {
        variables: rows
          .filter((row) => row.key.trim())
          .map((row) => ({
            key: row.key.trim(),
            ...(row.value.trim() ? { value: row.value } : {}),
            isSecret: true,
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
      setRevealedValues({});
      setSuccessMessage(
        redeploy ? "Variables saved and redeploy queued." : "Variables saved.",
      );
      queryClient.setQueryData(queryKey, { variables: result.variables });
      const drafts = variablesToDrafts(result.variables);
      setRows(drafts);
      setSavedSnapshot(snapshotRows(drafts));
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "Validation failed") {
        return;
      }
      setActionError(getApiErrorMessage(err, "Failed to save variables"));
    },
  });

  const updateRow = (index: number, patch: Partial<EnvVariableDraft>) => {
    setSuccessMessage(null);
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }
        const next = { ...row, ...patch, isSecret: true };
        if (patch.value !== undefined && patch.value.trim()) {
          next.hasStoredSecret = false;
        }
        return next;
      }),
    );
  };

  const addRow = () => {
    setSuccessMessage(null);
    setRows((current) => [...current, emptyRow()]);
  };

  const removeRow = (index: number) => {
    setSuccessMessage(null);
    setRows((current) => (current.length === 1 ? [emptyRow()] : current.filter((_, i) => i !== index)));
  };

  const discardChanges = () => {
    if (!data?.variables) {
      return;
    }
    const drafts = variablesToDrafts(data.variables);
    setRows(drafts);
    setSavedSnapshot(snapshotRows(drafts));
    setRevealedValues({});
    setFieldErrors({});
    setActionError(null);
    setSuccessMessage(null);
  };

  const toggleReveal = async (row: EnvVariableDraft) => {
    if (!row.id) {
      return;
    }

    if (revealedValues[row.id] !== undefined) {
      setRevealedValues((current) => {
        const next = { ...current };
        delete next[row.id!];
        return next;
      });
      return;
    }

    setRevealLoadingId(row.id);
    try {
      const result = await projectsService.revealEnvironmentVariable(
        projectId,
        environmentId,
        row.id,
      );
      setRevealedValues((current) => ({ ...current, [row.id!]: result.value }));
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Could not reveal value"));
    } finally {
      setRevealLoadingId(null);
    }
  };

  return (
    <div className={embedded ? "space-y-4" : "mt-4 space-y-4 rounded-lg border bg-card p-4"}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {!embedded && (
            <h5 className="text-sm font-medium">Environment variables</h5>
          )}
          <p className="text-sm text-muted-foreground">
            {embedded
              ? "All values are encrypted at rest. Edit keys or values, then save — nothing is sent until you click Save."
              : `Runtime config for ${environmentName}. Values are encrypted — use the eye icon to reveal.`}
          </p>
        </div>
        {isDirty && (
          <span className="inline-flex w-fit items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            Unsaved changes
          </span>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading variables…</p>}

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

      {successMessage && !isDirty && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2.5 font-medium">Key</th>
                    <th className="px-3 py-2.5 font-medium">Value</th>
                    <th className="w-12 px-2 py-2.5" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const revealed = row.id ? revealedValues[row.id] !== undefined : false;
                    const showStoredMask =
                      row.hasStoredSecret && !row.value.trim() && !revealed;
                    const inputValue = row.value.trim()
                      ? row.value
                      : revealed && row.id
                        ? revealedValues[row.id]
                        : showStoredMask
                          ? (row.maskedValue ?? SECRET_MASK_DISPLAY)
                          : row.value;

                    return (
                      <tr key={row.id ?? `new-${index}`} className="border-b last:border-0">
                        <td className="px-3 py-2 align-top">
                          <Input
                            id={`env-key-${environmentId}-${index}`}
                            placeholder="API_KEY"
                            value={row.key}
                            className="font-mono text-xs"
                            onChange={(e) => updateRow(index, { key: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex gap-1">
                            <Input
                              id={`env-value-${environmentId}-${index}`}
                              type={!revealed && showStoredMask ? "password" : "text"}
                              placeholder={
                                row.hasStoredSecret ? "Leave blank to keep current value" : "Value"
                              }
                              value={inputValue}
                              readOnly={showStoredMask}
                              className="font-mono text-xs"
                              onChange={(e) => updateRow(index, { value: e.target.value })}
                            />
                            {row.hasStoredSecret && row.id && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                disabled={revealLoadingId === row.id}
                                aria-label={revealed ? "Hide value" : "Reveal value"}
                                onClick={() => void toggleReveal(row)}
                              >
                                {revealed ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                          {showStoredMask && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              Encrypted
                            </p>
                          )}
                          {fieldErrors[index] && (
                            <p className="mt-1 text-xs text-destructive">{fieldErrors[index]}</p>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remove variable"
                            onClick={() => removeRow(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className={cn(
              "flex flex-col gap-3 rounded-lg border bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
              isDirty && "border-primary/30 bg-primary/5",
            )}
          >
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4" />
              Add variable
            </Button>
            <div className="flex flex-wrap gap-2">
              {isDirty && (
                <Button type="button" variant="ghost" size="sm" onClick={discardChanges}>
                  Discard
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={!isDirty || saveMutation.isPending}
                onClick={() => {
                  setSuccessMessage(null);
                  void saveMutation.mutateAsync(false);
                }}
              >
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!isDirty || saveMutation.isPending}
                onClick={() => {
                  setSuccessMessage(null);
                  void saveMutation.mutateAsync(true);
                }}
              >
                Save & redeploy
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
