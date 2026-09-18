import { api } from "./api";
import type {
  CreateServerResult,
  DeleteServerResponse,
  GetServerResponse,
  ListServersResponse,
  UpdateServerResponse,
} from "@/types/servers.types";
import type { CreateServerForm, UpdateServerForm } from "@/lib/validations/servers.schema";

export async function listServers(): Promise<ListServersResponse> {
  const { data } = await api.get<ListServersResponse>("/servers");
  return data;
}

export async function getServer(id: string): Promise<GetServerResponse> {
  const { data } = await api.get<GetServerResponse>(`/servers/${id}`);
  return data;
}

export async function createServer(input: CreateServerForm): Promise<CreateServerResult> {
  const { data } = await api.post<CreateServerResult>("/servers", input);
  return data;
}

export async function updateServer(
  id: string,
  input: Partial<UpdateServerForm>,
): Promise<UpdateServerResponse> {
  const { data } = await api.patch<UpdateServerResponse>(`/servers/${id}`, input);
  return data;
}

export async function deleteServer(id: string): Promise<DeleteServerResponse> {
  const { data } = await api.delete<DeleteServerResponse>(`/servers/${id}`);
  return data;
}

export async function regenerateRegistrationToken(id: string): Promise<CreateServerResult> {
  const { data } = await api.post<CreateServerResult>(`/servers/${id}/regenerate-token`);
  return data;
}

export interface BootstrapServerResponse {
  message: string;
  jobId: string;
}

export async function bootstrapServer(
  id: string,
  input: Record<string, unknown>,
): Promise<BootstrapServerResponse> {
  const { data } = await api.post<BootstrapServerResponse>(`/servers/${id}/bootstrap`, input);
  return data;
}
