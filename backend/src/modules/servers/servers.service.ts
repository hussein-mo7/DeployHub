import type { Server } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { getPublicApiBaseUrl } from "../../config/public-url.js";
import { REGISTRATION_TOKEN_MAX_AGE_MS } from "../../constants/servers.js";
import { ERROR_CODES } from "../../constants/errors.js";
import { AppError } from "../../middleware/error.middleware.js";
import { generateOpaqueToken, hashToken } from "../../utils/tokens.js";
import type { CreateServerResult, ServerSummary } from "./servers.types.js";
import type { CreateServerInput, UpdateServerInput } from "./servers.schema.js";

function toServerSummary(server: Server): ServerSummary {
  return {
    id: server.id,
    name: server.name,
    description: server.description,
    status: server.status,
    lastSeenAt: server.lastSeenAt?.toISOString() ?? null,
    registeredAt: server.registeredAt?.toISOString() ?? null,
    createdAt: server.createdAt.toISOString(),
    updatedAt: server.updatedAt.toISOString(),
  };
}

function buildInstallCommand(registrationToken: string): string {
  const baseUrl = getPublicApiBaseUrl();
  return `curl -fsSL ${baseUrl}/api/agents/install.sh | bash -s -- ${registrationToken}`;
}

async function getOwnedServer(userId: string, serverId: string): Promise<Server> {
  const server = await prisma.server.findFirst({
    where: { id: serverId, userId },
  });

  if (!server) {
    throw new AppError(404, "Server not found", ERROR_CODES.SERVER_NOT_FOUND);
  }

  return server;
}

export async function createServer(
  userId: string,
  input: CreateServerInput,
): Promise<CreateServerResult> {
  const registrationToken = generateOpaqueToken();
  const registrationTokenHash = hashToken(registrationToken);
  const registrationTokenExpiresAt = new Date(Date.now() + REGISTRATION_TOKEN_MAX_AGE_MS);

  const server = await prisma.server.create({
    data: {
      userId,
      name: input.name,
      description: input.description,
      registrationTokenHash,
      registrationTokenExpiresAt,
    },
  });

  return {
    server: toServerSummary(server),
    registrationToken,
    installCommand: buildInstallCommand(registrationToken),
    expiresAt: registrationTokenExpiresAt.toISOString(),
  };
}

export async function listServers(userId: string): Promise<{ servers: ServerSummary[] }> {
  const servers = await prisma.server.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return { servers: servers.map(toServerSummary) };
}

export async function getServer(userId: string, serverId: string): Promise<{ server: ServerSummary }> {
  const server = await getOwnedServer(userId, serverId);
  return { server: toServerSummary(server) };
}

export async function updateServer(
  userId: string,
  serverId: string,
  input: UpdateServerInput,
): Promise<{ server: ServerSummary }> {
  await getOwnedServer(userId, serverId);

  const server = await prisma.server.update({
    where: { id: serverId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });

  return { server: toServerSummary(server) };
}

export async function deleteServer(userId: string, serverId: string): Promise<{ message: string }> {
  await getOwnedServer(userId, serverId);
  await prisma.server.delete({ where: { id: serverId } });
  return { message: "Server deleted successfully" };
}

export async function regenerateRegistrationToken(
  userId: string,
  serverId: string,
): Promise<CreateServerResult> {
  const server = await getOwnedServer(userId, serverId);

  if (server.agentTokenHash) {
    throw new AppError(
      409,
      "Server is already registered. Delete and recreate to register a new agent.",
      ERROR_CODES.SERVER_ALREADY_REGISTERED,
    );
  }

  const registrationToken = generateOpaqueToken();
  const registrationTokenHash = hashToken(registrationToken);
  const registrationTokenExpiresAt = new Date(Date.now() + REGISTRATION_TOKEN_MAX_AGE_MS);

  const updated = await prisma.server.update({
    where: { id: serverId },
    data: {
      registrationTokenHash,
      registrationTokenExpiresAt,
      status: "UNREGISTERED",
    },
  });

  return {
    server: toServerSummary(updated),
    registrationToken,
    installCommand: buildInstallCommand(registrationToken),
    expiresAt: registrationTokenExpiresAt.toISOString(),
  };
}

export { toServerSummary, getOwnedServer };
