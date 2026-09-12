import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ERROR_CODES } from "../constants/errors.js";
import { AppError } from "../middleware/error.middleware.js";

const GITHUB_API = "https://api.github.com";
const GITHUB_API_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
} as const;

export function assertGitHubConfigured(): void {
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_SLUG || !env.GITHUB_APP_PRIVATE_KEY) {
    throw new AppError(
      503,
      "GitHub App is not configured. Set GITHUB_APP_ID, GITHUB_APP_SLUG, and GITHUB_APP_PRIVATE_KEY.",
      ERROR_CODES.GITHUB_NOT_CONFIGURED,
    );
  }
}

function getPrivateKey(): string {
  assertGitHubConfigured();
  return env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, "\n");
}

export function createGitHubAppJwt(): string {
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    { iat: now - 60, exp: now + 600, iss: env.GITHUB_APP_ID! },
    getPrivateKey(),
    { algorithm: "RS256" },
  );
}

export function createInstallState(userId: string): string {
  return jwt.sign({ userId, type: "github_install" }, env.JWT_SECRET, { expiresIn: "15m" });
}

export function verifyInstallState(state: string): { userId: string } {
  try {
    const payload = jwt.verify(state, env.JWT_SECRET) as { userId?: string; type?: string };

    if (payload.type !== "github_install" || !payload.userId) {
      throw new Error("Invalid state");
    }

    return { userId: payload.userId };
  } catch {
    throw new AppError(400, "Invalid or expired GitHub connect state", ERROR_CODES.INVALID_GITHUB_STATE);
  }
}

export function getInstallUrl(state: string): string {
  assertGitHubConfigured();
  return `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new?state=${encodeURIComponent(state)}`;
}

async function githubRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      ...GITHUB_API_HEADERS,
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(
      502,
      `GitHub API error: ${response.status}`,
      ERROR_CODES.GITHUB_API_ERROR,
      body,
    );
  }

  return response.json() as Promise<T>;
}

export async function getInstallationDetails(installationId: number): Promise<{
  id: number;
  account: { login: string; type: string };
  repository_selection: string;
}> {
  const appJwt = createGitHubAppJwt();
  return githubRequest(`/app/installations/${installationId}`, appJwt);
}

export async function getInstallationAccessToken(installationId: number): Promise<string> {
  const appJwt = createGitHubAppJwt();
  const result = await githubRequest<{ token: string }>(
    `/app/installations/${installationId}/access_tokens`,
    appJwt,
    { method: "POST" },
  );

  return result.token;
}

export async function deleteGitHubInstallation(installationId: number): Promise<void> {
  const appJwt = createGitHubAppJwt();
  const response = await fetch(`${GITHUB_API}/app/installations/${installationId}`, {
    method: "DELETE",
    headers: {
      ...GITHUB_API_HEADERS,
      Authorization: `Bearer ${appJwt}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const body = await response.text();
    throw new AppError(
      502,
      `GitHub API error: ${response.status}`,
      ERROR_CODES.GITHUB_API_ERROR,
      body,
    );
  }
}

export async function listInstallationRepositories(
  installationId: number,
  page: number,
  perPage: number,
): Promise<{
  total_count: number;
  repositories: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    default_branch: string;
    html_url: string;
  }>;
}> {
  const token = await getInstallationAccessToken(installationId);
  return githubRequest(
    `/installation/repositories?per_page=${perPage}&page=${page}`,
    token,
  );
}

export async function listRepositoryBranches(
  installationId: number,
  owner: string,
  repo: string,
): Promise<Array<{ name: string; protected: boolean }>> {
  const token = await getInstallationAccessToken(installationId);
  return githubRequest(`/repos/${owner}/${repo}/branches`, token);
}
