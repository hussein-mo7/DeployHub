import { prisma } from "../../config/database.js";
import { ERROR_CODES } from "../../constants/errors.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  createInstallState,
  deleteGitHubInstallation,
  getInstallationDetails,
  getInstallUrl,
  listInstallationRepositories,
  listRepositoryBranches,
  verifyInstallState,
} from "../../utils/github-app.js";
import type {
  GitHubBranchSummary,
  GitHubIntegrationSummary,
  GitHubRepositorySummary,
} from "./github.types.js";
import type { GitHubCallbackInput, ListReposQuery, RepoParams } from "./github.schema.js";

function toIntegrationSummary(
  record: {
    installationId: number;
    accountLogin: string;
    accountType: string;
    repositorySelection: string | null;
    createdAt: Date;
  } | null,
): GitHubIntegrationSummary {
  if (!record) {
    return { connected: false };
  }

  return {
    connected: true,
    installationId: record.installationId,
    accountLogin: record.accountLogin,
    accountType: record.accountType,
    repositorySelection: record.repositorySelection ?? undefined,
    connectedAt: record.createdAt.toISOString(),
  };
}

async function getInstallationForUser(userId: string) {
  return prisma.gitHubInstallation.findUnique({ where: { userId } });
}

export function getGitHubInstallUrl(userId: string): { url: string; state: string } {
  const state = createInstallState(userId);
  return { url: getInstallUrl(state), state };
}

export async function completeGitHubInstall(
  input: GitHubCallbackInput,
): Promise<GitHubIntegrationSummary> {
  const { userId } = verifyInstallState(input.state);
  const details = await getInstallationDetails(input.installation_id);

  const record = await prisma.gitHubInstallation.upsert({
    where: { userId },
    create: {
      userId,
      installationId: details.id,
      accountLogin: details.account.login,
      accountType: details.account.type,
      repositorySelection: details.repository_selection,
    },
    update: {
      installationId: details.id,
      accountLogin: details.account.login,
      accountType: details.account.type,
      repositorySelection: details.repository_selection,
    },
  });

  return toIntegrationSummary(record);
}

export async function getGitHubIntegration(userId: string): Promise<GitHubIntegrationSummary> {
  const record = await getInstallationForUser(userId);
  return toIntegrationSummary(record);
}

export async function disconnectGitHub(userId: string): Promise<{ message: string }> {
  const record = await getInstallationForUser(userId);

  if (!record) {
    throw new AppError(404, "GitHub is not connected", ERROR_CODES.GITHUB_NOT_CONNECTED);
  }

  await deleteGitHubInstallation(record.installationId);
  await prisma.gitHubInstallation.delete({ where: { userId } });

  return { message: "GitHub disconnected successfully" };
}

export async function listGitHubRepositories(
  userId: string,
  query: ListReposQuery,
): Promise<{ repositories: GitHubRepositorySummary[]; totalCount: number; page: number; perPage: number }> {
  const record = await getInstallationForUser(userId);

  if (!record) {
    throw new AppError(404, "GitHub is not connected", ERROR_CODES.GITHUB_NOT_CONNECTED);
  }

  const result = await listInstallationRepositories(
    record.installationId,
    query.page,
    query.perPage,
  );

  return {
    repositories: result.repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch,
      htmlUrl: repo.html_url,
    })),
    totalCount: result.total_count,
    page: query.page,
    perPage: query.perPage,
  };
}

export async function listGitHubBranches(
  userId: string,
  params: RepoParams,
): Promise<{ branches: GitHubBranchSummary[] }> {
  const record = await getInstallationForUser(userId);

  if (!record) {
    throw new AppError(404, "GitHub is not connected", ERROR_CODES.GITHUB_NOT_CONNECTED);
  }

  const branches = await listRepositoryBranches(
    record.installationId,
    params.owner,
    params.repo,
  );

  return {
    branches: branches.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
    })),
  };
}
