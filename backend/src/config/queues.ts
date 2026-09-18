import { Queue } from "bullmq";
import { redis } from "./redis.js";

const connection = redis.duplicate();

export const deploymentQueue = new Queue("deployments", { connection });
export const webhookQueue = new Queue("webhooks", { connection });
export const cleanupQueue = new Queue("cleanup", { connection });
export const bootstrapQueue = new Queue("server-bootstrap", { connection });

export const queues = {
  deployments: deploymentQueue,
  webhooks: webhookQueue,
  cleanup: cleanupQueue,
  bootstrap: bootstrapQueue,
};
