import { api } from "./api";

export interface PublicConfigResponse {
  publicApiUrl: string;
  agentDockerImage: string | null;
  agentInstallMode: "docker" | "manual";
}

export async function getPublicConfig(): Promise<PublicConfigResponse> {
  const { data } = await api.get<PublicConfigResponse>("/config/public");
  return data;
}
