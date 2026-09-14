import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { publishAgentCommand } from "../config/agent-command-bus.js";
import { DEPLOYMENT_QUEUE_JOB } from "../constants/deployments.js";
import {
  appendDeploymentLog,
  buildDeployCommandPayload,
  failDeploymentWithLog,
  markDeploymentRunning,
} from "../modules/deployments/deployments.service.js";
import { isAgentOnlineInCluster } from "../services/agent-socket.service.js";
import { AppError } from "../middleware/error.middleware.js";
import { logger } from "../utils/logger.js";

const connection = redis.duplicate();

function jobErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Deployment job failed";
}

export const deploymentWorker = new Worker(
  "deployments",
  async (job) => {
    if (job.name !== DEPLOYMENT_QUEUE_JOB) {
      logger.info(`[deployment] Ignoring unknown job name: ${job.name}`);
      return;
    }

    const { deploymentId, userId, serverId } = job.data as {
      deploymentId: string;
      userId: string;
      serverId: string;
    };

    try {
      if (!(await isAgentOnlineInCluster(serverId))) {
        await failDeploymentWithLog(deploymentId, "Agent is offline for the target server");
        return;
      }

      await markDeploymentRunning(deploymentId);
      await appendDeploymentLog(deploymentId, "Deployment queued — sending command to agent...");

      const { payload } = await buildDeployCommandPayload(userId, deploymentId);

      await publishAgentCommand({
        serverId,
        event: "DEPLOY",
        payload,
      });
    } catch (error) {
      const message = jobErrorMessage(error);
      logger.error(`[deployment] Job ${job.id} failed for ${deploymentId}`, error);
      await failDeploymentWithLog(deploymentId, message);
    }
  },
  { connection },
);

deploymentWorker.on("failed", (job, error) => {
  logger.error(`[deployment] Job ${job?.id} failed`, error);
});
