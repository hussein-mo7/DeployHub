import { createHmac, timingSafeEqual } from "node:crypto";
import { webhookQueue } from "../../config/queues.js";
import { env } from "../../config/env.js";
import { ERROR_CODES } from "../../constants/errors.js";
import { WEBHOOK_QUEUE_JOB, type GithubPushWebhookJob } from "../../constants/webhooks.js";
import { prisma } from "../../config/database.js";
import { AppError } from "../../middleware/error.middleware.js";

export interface GithubPushEvent {
  installationId: number;
  repoOwner: string;
  repoName: string;
  branch: string;
}

function branchFromRef(ref: unknown): string | null {
  if (typeof ref !== "string" || !ref.startsWith("refs/heads/")) {
    return null;
  }
  const branch = ref.slice("refs/heads/".length).trim();
  return branch.length > 0 ? branch : null;
}

export function assertWebhookConfigured(): void {
  if (!env.GITHUB_WEBHOOK_SECRET?.trim()) {
    throw new AppError(
      503,
      "GitHub webhook secret is not configured",
      ERROR_CODES.GITHUB_WEBHOOK_NOT_CONFIGURED,
    );
  }
}

export function verifyGithubWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
): boolean {
  const secret = env.GITHUB_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseGithubPushEvent(payload: unknown): GithubPushEvent | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as {
    installation?: { id?: unknown };
    repository?: { name?: unknown; owner?: { login?: unknown } };
    ref?: unknown;
  };

  const installationId = data.installation?.id;
  const repoName = data.repository?.name;
  const repoOwner = data.repository?.owner?.login;
  const branch = branchFromRef(data.ref);

  if (
    typeof installationId !== "number" ||
    typeof repoName !== "string" ||
    typeof repoOwner !== "string" ||
    !branch
  ) {
    return null;
  }

  return {
    installationId,
    repoOwner,
    repoName,
    branch,
  };
}

export async function findAutoDeployTargets(
  event: GithubPushEvent,
): Promise<Array<{ userId: string; projectId: string; environmentId: string }>> {
  const installation = await prisma.gitHubInstallation.findUnique({
    where: { installationId: event.installationId },
  });

  if (!installation) {
    return [];
  }

  const projects = await prisma.project.findMany({
    where: {
      userId: installation.userId,
      repoOwner: event.repoOwner,
      repoName: event.repoName,
    },
    include: {
      environments: {
        where: {
          branch: event.branch,
          autoDeployEnabled: true,
        },
      },
    },
  });

  const targets: Array<{ userId: string; projectId: string; environmentId: string }> = [];

  for (const project of projects) {
    for (const environment of project.environments) {
      targets.push({
        userId: installation.userId,
        projectId: project.id,
        environmentId: environment.id,
      });
    }
  }

  return targets;
}

export async function enqueueGithubPushDeployments(
  deliveryId: string,
  event: GithubPushEvent,
  targets: Array<{ userId: string; projectId: string; environmentId: string }>,
): Promise<number> {
  let queued = 0;

  for (const target of targets) {
    const job: GithubPushWebhookJob = {
      deliveryId,
      userId: target.userId,
      projectId: target.projectId,
      environmentId: target.environmentId,
      repoOwner: event.repoOwner,
      repoName: event.repoName,
      branch: event.branch,
    };

    await webhookQueue.add(WEBHOOK_QUEUE_JOB, job, {
      jobId: `webhook-${deliveryId}-${target.environmentId}`,
      removeOnComplete: true,
      removeOnFail: 100,
    });
    queued += 1;
  }

  return queued;
}
