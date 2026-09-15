export const DEPLOYMENT_STATUSES = [
  "PENDING",
  "QUEUED",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
] as const;

export const ACTIVE_DEPLOYMENT_STATUSES = ["PENDING", "QUEUED", "RUNNING"] as const;

export const DEPLOYMENT_TRIGGERS = ["MANUAL", "SAVE_AND_REDEPLOY", "WEBHOOK", "ROLLBACK"] as const;

export const DEPLOYMENT_QUEUE_JOB = "deploy-environment";

export type DeploymentStatusValue = (typeof DEPLOYMENT_STATUSES)[number];
export type DeploymentTriggerValue = (typeof DEPLOYMENT_TRIGGERS)[number];
