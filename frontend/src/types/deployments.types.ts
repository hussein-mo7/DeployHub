export const DEPLOYMENT_STATUSES = [
  "PENDING",
  "QUEUED",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
] as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const ACTIVE_DEPLOYMENT_STATUSES = ["PENDING", "QUEUED", "RUNNING"] as const;

export type DeploymentTrigger = "MANUAL" | "SAVE_AND_REDEPLOY" | "WEBHOOK";

export interface DeploymentSummary {
  id: string;
  projectId: string;
  environmentId: string;
  projectName: string;
  environmentName: string;
  status: DeploymentStatus;
  trigger: DeploymentTrigger;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentLogEntry {
  id: string;
  deploymentId: string;
  message: string;
  createdAt: string;
}

export interface DeploymentDetail extends DeploymentSummary {
  logs: DeploymentLogEntry[];
}

export interface ListEnvironmentDeploymentsResponse {
  deployments: DeploymentSummary[];
}

export interface CreateDeploymentResponse {
  deployment: DeploymentSummary;
}

export interface GetDeploymentResponse {
  deployment: DeploymentDetail;
}

export interface CancelDeploymentResponse {
  deployment: DeploymentSummary;
}

export interface DeploymentWithContext extends DeploymentSummary {
  projectId: string;
}
