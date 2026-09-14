export { deploymentWorker } from "./deployment.worker.js";
export { webhookWorker } from "./webhook.worker.js";
export { cleanupWorker } from "./cleanup.worker.js";

import { deploymentWorker } from "./deployment.worker.js";
import { webhookWorker } from "./webhook.worker.js";
import { cleanupWorker } from "./cleanup.worker.js";

export const workers = [deploymentWorker, webhookWorker, cleanupWorker];

export async function closeWorkers(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
}
