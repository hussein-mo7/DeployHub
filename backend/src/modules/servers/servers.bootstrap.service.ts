import { bootstrapQueue } from "../../config/queues.js";
import { env } from "../../config/env.js";
import { getPublicApiBaseUrl } from "../../config/public-url.js";
import { redis } from "../../config/redis.js";
import { prisma } from "../../config/database.js";
import {
  BOOTSTRAP_QUEUE_JOB,
  BOOTSTRAP_RATE_LIMIT_PER_HOUR,
} from "../../constants/bootstrap.js";
import { REGISTRATION_TOKEN_MAX_AGE_MS } from "../../constants/servers.js";
import { ERROR_CODES } from "../../constants/errors.js";
import { AppError } from "../../middleware/error.middleware.js";
import { generateOpaqueToken, hashToken } from "../../utils/tokens.js";
import { getOwnedServer } from "./servers.service.js";
import type { BootstrapServerInput } from "./servers.schema.js";
import type { BootstrapJobData } from "../../workers/bootstrap.worker.js";

async function assertBootstrapRateLimit(userId: string): Promise<void> {
  const key = `bootstrap:rate:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 3600);
  }
  if (count > BOOTSTRAP_RATE_LIMIT_PER_HOUR) {
    throw new AppError(
      429,
      "Too many bootstrap attempts. Try again later.",
      ERROR_CODES.BOOTSTRAP_RATE_LIMITED,
    );
  }
}

async function issueRegistrationTokenForBootstrap(serverId: string): Promise<string> {
  const registrationToken = generateOpaqueToken();
  const registrationTokenHash = hashToken(registrationToken);
  const registrationTokenExpiresAt = new Date(Date.now() + REGISTRATION_TOKEN_MAX_AGE_MS);

  await prisma.server.update({
    where: { id: serverId },
    data: {
      agentTokenHash: null,
      registeredAt: null,
      registrationTokenHash,
      registrationTokenExpiresAt,
    },
  });

  return registrationToken;
}

export async function queueServerBootstrap(
  userId: string,
  serverId: string,
  input: BootstrapServerInput,
): Promise<{ message: string; jobId: string }> {
  if (!env.AGENT_DOCKER_IMAGE) {
    throw new AppError(
      503,
      "Agent Docker image is not configured on the control plane",
      ERROR_CODES.BOOTSTRAP_NOT_CONFIGURED,
    );
  }

  const publicApiUrl = getPublicApiBaseUrl();
  if (env.NODE_ENV === "production" && !publicApiUrl.startsWith("https://")) {
    throw new AppError(
      503,
      "PUBLIC_API_URL must use HTTPS in production before SSH bootstrap",
      ERROR_CODES.BOOTSTRAP_NOT_CONFIGURED,
    );
  }

  const server = await getOwnedServer(userId, serverId);

  if (server.status === "ONLINE") {
    throw new AppError(
      409,
      "Agent is already online. Bootstrap is only for initial install or repair when offline.",
      ERROR_CODES.BOOTSTRAP_NOT_ALLOWED,
    );
  }

  const existing = await bootstrapQueue.getJob(`bootstrap-${serverId}`);
  if (existing) {
    const state = await existing.getState();
    if (state === "active" || state === "waiting" || state === "delayed") {
      throw new AppError(
        409,
        "Bootstrap is already in progress for this server",
        ERROR_CODES.BOOTSTRAP_IN_PROGRESS,
      );
    }
  }

  await assertBootstrapRateLimit(userId);

  const registrationToken = await issueRegistrationTokenForBootstrap(serverId);

  await prisma.server.update({
    where: { id: serverId },
    data: {
      sshHost: input.host,
      sshPort: input.port,
      sshUser: input.username,
      status: "CONNECTING",
    },
  });

  const jobData: BootstrapJobData = {
    serverId,
    userId,
    host: input.host,
    port: input.port,
    username: input.username,
    authType: input.authType,
    ...(input.authType === "privateKey"
      ? { privateKey: input.privateKey }
      : { password: input.password }),
    registrationToken,
  };

  const job = await bootstrapQueue.add(BOOTSTRAP_QUEUE_JOB, jobData, {
    jobId: `bootstrap-${serverId}`,
    removeOnComplete: true,
    removeOnFail: 100,
    attempts: 1,
  });

  return {
    message: "Bootstrap started",
    jobId: job.id ?? `bootstrap-${serverId}`,
  };
}
