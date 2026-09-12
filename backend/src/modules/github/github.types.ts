export interface GitHubIntegrationSummary {
  connected: boolean;
  installationId?: number;
  accountLogin?: string;
  accountType?: string;
  repositorySelection?: string;
  connectedAt?: string;
}

export interface GitHubRepositorySummary {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
}

export interface GitHubBranchSummary {
  name: string;
  protected: boolean;
}
