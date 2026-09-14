import type Redis from "ioredis";
import { subscribeAgentCommands, type AgentCommandMessage } from "./agent-command-bus.js";
import { getAgentNamespace } from "./socket.js";
import { failDeploymentWithLog } from "../modules/deployments/deployments.service.js";
import { getConnectedAgentSocketId } from "../services/agent-socket.service.js";
import { logger } from "../utils/logger.js";

function deploymentIdFromDeployCommand(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const id = (payload as { deploymentId?: unknown }).deploymentId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

async function handleUndeliveredDeployCommand(message: AgentCommandMessage): Promise<void> {
  if (message.event !== "DEPLOY") {
    return;
  }
  const deploymentId = deploymentIdFromDeployCommand(message.payload);
  if (!deploymentId) {
    return;
  }
  await failDeploymentWithLog(
    deploymentId,
    "Agent was offline when the deploy command was sent — connect the agent and try again.",
  );
}

let subscriber: Redis | null = null;

export function startAgentCommandSubscriber(): void {
  if (subscriber) {
    return;
  }

  subscriber = subscribeAgentCommands((message) => {
    const socketId = getConnectedAgentSocketId(message.serverId);

    if (!socketId) {
      logger.warn(`No connected agent socket for server ${message.serverId}`);
      void handleUndeliveredDeployCommand(message).catch((error) => {
        logger.error("Failed to mark deployment after undelivered agent command", error);
      });
      return;
    }

    getAgentNamespace().to(socketId).emit(message.event, message.payload);
  });

  logger.info("Agent command subscriber started");
}

export async function stopAgentCommandSubscriber(): Promise<void> {
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
}
