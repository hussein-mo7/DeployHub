import { api } from "./api";
import type {
  CancelDeploymentResponse,
  CreateDeploymentResponse,
  DeploymentSummary,
  GetDeploymentResponse,
  ListEnvironmentDeploymentsResponse,
} from "@/types/deployments.types";
import * as projectsService from "./projects.service";

export async function listEnvironmentDeployments(
  projectId: string,
  environmentId: string,
): Promise<ListEnvironmentDeploymentsResponse> {
  const { data } = await api.get<ListEnvironmentDeploymentsResponse>(
    `/projects/${projectId}/environments/${environmentId}/deployments`,
  );
  return data;
}

export async function createDeployment(
  projectId: string,
  environmentId: string,
): Promise<CreateDeploymentResponse> {
  const { data } = await api.post<CreateDeploymentResponse>(
    `/projects/${projectId}/environments/${environmentId}/deployments`,
  );
  return data;
}

export async function getDeployment(deploymentId: string): Promise<GetDeploymentResponse> {
  const { data } = await api.get<GetDeploymentResponse>(`/deployments/${deploymentId}`);
  return data;
}

export async function cancelDeployment(deploymentId: string): Promise<CancelDeploymentResponse> {
  const { data } = await api.post<CancelDeploymentResponse>(
    `/deployments/${deploymentId}/cancel`,
  );
  return data;
}

export async function listRecentDeployments(limit = 30): Promise<DeploymentSummary[]> {
  const { projects } = await projectsService.listProjects();
  const collected: DeploymentSummary[] = [];

  for (const project of projects) {
    const { project: detail } = await projectsService.getProject(project.id);
    for (const environment of detail.environments) {
      const { deployments } = await listEnvironmentDeployments(project.id, environment.id);
      collected.push(...deployments);
    }
  }

  return collected
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function isActiveDeploymentStatus(status: DeploymentSummary["status"]): boolean {
  return status === "PENDING" || status === "QUEUED" || status === "RUNNING";
}
