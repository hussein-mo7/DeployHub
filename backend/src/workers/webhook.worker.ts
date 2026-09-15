import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { WEBHOOK_QUEUE_JOB, type GithubPushWebhookJob } from "../constants/webhooks.js";
import { createDeploymentForEnvironment } from "../modules/deployments/deployments.service.js";
import { AppError } from "../middleware/error.middleware.js";
import { ERROR_CODES } from "../constants/errors.js";
import { logger } from "../utils/logger.js";

const connection = redis.duplicate();

function jobErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Webhook job failed";
}

export const webhookWorker = new Worker(
  "webhooks",
  async (job) => {
    if (job.name !== WEBHOOK_QUEUE_JOB) {
      logger.info(`[webhook] Ignoring unknown job name: ${job.name}`);
      return;
    }

    const data = job.data as GithubPushWebhookJob;

    try {
      const result = await createDeploymentForEnvironment(
        data.userId,
        data.projectId,
        data.environmentId,
        "WEBHOOK",
      );

      logger.info(
        `[webhook] Queued deployment ${result.deployment.id} for ${data.repoOwner}/${data.repoName}@${data.branch} (env ${data.environmentId})`,
      );
    } catch (error) {
      if (error instanceof AppError && error.code === ERROR_CODES.DEPLOYMENT_IN_PROGRESS) {
        logger.warn(
          `[webhook] Skipped auto-deploy for env ${data.environmentId}: deployment already in progress`,
        );
        return;
      }

      const message = jobErrorMessage(error);
      logger.error(`[webhook] Job ${job.id} failed: ${message}`, error);
      throw error;
    }
  },
  { connection },
);

webhookWorker.on("failed", (job, error) => {
  logger.error(`[webhook] Job ${job?.id} failed`, error);
});
