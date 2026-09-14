import { prisma } from "../config/database.js";
import { redis } from "../config/redis.js";
import {
  findServerByAgentToken,
  setServerStatus,
  touchServerHeartbeat,
} from "../modules/agents/agents.service.js";
import { logger } from "../utils/logger.js";

const connectedAgents = new Map<string, string>();
const AGENT_ONLINE_TTL_SECONDS = 120;

function agentOnlineKey(serverId: string): string {
  return `deployhub:agent:online:${serverId}`;
}

export function getConnectedAgentSocketId(serverId: string): string | undefined {
  return connectedAgents.get(serverId);
}

export function isAgentOnline(serverId: string): boolean {
  return connectedAgents.has(serverId);
}

export async function isAgentOnlineInCluster(serverId: string): Promise<boolean> {
  if (connectedAgents.has(serverId)) {
    return true;
  }

  const marker = await redis.get(agentOnlineKey(serverId));
  return marker !== null;
}

export async function authenticateAgentSocket(token: unknown): Promise<string | null> {
  if (typeof token !== "string" || !token) {
    return null;
  }

  const server = await findServerByAgentToken(token);
  return server?.id ?? null;
}

export async function handleAgentConnect(serverId: string, socketId: string): Promise<void> {
  connectedAgents.set(serverId, socketId);
  await redis.set(agentOnlineKey(serverId), socketId, "EX", AGENT_ONLINE_TTL_SECONDS);
  await setServerStatus(serverId, "ONLINE");
  logger.info(`Agent online for server ${serverId}`);
}

export async function handleAgentDisconnect(serverId: string): Promise<void> {
  connectedAgents.delete(serverId);
  await redis.del(agentOnlineKey(serverId));
  await setServerStatus(serverId, "OFFLINE");
  logger.info(`Agent offline for server ${serverId}`);
}

export async function handleAgentHeartbeat(serverId: string): Promise<void> {
  const socketId = connectedAgents.get(serverId);
  if (socketId) {
    await redis.set(agentOnlineKey(serverId), socketId, "EX", AGENT_ONLINE_TTL_SECONDS);
  }
  await touchServerHeartbeat(serverId);
}

export async function syncStaleAgents(): Promise<void> {
  const onlineServerIds = [...connectedAgents.keys()];

  if (onlineServerIds.length === 0) {
    return;
  }

  await prisma.server.updateMany({
    where: { id: { in: onlineServerIds } },
    data: { status: "ONLINE" },
  });
}
