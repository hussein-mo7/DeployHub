export { deploymentWorker } from "./deployment.worker.js";
export { webhookWorker } from "./webhook.worker.js";
export { cleanupWorker } from "./cleanup.worker.js";
export { bootstrapWorker } from "./bootstrap.worker.js";

import { deploymentWorker } from "./deployment.worker.js";
import { webhookWorker } from "./webhook.worker.js";
import { cleanupWorker } from "./cleanup.worker.js";
import { bootstrapWorker } from "./bootstrap.worker.js";

export const workers = [deploymentWorker, webhookWorker, cleanupWorker, bootstrapWorker];

export async function closeWorkers(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
}
