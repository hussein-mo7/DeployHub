import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

const connection = redis.duplicate();

function createStubWorker(name: string, queueName: string): Worker {
  const worker = new Worker(
    queueName,
    async (job) => {
      logger.info(`[${name}] Job received (stub): ${job.id}`);
    },
    { connection },
  );

  worker.on("failed", (job, error) => {
    logger.error(`[${name}] Job ${job?.id} failed`, error);
  });

  return worker;
}

export const deploymentWorker = createStubWorker("deployment", "deployments");
export const webhookWorker = createStubWorker("webhook", "webhooks");
export const cleanupWorker = createStubWorker("cleanup", "cleanup");

export const workers = [deploymentWorker, webhookWorker, cleanupWorker];

export async function closeWorkers(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
}
