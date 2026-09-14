import type { QueryClient } from "@tanstack/react-query";
import type {
  DeploymentLogEntry,
  DeploymentStatus,
  GetDeploymentResponse,
  ListEnvironmentDeploymentsResponse,
} from "@/types/deployments.types";

export function deploymentDetailQueryKey(deploymentId: string) {
  return ["deployments", deploymentId] as const;
}

export function patchDeploymentLogInCache(
  queryClient: QueryClient,
  deploymentId: string,
  log: DeploymentLogEntry,
): void {
  queryClient.setQueryData<GetDeploymentResponse>(
    deploymentDetailQueryKey(deploymentId),
    (current) => {
      if (!current) {
        return current;
      }
      if (current.deployment.logs.some((entry) => entry.id === log.id)) {
        return current;
      }
      return {
        deployment: {
          ...current.deployment,
          logs: [...current.deployment.logs, log],
        },
      };
    },
  );
}

export function patchDeploymentStatusInCache(
  queryClient: QueryClient,
  deploymentId: string,
  status: DeploymentStatus,
  errorMessage: string | null,
  listQueryKey?: readonly unknown[],
): void {
  queryClient.setQueryData<GetDeploymentResponse>(
    deploymentDetailQueryKey(deploymentId),
    (current) => {
      if (!current) {
        return current;
      }
      return {
        deployment: {
          ...current.deployment,
          status,
          errorMessage,
          updatedAt: new Date().toISOString(),
          finishedAt:
            status === "SUCCESS" || status === "FAILED" || status === "CANCELLED"
              ? new Date().toISOString()
              : current.deployment.finishedAt,
        },
      };
    },
  );

  if (listQueryKey) {
    queryClient.setQueryData<ListEnvironmentDeploymentsResponse>(listQueryKey, (current) => {
      if (!current) {
        return current;
      }
      return {
        deployments: current.deployments.map((deployment) =>
          deployment.id === deploymentId
            ? { ...deployment, status, errorMessage, updatedAt: new Date().toISOString() }
            : deployment,
        ),
      };
    });
  }

  queryClient.setQueryData<import("@/types/deployments.types").DeploymentSummary[]>(
    ["deployments", "recent"],
    (current) => {
      if (!current) {
        return current;
      }
      return current.map((deployment) =>
        deployment.id === deploymentId
          ? { ...deployment, status, errorMessage, updatedAt: new Date().toISOString() }
          : deployment,
      );
    },
  );
}
