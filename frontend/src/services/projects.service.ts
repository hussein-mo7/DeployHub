import { api } from "./api";
import type {
  CreateEnvironmentResponse,
  CreateProjectResponse,
  CreateServiceResponse,
  DeleteEnvironmentResponse,
  DeleteProjectResponse,
  DeleteServiceResponse,
  GetProjectResponse,
  ListEnvironmentsResponse,
  ListEnvironmentVariablesResponse,
  ListProjectsResponse,
  ListServicesResponse,
  SaveEnvironmentVariablesResponse,
  UpdateProjectResponse,
} from "@/types/projects.types";
import type {
  CreateEnvironmentForm,
  CreateProjectForm,
  CreateServiceForm,
  SaveEnvironmentVariablesForm,
  UpdateProjectForm,
} from "@/lib/validations/projects.schema";

export async function listProjects(): Promise<ListProjectsResponse> {
  const { data } = await api.get<ListProjectsResponse>("/projects");
  return data;
}

export async function getProject(projectId: string): Promise<GetProjectResponse> {
  const { data } = await api.get<GetProjectResponse>(`/projects/${projectId}`);
  return data;
}

export async function createProject(input: CreateProjectForm): Promise<CreateProjectResponse> {
  const { data } = await api.post<CreateProjectResponse>("/projects", input);
  return data;
}

export async function updateProject(
  projectId: string,
  input: Partial<UpdateProjectForm>,
): Promise<UpdateProjectResponse> {
  const { data } = await api.patch<UpdateProjectResponse>(`/projects/${projectId}`, input);
  return data;
}

export async function deleteProject(projectId: string): Promise<DeleteProjectResponse> {
  const { data } = await api.delete<DeleteProjectResponse>(`/projects/${projectId}`);
  return data;
}

export async function listServices(projectId: string): Promise<ListServicesResponse> {
  const { data } = await api.get<ListServicesResponse>(`/projects/${projectId}/services`);
  return data;
}

export async function createService(
  projectId: string,
  input: CreateServiceForm,
): Promise<CreateServiceResponse> {
  const { data } = await api.post<CreateServiceResponse>(
    `/projects/${projectId}/services`,
    input,
  );
  return data;
}

export async function deleteService(
  projectId: string,
  serviceId: string,
): Promise<DeleteServiceResponse> {
  const { data } = await api.delete<DeleteServiceResponse>(
    `/projects/${projectId}/services/${serviceId}`,
  );
  return data;
}

export async function listEnvironments(projectId: string): Promise<ListEnvironmentsResponse> {
  const { data } = await api.get<ListEnvironmentsResponse>(
    `/projects/${projectId}/environments`,
  );
  return data;
}

export async function createEnvironment(
  projectId: string,
  input: CreateEnvironmentForm,
): Promise<CreateEnvironmentResponse> {
  const { data } = await api.post<CreateEnvironmentResponse>(
    `/projects/${projectId}/environments`,
    input,
  );
  return data;
}

export async function deleteEnvironment(
  projectId: string,
  environmentId: string,
): Promise<DeleteEnvironmentResponse> {
  const { data } = await api.delete<DeleteEnvironmentResponse>(
    `/projects/${projectId}/environments/${environmentId}`,
  );
  return data;
}

export async function listEnvironmentVariables(
  projectId: string,
  environmentId: string,
): Promise<ListEnvironmentVariablesResponse> {
  const { data } = await api.get<ListEnvironmentVariablesResponse>(
    `/projects/${projectId}/environments/${environmentId}/variables`,
  );
  return data;
}

export async function saveEnvironmentVariables(
  projectId: string,
  environmentId: string,
  input: SaveEnvironmentVariablesForm,
): Promise<SaveEnvironmentVariablesResponse> {
  const { data } = await api.put<SaveEnvironmentVariablesResponse>(
    `/projects/${projectId}/environments/${environmentId}/variables`,
    input,
  );
  return data;
}
