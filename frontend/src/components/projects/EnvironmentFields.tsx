import { Link } from "react-router-dom";
import { Server } from "lucide-react";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { OptionCard } from "@/components/ui/option-card";
import { ROUTES } from "@/constants/routes";
import type { ServerSummary } from "@/types/servers.types";

export interface EnvironmentDraft {
  name: string;
  serverId: string;
  branch: string;
  autoDeployEnabled: boolean;
}

export function defaultEnvironmentDraft(
  servers: ServerSummary[],
  branch = "main",
): EnvironmentDraft {
  const preferred = servers.find((server) => server.status === "ONLINE") ?? servers[0];
  return {
    name: "Production",
    serverId: preferred?.id ?? "",
    branch,
    autoDeployEnabled: false,
  };
}

interface EnvironmentFieldsProps {
  value: EnvironmentDraft;
  onChange: (next: EnvironmentDraft) => void;
  errors: Record<string, string>;
  servers: ServerSummary[];
  branchSuggestions?: string[];
  idPrefix?: string;
}

export function EnvironmentFields({
  value,
  onChange,
  errors,
  servers,
  branchSuggestions = [],
  idPrefix = "environment",
}: EnvironmentFieldsProps) {
  const set = (patch: Partial<EnvironmentDraft>) => onChange({ ...value, ...patch });
  const datalistId = `${idPrefix}-branches`;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Target server</p>
          <Link to={ROUTES.SERVER_NEW} className="text-xs font-medium text-primary hover:underline">
            Add server
          </Link>
        </div>
        {servers.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">No servers yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a VPS and install the agent, then come back to pick it here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Target server">
            {servers.map((server) => (
              <OptionCard
                key={server.id}
                selected={value.serverId === server.id}
                onSelect={() => set({ serverId: server.id })}
                icon={Server}
                title={server.name}
                badge={<ServerStatusBadge status={server.status} />}
                description={
                  server.status === "ONLINE"
                    ? (server.description ?? "Agent online — ready to deploy.")
                    : "Agent not online yet — deploys will wait until it connects."
                }
              />
            ))}
          </div>
        )}
        {errors.serverId && <p className="text-xs text-destructive">{errors.serverId}</p>}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`${idPrefix}-name`}
          label="Environment name"
          hint="e.g. Production, Staging, Preview."
          error={errors.name}
        >
          <Input
            id={`${idPrefix}-name`}
            placeholder="Production"
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </FormField>
        <FormField
          id={`${idPrefix}-branch`}
          label="Branch"
          hint="Deploys build from the latest commit on this branch."
          error={errors.branch}
        >
          <Input
            id={`${idPrefix}-branch`}
            className="font-mono text-xs"
            placeholder="main"
            list={branchSuggestions.length ? datalistId : undefined}
            value={value.branch}
            onChange={(e) => set({ branch: e.target.value })}
          />
          {branchSuggestions.length > 0 && (
            <datalist id={datalistId}>
              {branchSuggestions.map((branch) => (
                <option key={branch} value={branch} />
              ))}
            </datalist>
          )}
        </FormField>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-input"
          checked={value.autoDeployEnabled}
          onChange={(e) => set({ autoDeployEnabled: e.target.checked })}
        />
        <span>
          <span className="block text-sm font-medium text-foreground">Auto deploy on push</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Deploy automatically when commits land on{" "}
            <span className="font-mono">{value.branch || "the branch"}</span>. Requires GitHub
            webhooks to reach your API.
          </span>
        </span>
      </label>
    </div>
  );
}
