export const DEPLOYMENT_METHODS = ["DOCKERFILE", "COMPOSE", "IMAGE"] as const;

export type DeploymentMethod = (typeof DEPLOYMENT_METHODS)[number];

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  repoOwner: string;
  repoName: string;
  repoFullName: string;
  serviceCount: number;
  environmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSummary {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  deploymentMethod: DeploymentMethod;
  dockerfilePath: string;
  composeFilePath: string;
  imageName: string | null;
  buildContext: string;
  port: number | null;
  healthCheckPath: string;
  healthCheckEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentSummary {
  id: string;
  projectId: string;
  name: string;
  serverId: string;
  serverName: string;
  serverStatus: string;
  branch: string;
  autoDeployEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  services: ServiceSummary[];
  environments: EnvironmentSummary[];
}

export interface ListProjectsResponse {
  projects: ProjectSummary[];
}

export interface GetProjectResponse {
  project: ProjectDetail;
}

export interface CreateProjectResponse {
  project: ProjectSummary;
}

export interface UpdateProjectResponse {
  project: ProjectSummary;
}

export interface DeleteProjectResponse {
  message: string;
}

export interface ListServicesResponse {
  services: ServiceSummary[];
}

export interface CreateServiceResponse {
  service: ServiceSummary;
}

export interface DeleteServiceResponse {
  message: string;
}

export interface ListEnvironmentsResponse {
  environments: EnvironmentSummary[];
}

export interface CreateEnvironmentResponse {
  environment: EnvironmentSummary;
}

export interface DeleteEnvironmentResponse {
  message: string;
}

export interface EnvironmentVariableSummary {
  id: string;
  environmentId: string;
  key: string;
  value: string | null;
  maskedValue: string | null;
  isSecret: boolean;
  hasValue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListEnvironmentVariablesResponse {
  variables: EnvironmentVariableSummary[];
}

export interface SaveEnvironmentVariablesResponse {
  variables: EnvironmentVariableSummary[];
  redeployQueued: boolean;
}

export interface RevealEnvironmentVariableResponse {
  variableId: string;
  key: string;
  value: string;
}

export interface EnvVariableDraft {
  id?: string;
  key: string;
  value: string;
  isSecret: boolean;
  maskedValue?: string | null;
  /** Secret exists on server; empty value field means keep unchanged */
  hasStoredSecret?: boolean;
}
