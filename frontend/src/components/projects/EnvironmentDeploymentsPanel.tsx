import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Rocket, RotateCcw, Square } from "lucide-react";
import { DeploymentStatusBadge } from "@/components/deployments/DeploymentStatusBadge";
import { LogViewer } from "@/components/deployments/LogViewer";
import { Button } from "@/components/ui/button";
import { useDeploymentLiveUpdates } from "@/hooks/useDeploymentLiveUpdates";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { deploymentDetailQueryKey } from "@/lib/deployment-cache";
import { formatDateTime, formatDistanceToNow } from "@/lib/format-date";
import { formatDeploymentTrigger } from "@/lib/format-deployment";
import * as deploymentsService from "@/services/deployments.service";
import type { DeploymentSummary, ListEnvironmentDeploymentsResponse } from "@/types/deployments.types";
import type { ServerStatus } from "@/types/servers.types";

function deploymentsQueryKey(projectId: string, environmentId: string) {
  return ["projects", projectId, "environments", environmentId, "deployments"] as const;
}

interface EnvironmentDeploymentsPanelProps {
  projectId: string;
  environmentId: string;
  serverStatus: ServerStatus;
  embedded?: boolean;
}

export function EnvironmentDeploymentsPanel({
  projectId,
  environmentId,
  serverStatus,
  embedded = false,
}: EnvironmentDeploymentsPanelProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const listQueryKey = deploymentsQueryKey(projectId, environmentId);

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: listQueryKey,
    queryFn: () => deploymentsService.listEnvironmentDeployments(projectId, environmentId),
    refetchInterval: (query) => {
      const items = query.state.data?.deployments ?? [];
      const hasActive = items.some((d) => deploymentsService.isActiveDeploymentStatus(d.status));
      return hasActive ? 15000 : false;
    },
  });

  const deployments = listData?.deployments ?? [];

  useEffect(() => {
    if (deployments.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !deployments.some((d) => d.id === selectedId)) {
      setSelectedId(deployments[0].id);
    }
  }, [deployments, selectedId]);

  useDeploymentLiveUpdates({
    deploymentId: selectedId,
    environmentListQueryKey: listQueryKey,
  });

  const selectedSummary = deployments.find((d) => d.id === selectedId);

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: deploymentDetailQueryKey(selectedId ?? ""),
    queryFn: () => deploymentsService.getDeployment(selectedId!),
    enabled: Boolean(selectedId),
  });

  const deployment = detailData?.deployment;
  const isActive =
    deployment != null && deploymentsService.isActiveDeploymentStatus(deployment.status);

  const deployMutation = useMutation({
    mutationFn: () => deploymentsService.createDeployment(projectId, environmentId),
    onSuccess: (result) => {
      setActionError(null);
      setSelectedId(result.deployment.id);
      queryClient.setQueryData<ListEnvironmentDeploymentsResponse>(listQueryKey, (current) => {
        if (!current) {
          return { deployments: [result.deployment] };
        }
        return {
          deployments: [result.deployment, ...current.deployments],
        };
      });
      void queryClient.prefetchQuery({
        queryKey: deploymentDetailQueryKey(result.deployment.id),
        queryFn: () => deploymentsService.getDeployment(result.deployment.id),
      });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to start deployment"));
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: () => deploymentsService.rollbackDeployment(selectedId!),
    onSuccess: (result) => {
      setActionError(null);
      setSelectedId(result.deployment.id);
      queryClient.setQueryData<ListEnvironmentDeploymentsResponse>(listQueryKey, (current) => {
        if (!current) {
          return { deployments: [result.deployment] };
        }
        return {
          deployments: [result.deployment, ...current.deployments],
        };
      });
      void queryClient.prefetchQuery({
        queryKey: deploymentDetailQueryKey(result.deployment.id),
        queryFn: () => deploymentsService.getDeployment(result.deployment.id),
      });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to rollback"));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => deploymentsService.cancelDeployment(selectedId!),
    onSuccess: (result) => {
      setActionError(null);
      queryClient.setQueryData<ListEnvironmentDeploymentsResponse>(listQueryKey, (current) => {
        if (!current) {
          return current;
        }
        return {
          deployments: current.deployments.map((item: DeploymentSummary) =>
            item.id === result.deployment.id ? result.deployment : item,
          ),
        };
      });
      void queryClient.invalidateQueries({
        queryKey: deploymentDetailQueryKey(selectedId!),
      });
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err, "Failed to cancel deployment"));
    },
  });

  const serverOffline = serverStatus !== "ONLINE";
  const hasActiveDeployment = deployments.some((d) =>
    deploymentsService.isActiveDeploymentStatus(d.status),
  );
  const canRollback =
    deployment?.status === "SUCCESS" &&
    Boolean(deployment.gitCommitSha) &&
    !hasActiveDeployment &&
    !serverOffline;

  return (
    <div className={embedded ? "space-y-4" : "mt-4 space-y-4 border-t pt-4"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Select a run to inspect logs. Deploy when the agent on this server is online.
        </p>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {isActive && selectedId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              <Square className="h-4 w-4" />
              Cancel
            </Button>
          )}
          {canRollback && selectedId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={rollbackMutation.isPending}
              onClick={() => rollbackMutation.mutate()}
            >
              {rollbackMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Rollback to this
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={deployMutation.isPending || serverOffline}
            onClick={() => deployMutation.mutate()}
          >
            {deployMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            Deploy now
          </Button>
        </div>
      </div>

      {serverOffline && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Agent must be online on the target server before deploying.
        </p>
      )}

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {listLoading ? (
        <p className="text-sm text-muted-foreground">Loading deployment history…</p>
      ) : deployments.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          No deployments yet. Use Deploy now to start the first run.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,280px)_1fr] lg:items-stretch">
          <ul
            className="max-h-[280px] divide-y overflow-y-auto rounded-lg border bg-card lg:max-h-[360px]"
            role="listbox"
            aria-label="Deployment history"
          >
            {deployments.map((item: DeploymentSummary) => {
              const isSelected = selectedId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full flex-col gap-1 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                      isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                    )}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <DeploymentStatusBadge status={item.status} />
                      <span
                        className="shrink-0 text-[11px] text-muted-foreground"
                        title={formatDateTime(item.createdAt)}
                      >
                        {formatDistanceToNow(item.createdAt)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDeploymentTrigger(item.trigger)}
                      {item.gitCommitSha && (
                        <>
                          {" · "}
                          <span className="font-mono">{item.gitCommitSha.slice(0, 7)}</span>
                        </>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex min-h-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {selectedSummary && <DeploymentStatusBadge status={selectedSummary.status} />}
              {deployment?.gitCommitSha && (
                <span className="font-mono text-xs text-muted-foreground">
                  {deployment.gitCommitSha.slice(0, 7)}
                </span>
              )}
              {isActive && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              )}
              {deployment?.errorMessage && (
                <span className="text-xs text-destructive">{deployment.errorMessage}</span>
              )}
            </div>
            <LogViewer
              logs={deployment?.logs}
              isLoading={detailLoading && !deployment}
              followKey={selectedId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
