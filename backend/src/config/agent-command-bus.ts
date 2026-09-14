import { redis } from "./redis.js";
import { logger } from "../utils/logger.js";

const AGENT_COMMAND_CHANNEL = "deployhub:agent:commands";

export interface AgentCommandMessage {
  serverId: string;
  event: string;
  payload: unknown;
}

export async function publishAgentCommand(message: AgentCommandMessage): Promise<void> {
  await redis.publish(AGENT_COMMAND_CHANNEL, JSON.stringify(message));
}

export function subscribeAgentCommands(
  handler: (message: AgentCommandMessage) => void,
): ReturnType<typeof redis.duplicate> {
  const subscriber = redis.duplicate();

  void subscriber.subscribe(AGENT_COMMAND_CHANNEL).catch((error) => {
    logger.error("Failed to subscribe to agent command channel", error);
  });

  subscriber.on("message", (_channel, raw) => {
    try {
      const parsed = JSON.parse(raw) as AgentCommandMessage;
      if (!parsed.serverId || !parsed.event) {
        logger.warn("Ignored invalid agent command message");
        return;
      }
      handler(parsed);
    } catch (error) {
      logger.error("Failed to parse agent command message", error);
    }
  });

  return subscriber;
}
