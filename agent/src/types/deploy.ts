export type DeploymentMethod = "DOCKERFILE" | "COMPOSE" | "IMAGE";

export interface DeployServicePayload {
  id: string;
  name: string;
  deploymentMethod: DeploymentMethod;
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
  githubToken: string;
  workspaceRoot: string;
  services: DeployServicePayload[];
  env: Record<string, string>;
}
