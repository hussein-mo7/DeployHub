import { redis } from "./redis.js";
import { logger } from "../utils/logger.js";
import { BOOTSTRAP_UI_CHANNEL } from "../constants/bootstrap.js";

export type BootstrapUiEvent =
  | { type: "log"; serverId: string; line: string; timestamp: string }
  | {
      type: "status";
      serverId: string;
      status: "running" | "success" | "failed";
      errorMessage: string | null;
    };

export async function publishBootstrapUiEvent(event: BootstrapUiEvent): Promise<void> {
  await redis.publish(BOOTSTRAP_UI_CHANNEL, JSON.stringify(event));
}

export function subscribeBootstrapUiEvents(
  handler: (event: BootstrapUiEvent) => void,
): ReturnType<typeof redis.duplicate> {
  const subscriber = redis.duplicate();

  void subscriber.subscribe(BOOTSTRAP_UI_CHANNEL).catch((error) => {
    logger.error("Failed to subscribe to bootstrap UI channel", error);
  });

  subscriber.on("message", (_channel, raw) => {
    try {
      const parsed = JSON.parse(raw) as BootstrapUiEvent;
      if (!parsed?.serverId || !parsed.type) {
        return;
      }
      handler(parsed);
    } catch (error) {
      logger.error("Failed to parse bootstrap UI event", error);
    }
  });

  return subscriber;
}
