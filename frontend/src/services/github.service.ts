import { api } from "./api";
import type {
  DisconnectGitHubResponse,
  GetGitHubInstallUrlResponse,
  GetGitHubIntegrationResponse,
  ListGitHubBranchesResponse,
  ListGitHubReposResponse,
} from "@/types/github.types";

export async function getIntegration(): Promise<GetGitHubIntegrationResponse> {
  const { data } = await api.get<GetGitHubIntegrationResponse>("/github/integration");
  return data;
}

export async function getInstallUrl(): Promise<GetGitHubInstallUrlResponse> {
  const { data } = await api.get<GetGitHubInstallUrlResponse>("/github/install-url");
  return data;
}

export async function disconnectGitHub(): Promise<DisconnectGitHubResponse> {
  const { data } = await api.delete<DisconnectGitHubResponse>("/github/integration");
  return data;
}

export async function listRepositories(perPage = 30): Promise<ListGitHubReposResponse> {
  const { data } = await api.get<ListGitHubReposResponse>("/github/repos", {
    params: { perPage },
  });
  return data;
}

export async function listBranches(
  owner: string,
  repo: string,
): Promise<ListGitHubBranchesResponse> {
  const { data } = await api.get<ListGitHubBranchesResponse>(
    `/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
  );
  return data;
}
