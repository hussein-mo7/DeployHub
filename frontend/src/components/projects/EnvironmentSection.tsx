import { Link } from "react-router-dom";
import { useState } from "react";
import { GitBranch, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { serverDetailPath } from "@/constants/routes";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { EnvironmentDeploymentsPanel } from "@/components/projects/EnvironmentDeploymentsPanel";
import { EnvironmentVariablesPanel } from "@/components/projects/EnvironmentVariablesPanel";
import { Button } from "@/components/ui/button";
import type { EnvironmentSummary } from "@/types/projects.types";
import type { ServerStatus } from "@/types/servers.types";

type EnvironmentTab = "deployments" | "variables";

const tabs: { id: EnvironmentTab; label: string }[] = [
  { id: "deployments", label: "Deployments & logs" },
  { id: "variables", label: "Environment variables" },
];

interface EnvironmentSectionProps {
  projectId: string;
  environment: EnvironmentSummary;
  onDelete: () => void;
  onAutoDeployChange: (enabled: boolean) => void;
  isDeletePending?: boolean;
  isAutoDeployPending?: boolean;
}

export function EnvironmentSection({
  projectId,
  environment,
  onDelete,
  onAutoDeployChange,
  isDeletePending,
  isAutoDeployPending,
}: EnvironmentSectionProps) {
  const [activeTab, setActiveTab] = useState<EnvironmentTab>("deployments");

  return (
    <article className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-foreground">{environment.name}</h4>
            <ServerStatusBadge status={environment.serverStatus as ServerStatus} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={serverDetailPath(environment.serverId)}
              className="inline-flex items-center rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary"
            >
              {environment.serverName}
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              {environment.branch}
            </span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={environment.autoDeployEnabled}
              disabled={isAutoDeployPending}
              onChange={(e) => onAutoDeployChange(e.target.checked)}
            />
            <span className="text-muted-foreground">
              Auto deploy on push to{" "}
              <span className="font-mono text-xs text-foreground">{environment.branch}</span>
            </span>
          </label>
          {environment.autoDeployEnabled && (
            <p className="text-xs text-muted-foreground">
              Requires GitHub connected, push webhooks reaching your API, worker running, and an
              online agent on this server.
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isDeletePending}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Remove</span>
        </Button>
      </div>

      <div
        className="flex gap-0 border-y border-border px-4 sm:px-5"
        role="tablist"
        aria-label={`${environment.name} sections`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={cn(
              "relative -mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-muted/10 p-4 sm:p-5" role="tabpanel">
        {activeTab === "deployments" && (
          <EnvironmentDeploymentsPanel
            embedded
            projectId={projectId}
            environmentId={environment.id}
            serverStatus={environment.serverStatus as ServerStatus}
          />
        )}
        {activeTab === "variables" && (
          <EnvironmentVariablesPanel
            embedded
            projectId={projectId}
            environmentId={environment.id}
            environmentName={environment.name}
          />
        )}
      </div>
    </article>
  );
}
