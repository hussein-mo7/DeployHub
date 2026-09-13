import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEnvironmentSchema } from "@/lib/validations/projects.schema";
import type { ServerSummary } from "@/types/servers.types";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface CreateEnvironmentFormProps {
  servers: ServerSummary[];
  onSubmit: (values: {
    name: string;
    serverId: string;
    branch: string;
    autoDeployEnabled: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function CreateEnvironmentForm({
  servers,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: CreateEnvironmentFormProps) {
  const [form, setForm] = useState({
    name: "Production",
    serverId: servers[0]?.id ?? "",
    branch: "main",
    autoDeployEnabled: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = createEnvironmentSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    await onSubmit(result.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add environment</CardTitle>
        <CardDescription>
          Choose which server and branch this project deploys to.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {servers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a server first before creating an environment.
          </p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="environment-name">Name</Label>
              <Input
                id="environment-name"
                placeholder="Production"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment-server">Server</Label>
              <select
                id="environment-server"
                className={selectClassName}
                value={form.serverId}
                onChange={(e) => setForm({ ...form, serverId: e.target.value })}
              >
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name} ({server.status})
                  </option>
                ))}
              </select>
              {fieldErrors.serverId && (
                <p className="text-xs text-destructive">{fieldErrors.serverId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment-branch">Branch</Label>
              <Input
                id="environment-branch"
                placeholder="main"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              />
              {fieldErrors.branch && (
                <p className="text-xs text-destructive">{fieldErrors.branch}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="auto-deploy"
                type="checkbox"
                checked={form.autoDeployEnabled}
                onChange={(e) => setForm({ ...form, autoDeployEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="auto-deploy" className="font-normal">
                Enable auto deploy (Phase 10)
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add environment"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
