import type { DeploymentMethod } from "@prisma/client";
import type { DeploymentMethodValue } from "../../constants/projects.js";

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
  deploymentMethod: DeploymentMethodValue;
  dockerfilePath: string;
  composeFilePath: string;
  imageName: string | null;
  buildContext: string;
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

export type { DeploymentMethod };
