import { getIOIfReady } from "../config/socket.js";
import {
  publishBootstrapUiEvent,
  type BootstrapUiEvent,
} from "../config/bootstrap-ui-bus.js";
import { logger } from "../utils/logger.js";

export function relayBootstrapUiEventToSockets(event: BootstrapUiEvent): void {
  const io = getIOIfReady();
  if (!io) {
    return;
  }

  if (event.type === "log") {
    io.to(`server:bootstrap:${event.serverId}`).emit("server:bootstrap:log", {
      line: event.line,
      timestamp: event.timestamp,
    });
    return;
  }

  io.to(`server:bootstrap:${event.serverId}`).emit("server:bootstrap:status", {
    status: event.status,
    errorMessage: event.errorMessage,
  });
}

export function broadcastBootstrapLog(serverId: string, line: string): void {
  const timestamp = new Date().toISOString();
  const trimmed = line.replace(/\r?\n$/, "");
  if (!trimmed) {
    return;
  }

  const io = getIOIfReady();
  if (io) {
    io.to(`server:bootstrap:${serverId}`).emit("server:bootstrap:log", {
      line: trimmed,
      timestamp,
    });
    return;
  }

  void publishBootstrapUiEvent({ type: "log", serverId, line: trimmed, timestamp }).catch(
    (error) => {
      logger.error("Failed to publish bootstrap log UI event", error);
    },
  );
}

export function broadcastBootstrapStatus(
  serverId: string,
  status: "running" | "success" | "failed",
  errorMessage?: string | null,
): void {
  const payload = { status, errorMessage: errorMessage ?? null };
  const io = getIOIfReady();
  if (io) {
    io.to(`server:bootstrap:${serverId}`).emit("server:bootstrap:status", payload);
    return;
  }

  void publishBootstrapUiEvent({
    type: "status",
    serverId,
    status,
    errorMessage: payload.errorMessage,
  }).catch((error) => {
    logger.error("Failed to publish bootstrap status UI event", error);
  });
}
