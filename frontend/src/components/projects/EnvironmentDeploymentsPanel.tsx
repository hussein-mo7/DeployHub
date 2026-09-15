import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Rocket, RotateCcw, Square } from "lucide-react";
import { DeploymentStatusBadge } from "@/components/deployments/DeploymentStatusBadge";
import { Button } from "@/components/ui/button";
import { useDeploymentLiveUpdates } from "@/hooks/useDeploymentLiveUpdates";
import { getApiErrorMessage } from "@/lib/api-error";
import { deploymentDetailQueryKey } from "@/lib/deployment-cache";
import { formatDateTime } from "@/lib/format-date";
import * as deploymentsService from "@/services/deployments.service";
import type { DeploymentSummary, ListEnvironmentDeploymentsResponse } from "@/types/deployments.types";
import type { ServerStatus } from "@/types/servers.types";

function deploymentsQueryKey(projectId: string, environmentId: string) {
  return ["projects", projectId, "environments", environmentId, "deployments"] as const;
}

function formatTrigger(trigger: DeploymentSummary["trigger"]): string {
  if (trigger === "SAVE_AND_REDEPLOY") {
    return "save & redeploy";
  }
  if (trigger === "ROLLBACK") {
    return "rollback";
  }
  return trigger.toLowerCase();
}

interface EnvironmentDeploymentsPanelProps {
  projectId: string;
  environmentId: string;
  serverStatus: ServerStatus;
}

export function EnvironmentDeploymentsPanel({
  projectId,
  environmentId,
  serverStatus,
}: EnvironmentDeploymentsPanelProps) {
  const queryClient = useQueryClient();
  const logEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (deployment?.logs.length) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [deployment?.logs.length, deployment?.updatedAt]);

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
    <div className="mt-4 space-y-4 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">Deployments</p>
        <div className="flex flex-wrap gap-2">
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
        <p className="text-sm text-muted-foreground">No deployments yet. Run your first deploy.</p>
      ) : (
        <div className="space-y-2">
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
            {deployments.map((item: DeploymentSummary) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`flex w-full flex-wrap items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted/80 ${
                    selectedId === item.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <DeploymentStatusBadge status={item.status} />
                    <span className="text-muted-foreground">{formatTrigger(item.trigger)}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>

          {selectedId && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {selectedSummary && <DeploymentStatusBadge status={selectedSummary.status} />}
                {deployment?.errorMessage && (
                  <span className="text-destructive">{deployment.errorMessage}</span>
                )}
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
              </div>

              <div className="max-h-80 overflow-y-auto rounded-md border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
                {detailLoading && !deployment ? (
                  <p className="text-muted-foreground">Loading logs…</p>
                ) : deployment && deployment.logs.length === 0 ? (
                  <p className="text-muted-foreground">Waiting for logs…</p>
                ) : (
                  deployment?.logs.map((log) => (
                    <div key={log.id} className="whitespace-pre-wrap break-all">
                      {log.message}
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
