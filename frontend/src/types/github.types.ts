export interface GitHubIntegrationSummary {
  connected: boolean;
  installationId?: number;
  accountLogin?: string;
  accountType?: string;
  repositorySelection?: string;
  connectedAt?: string;
}

export interface GetGitHubIntegrationResponse {
  integration: GitHubIntegrationSummary;
}

export interface GetGitHubInstallUrlResponse {
  url: string;
  state: string;
}

export interface GitHubRepositorySummary {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
}

export interface ListGitHubReposResponse {
  repositories: GitHubRepositorySummary[];
}

export interface GitHubBranchSummary {
  name: string;
  commitSha: string;
}

export interface ListGitHubBranchesResponse {
  branches: GitHubBranchSummary[];
}

export interface DisconnectGitHubResponse {
  message: string;
}
