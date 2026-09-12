import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { ERROR_CODES } from "../../constants/errors.js";
import { AppError } from "../../middleware/error.middleware.js";
import { generateOpaqueToken, hashToken } from "../../utils/tokens.js";
import type { RegisterAgentResult } from "../servers/servers.types.js";
import type { RegisterAgentInput } from "./agents.schema.js";

export async function registerAgent(input: RegisterAgentInput): Promise<RegisterAgentResult> {
  const tokenHash = hashToken(input.registrationToken);

  const server = await prisma.server.findUnique({
    where: { registrationTokenHash: tokenHash },
  });

  if (!server) {
    throw new AppError(400, "Invalid registration token", ERROR_CODES.INVALID_REGISTRATION_TOKEN);
  }

  if (server.agentTokenHash) {
    throw new AppError(
      409,
      "Server is already registered",
      ERROR_CODES.SERVER_ALREADY_REGISTERED,
    );
  }

  if (!server.registrationTokenExpiresAt || server.registrationTokenExpiresAt < new Date()) {
    throw new AppError(
      410,
      "Registration token has expired",
      ERROR_CODES.REGISTRATION_TOKEN_EXPIRED,
    );
  }

  const agentToken = generateOpaqueToken();
  const agentTokenHash = hashToken(agentToken);

  await prisma.server.update({
    where: { id: server.id },
    data: {
      agentTokenHash,
      registrationTokenHash: null,
      registrationTokenExpiresAt: null,
      registeredAt: new Date(),
      status: "OFFLINE",
    },
  });

  return {
    serverId: server.id,
    agentToken,
    controlPlaneUrl: `http://localhost:${env.PORT}`,
  };
}

export async function findServerByAgentToken(token: string) {
  const tokenHash = hashToken(token);
  return prisma.server.findUnique({ where: { agentTokenHash: tokenHash } });
}

export async function setServerStatus(
  serverId: string,
  status: "CONNECTING" | "ONLINE" | "OFFLINE",
): Promise<void> {
  await prisma.server.update({
    where: { id: serverId },
    data: {
      status,
      lastSeenAt: new Date(),
    },
  });
}

export async function touchServerHeartbeat(serverId: string): Promise<void> {
  await prisma.server.update({
    where: { id: serverId },
    data: { lastSeenAt: new Date() },
  });
}

export function getInstallScript(): string {
  const port = env.PORT;
  return `#!/usr/bin/env bash
set -euo pipefail

REGISTRATION_TOKEN="\${1:-}"
if [ -z "$REGISTRATION_TOKEN" ]; then
  echo "Usage: curl -fsSL http://localhost:${port}/api/agents/install.sh | bash -s -- <registration-token>"
  exit 1
fi

CONTROL_PLANE_URL="http://localhost:${port}"
RESPONSE=$(curl -fsS -X POST "$CONTROL_PLANE_URL/api/agents/register" \\
  -H "Content-Type: application/json" \\
  -d "{\\"registrationToken\\":\\"$REGISTRATION_TOKEN\\"}")

SERVER_ID=$(echo "$RESPONSE" | sed -n 's/.*"serverId"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p')
AGENT_TOKEN=$(echo "$RESPONSE" | sed -n 's/.*"agentToken"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p')

if [ -z "$AGENT_TOKEN" ]; then
  echo "Registration failed:"
  echo "$RESPONSE"
  exit 1
fi

mkdir -p /etc/deployhub
cat > /etc/deployhub/agent.env <<EOF
CONTROL_PLANE_URL=$CONTROL_PLANE_URL
AGENT_TOKEN=$AGENT_TOKEN
NODE_ENV=production
EOF

echo "Agent registered for server: $SERVER_ID"
echo "Saved credentials to /etc/deployhub/agent.env"
echo "Start the DeployHub agent with AGENT_TOKEN from that file."
`;
}
