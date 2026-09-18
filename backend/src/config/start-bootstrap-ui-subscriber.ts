import { subscribeBootstrapUiEvents } from "./bootstrap-ui-bus.js";
import { relayBootstrapUiEventToSockets } from "../services/bootstrap-events.service.js";
import { logger } from "../utils/logger.js";

let subscriber: ReturnType<typeof subscribeBootstrapUiEvents> | null = null;

export function startBootstrapUiSubscriber(): void {
  if (subscriber) {
    return;
  }

  subscriber = subscribeBootstrapUiEvents((event) => {
    relayBootstrapUiEventToSockets(event);
  });

  logger.info("Bootstrap UI Redis subscriber started");
}
