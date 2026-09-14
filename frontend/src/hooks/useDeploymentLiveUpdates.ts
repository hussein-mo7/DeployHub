import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  patchDeploymentLogInCache,
  patchDeploymentStatusInCache,
} from "@/lib/deployment-cache";
import { getUserSocket, joinDeploymentRoom, leaveDeploymentRoom } from "@/lib/deployment-socket";
import type { DeploymentLogEntry, DeploymentStatus } from "@/types/deployments.types";

interface UseDeploymentLiveUpdatesOptions {
  deploymentId: string | null;
  /** When set, deployment list queries for an environment are patched on status changes. */
  environmentListQueryKey?: readonly unknown[];
}

export function useDeploymentLiveUpdates({
  deploymentId,
  environmentListQueryKey,
}: UseDeploymentLiveUpdatesOptions): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!deploymentId) {
      return;
    }

    const socket = getUserSocket();
    joinDeploymentRoom(deploymentId);

    const onLog = (log: DeploymentLogEntry) => {
      if (log.deploymentId !== deploymentId) {
        return;
      }
      patchDeploymentLogInCache(queryClient, deploymentId, log);
    };

    const onStatus = (payload: { status?: DeploymentStatus; errorMessage?: string | null }) => {
      if (!payload?.status) {
        return;
      }
      patchDeploymentStatusInCache(
        queryClient,
        deploymentId,
        payload.status,
        payload.errorMessage ?? null,
        environmentListQueryKey,
      );
    };

    const onConnect = () => {
      joinDeploymentRoom(deploymentId);
    };

    socket.on("connect", onConnect);
    socket.on("deployment:log", onLog);
    socket.on("deployment:status", onStatus);

    return () => {
      socket.off("connect", onConnect);
      socket.off("deployment:log", onLog);
      socket.off("deployment:status", onStatus);
      leaveDeploymentRoom(deploymentId);
    };
  }, [deploymentId, environmentListQueryKey, queryClient]);
}
