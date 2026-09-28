import { Link } from "react-router-dom";
import { GitBranch, Plus, Server } from "lucide-react";
import { projectSectionPath } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { EnvironmentSummary } from "@/types/projects.types";

function statusDotClass(status: string): string {
  if (status === "ONLINE") return "bg-emerald-500";
  if (status === "CONNECTING") return "bg-sky-500";
  if (status === "UNHEALTHY") return "bg-amber-500";
  return "bg-muted-foreground/40";
}

interface EnvironmentPickerProps {
  projectId: string;
  environments: EnvironmentSummary[];
  selectedId: string | undefined;
  onSelect: (environmentId: string) => void;
}

/** Segmented environment switcher with server/branch context for the active one. */
export function EnvironmentPicker({
  projectId,
  environments,
  selectedId,
  onSelect,
}: EnvironmentPickerProps) {
  const selected = environments.find((env) => env.id === selectedId);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Environment">
        {environments.map((env) => {
          const active = env.id === selectedId;
          return (
            <button
              key={env.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(env.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  active ? "bg-primary-foreground" : statusDotClass(env.serverStatus),
                )}
              />
              {env.name}
            </button>
          );
        })}
        <Link
          to={projectSectionPath(projectId, "environments/new")}
          className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Link>
      </div>
      {selected && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5" />
            {selected.serverName}
            <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClass(selected.serverStatus))} />
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono">
            <GitBranch className="h-3.5 w-3.5" />
            {selected.branch}
          </span>
        </div>
      )}
    </div>
  );
}
