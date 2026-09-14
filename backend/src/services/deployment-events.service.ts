import { getIOIfReady } from "../config/socket.js";
import { publishDeploymentUiEvent, type DeploymentUiEvent } from "../config/deployment-ui-bus.js";
import type { DeploymentLogEntry } from "../modules/deployments/deployments.types.js";
import { logger } from "../utils/logger.js";

export function relayDeploymentUiEventToSockets(event: DeploymentUiEvent): void {
  const io = getIOIfReady();
  if (!io) {
    return;
  }

  if (event.type === "log") {
    io.to(`deployment:${event.deploymentId}`).emit("deployment:log", event.log);
    return;
  }

  io.to(`deployment:${event.deploymentId}`).emit("deployment:status", {
    status: event.status,
    errorMessage: event.errorMessage,
  });
}

export function broadcastDeploymentLog(deploymentId: string, log: DeploymentLogEntry): void {
  const io = getIOIfReady();
  if (io) {
    io.to(`deployment:${deploymentId}`).emit("deployment:log", log);
    return;
  }

  void publishDeploymentUiEvent({ type: "log", deploymentId, log }).catch((error) => {
    logger.error("Failed to publish deployment log UI event", error);
  });
}

export function broadcastDeploymentStatus(
  deploymentId: string,
  status: string,
  errorMessage?: string | null,
): void {
  const payload = { status, errorMessage: errorMessage ?? null };
  const io = getIOIfReady();
  if (io) {
    io.to(`deployment:${deploymentId}`).emit("deployment:status", payload);
    return;
  }

  void publishDeploymentUiEvent({
    type: "status",
    deploymentId,
    status,
    errorMessage: payload.errorMessage,
  }).catch((error) => {
    logger.error("Failed to publish deployment status UI event", error);
  });
}

/** @deprecated Use broadcastDeploymentLog */
export function emitDeploymentLog(deploymentId: string, log: DeploymentLogEntry): void {
  broadcastDeploymentLog(deploymentId, log);
}

/** @deprecated Use broadcastDeploymentStatus */
export function emitDeploymentStatus(
  deploymentId: string,
  status: string,
  errorMessage?: string | null,
): void {
  broadcastDeploymentStatus(deploymentId, status, errorMessage);
}

export async function handleAgentDeploymentLog(
  deploymentId: string,
  message: unknown,
): Promise<void> {
  if (typeof message !== "string" || !message.trim()) {
    return;
  }

  try {
    const { appendDeploymentLog } = await import("../modules/deployments/deployments.service.js");
    await appendDeploymentLog(deploymentId, message.trim());
  } catch (error) {
    logger.error(`Failed to persist deployment log for ${deploymentId}`, error);
    broadcastDeploymentLog(deploymentId, {
      id: `ephemeral-${Date.now()}`,
      deploymentId,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    });
  }
}

export async function handleAgentDeploymentStatus(
  deploymentId: string,
  payload: unknown,
): Promise<void> {
  if (!payload || typeof payload !== "object") {
    return;
  }

  const data = payload as { status?: string; errorMessage?: string };
  if (data.status !== "SUCCESS" && data.status !== "FAILED" && data.status !== "CANCELLED") {
    return;
  }

  try {
    const { markDeploymentFinished } = await import("../modules/deployments/deployments.service.js");
    await markDeploymentFinished(deploymentId, data.status, data.errorMessage);
  } catch (error) {
    logger.error(`Failed to persist deployment status for ${deploymentId}`, error);
    broadcastDeploymentStatus(deploymentId, data.status, data.errorMessage ?? null);
  }
}
