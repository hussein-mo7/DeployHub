import type Redis from "ioredis";
import { subscribeDeploymentUiEvents } from "./deployment-ui-bus.js";
import { relayDeploymentUiEventToSockets } from "../services/deployment-events.service.js";
import { logger } from "../utils/logger.js";

let subscriber: Redis | null = null;

export function startDeploymentUiSubscriber(): void {
  if (subscriber) {
    return;
  }

  subscriber = subscribeDeploymentUiEvents((event) => {
    relayDeploymentUiEventToSockets(event);
  });

  logger.info("Deployment UI subscriber started");
}

export async function stopDeploymentUiSubscriber(): Promise<void> {
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
}
