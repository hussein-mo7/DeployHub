import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const connection = redis.duplicate();

export const cleanupWorker = new Worker(
  "cleanup",
  async (job) => {
    logger.info(`[cleanup] Job received (stub): ${job.id}`);
  },
  { connection },
);

cleanupWorker.on("failed", (job, error) => {
  logger.error(`[cleanup] Job ${job?.id} failed`, error);
});
