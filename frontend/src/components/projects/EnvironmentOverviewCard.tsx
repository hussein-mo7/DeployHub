import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, KeyRound, Rocket, ScrollText, Server } from "lucide-react";
import { DeploymentStatusBadge } from "@/components/deployments/DeploymentStatusBadge";
import { ServerStatusBadge } from "@/components/servers/ServerStatusBadge";
import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/loading-state";
import { projectSectionPath } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime, formatDistanceToNow } from "@/lib/format-date";
import { toastError, toastSuccess } from "@/lib/toast";
import * as deploymentsService from "@/services/deployments.service";
import type { EnvironmentSummary } from "@/types/projects.types";
import type { ServerStatus } from "@/types/servers.types";

export function environmentDeploymentsQueryKey(projectId: string, environmentId: string) {
  return ["projects", projectId, "environments", environmentId, "deployments"] as const;
}

interface EnvironmentOverviewCardProps {
  projectId: string;
  environment: EnvironmentSummary;
  canDeploy: boolean;
}

export function EnvironmentOverviewCard({ projectId, environment, canDeploy }: EnvironmentOverviewCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listKey = environmentDeploymentsQueryKey(projectId, environment.id);

  const { data } = useQuery({
    queryKey: listKey,
    queryFn: () => deploymentsService.listEnvironmentDeployments(projectId, environment.id),
  });

  const latest = data?.deployments[0];
  const serverOnline = environment.serverStatus === "ONLINE";
  const hasActive = latest ? deploymentsService.isActiveDeploymentStatus(latest.status) : false;

  const deployMutation = useMutation({
    mutationFn: () => deploymentsService.createDeployment(projectId, environment.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
      toastSuccess(`Deploying ${environment.name}…`);
      navigate(projectSectionPath(projectId, "deployments", environment.id));
    },
    onError: (err) => {
      toastError(getApiErrorMessage(err, "Failed to start deployment"));
    },
  });

  return (
    <article className="flex flex-col rounded-xl border bg-card shadow-none">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-2">
          <h3 className="text-base font-semibold text-foreground">{environment.name}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              {environment.serverName}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <GitBranch className="h-3.5 w-3.5" />
              {environment.branch}
            </span>
          </div>
        </div>
        <ServerStatusBadge status={environment.serverStatus as ServerStatus} />
      </div>

      <div className="mx-5 flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
        {latest ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <DeploymentStatusBadge status={latest.status} />
              {latest.gitCommitSha && (
                <span className="font-mono text-xs text-muted-foreground">
                  {latest.gitCommitSha.slice(0, 7)}
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground" title={formatDateTime(latest.createdAt)}>
              {formatDistanceToNow(latest.createdAt)}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Never deployed</span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 p-5">
        <Button
          size="sm"
          disabled={!canDeploy || !serverOnline || hasActive || deployMutation.isPending}
          onClick={() => deployMutation.mutate()}
          title={
            !canDeploy
              ? "Add a service first"
              : !serverOnline
                ? "Agent must be online"
                : hasActive
                  ? "A deployment is already running"
                  : undefined
          }
        >
          {deployMutation.isPending ? <ButtonSpinner className="mr-2" /> : <Rocket className="h-4 w-4" />}
          {latest ? "Redeploy" : "Deploy"}
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to={projectSectionPath(projectId, "deployments", environment.id)}>
            <ScrollText className="h-4 w-4" />
            Logs
          </Link>
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link to={projectSectionPath(projectId, "variables", environment.id)}>
            <KeyRound className="h-4 w-4" />
            Variables
          </Link>
        </Button>
      </div>
    </article>
  );
}
