import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const connection = redis.duplicate();

export const webhookWorker = new Worker(
  "webhooks",
  async (job) => {
    logger.info(`[webhook] Job received (stub): ${job.id}`);
  },
  { connection },
);

webhookWorker.on("failed", (job, error) => {
  logger.error(`[webhook] Job ${job?.id} failed`, error);
});
