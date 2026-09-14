import { redis } from "./redis.js";
import { logger } from "../utils/logger.js";
import type { DeploymentLogEntry } from "../modules/deployments/deployments.types.js";

const DEPLOYMENT_UI_CHANNEL = "deployhub:deployment:ui";

export type DeploymentUiEvent =
  | { type: "log"; deploymentId: string; log: DeploymentLogEntry }
  | {
      type: "status";
      deploymentId: string;
      status: string;
      errorMessage: string | null;
    };

export async function publishDeploymentUiEvent(event: DeploymentUiEvent): Promise<void> {
  await redis.publish(DEPLOYMENT_UI_CHANNEL, JSON.stringify(event));
}

export function subscribeDeploymentUiEvents(
  handler: (event: DeploymentUiEvent) => void,
): ReturnType<typeof redis.duplicate> {
  const subscriber = redis.duplicate();

  void subscriber.subscribe(DEPLOYMENT_UI_CHANNEL).catch((error) => {
    logger.error("Failed to subscribe to deployment UI channel", error);
  });

  subscriber.on("message", (_channel, raw) => {
    try {
      const parsed = JSON.parse(raw) as DeploymentUiEvent;
      if (!parsed?.deploymentId || !parsed.type) {
        return;
      }
      handler(parsed);
    } catch (error) {
      logger.error("Failed to parse deployment UI event", error);
    }
  });

  return subscriber;
}
