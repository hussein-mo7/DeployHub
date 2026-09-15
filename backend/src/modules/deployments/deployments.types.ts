import type { DeploymentStatusValue, DeploymentTriggerValue } from "../../constants/deployments.js";
import type { DeploymentMethodValue } from "../../constants/projects.js";

export interface DeploymentSummary {
  id: string;
  projectId: string;
  environmentId: string;
  projectName: string;
  environmentName: string;
  status: DeploymentStatusValue;
  trigger: DeploymentTriggerValue;
  branch: string | null;
  gitCommitSha: string | null;
  rollbackSourceDeploymentId: string | null;
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

export interface DeployServicePayload {
  id: string;
  name: string;
  deploymentMethod: DeploymentMethodValue;
  dockerfilePath: string;
  composeFilePath: string;
  imageName: string | null;
  buildContext: string;
  port: number | null;
  healthCheckPath: string;
  healthCheckEnabled: boolean;
}

export interface DeployCommandPayload {
  deploymentId: string;
  projectId: string;
  environmentId: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  /** When set, agent checks out this commit instead of branch tip */
  gitCommitSha?: string | null;
  githubToken: string;
  workspaceRoot: string;
  services: DeployServicePayload[];
  env: Record<string, string>;
}
