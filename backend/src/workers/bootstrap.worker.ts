import { Worker } from "bullmq";
import { Client } from "ssh2";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";
import { getPublicApiBaseUrl } from "../config/public-url.js";
import { BOOTSTRAP_QUEUE_JOB } from "../constants/bootstrap.js";
import { prisma } from "../config/database.js";
import {
  broadcastBootstrapLog,
  broadcastBootstrapStatus,
} from "../services/bootstrap-events.service.js";
import {
  readBootstrapScript,
  shellSingleQuote,
} from "../utils/bootstrap-script.js";
import { logger } from "../utils/logger.js";

const connection = redis.duplicate();

export interface BootstrapJobData {
  serverId: string;
  userId: string;
  host: string;
  port: number;
  username: string;
  authType: "privateKey" | "password";
  privateKey?: string;
  password?: string;
  registrationToken: string;
}

function runSshBootstrap(data: BootstrapJobData): Promise<void> {
  const publicApiUrl = getPublicApiBaseUrl();
  const agentImage = env.AGENT_DOCKER_IMAGE;
  if (!agentImage) {
    return Promise.reject(new Error("AGENT_DOCKER_IMAGE is not configured on the control plane"));
  }

  const script = readBootstrapScript();
  const remoteCommand = [
    `export PUBLIC_API_URL=${shellSingleQuote(publicApiUrl)}`,
    `export REGISTRATION_TOKEN=${shellSingleQuote(data.registrationToken)}`,
    `export AGENT_DOCKER_IMAGE=${shellSingleQuote(agentImage)}`,
    "bash -s",
  ].join(" ");

  return new Promise((resolve, reject) => {
    const conn = new Client();

    const fail = (message: string) => {
      conn.end();
      reject(new Error(message));
    };

    conn
      .on("ready", () => {
        broadcastBootstrapLog(data.serverId, "SSH connection established.");
        conn.exec(remoteCommand, (err, stream) => {
          if (err) {
            fail(err.message);
            return;
          }

          stream.on("close", (code: number | null) => {
            conn.end();
            if (code === 0) {
              resolve();
              return;
            }
            reject(new Error(`Bootstrap script exited with code ${code ?? "unknown"}`));
          });

          stream.on("data", (chunk: Buffer) => {
            broadcastBootstrapLog(data.serverId, chunk.toString("utf8"));
          });

          stream.stderr.on("data", (chunk: Buffer) => {
            broadcastBootstrapLog(data.serverId, chunk.toString("utf8"));
          });

          stream.write(script);
          stream.end();
        });
      })
      .on("error", (error) => {
        reject(error);
      })
      .connect({
        host: data.host,
        port: data.port,
        username: data.username,
        readyTimeout: env.BOOTSTRAP_SSH_READY_TIMEOUT_MS,
        ...(data.authType === "privateKey"
          ? { privateKey: data.privateKey }
          : { password: data.password }),
      });
  });
}

async function markBootstrapFailed(serverId: string, message: string): Promise<void> {
  await prisma.server.update({
    where: { id: serverId },
    data: { status: "UNREGISTERED" },
  });
  broadcastBootstrapStatus(serverId, "failed", message);
}

export const bootstrapWorker = new Worker(
  "server-bootstrap",
  async (job) => {
    if (job.name !== BOOTSTRAP_QUEUE_JOB) {
      logger.info(`[bootstrap] Ignoring unknown job name: ${job.name}`);
      return;
    }

    const data = job.data as BootstrapJobData;
    broadcastBootstrapStatus(data.serverId, "running", null);
    broadcastBootstrapLog(data.serverId, "Starting VPS bootstrap over SSH…");

    try {
      await runSshBootstrap(data);
      broadcastBootstrapLog(
        data.serverId,
        "Bootstrap script finished. Waiting for agent to connect…",
      );
      broadcastBootstrapStatus(data.serverId, "success", null);
      await prisma.server.update({
        where: { id: data.serverId },
        data: { status: "CONNECTING" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bootstrap failed";
      logger.error(`[bootstrap] Job ${job.id} failed for server ${data.serverId}`, error);
      await markBootstrapFailed(data.serverId, message);
    }
  },
  {
    connection,
    lockDuration: env.BOOTSTRAP_JOB_TIMEOUT_MS,
  },
);

bootstrapWorker.on("failed", (job, error) => {
  logger.error(`[bootstrap] Job ${job?.id} failed`, error);
});
