import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { getPublicApiBaseUrl } from "../../config/public-url.js";
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
    controlPlaneUrl: getPublicApiBaseUrl(),
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
  await prisma.server.updateMany({
    where: { id: serverId },
    data: {
      status,
      lastSeenAt: new Date(),
    },
  });
}

export async function touchServerHeartbeat(serverId: string): Promise<boolean> {
  const result = await prisma.server.updateMany({
    where: { id: serverId },
    data: { lastSeenAt: new Date() },
  });
  return result.count > 0;
}

export function getInstallScript(): string {
  const apiBase = getPublicApiBaseUrl();
  const agentImage = env.AGENT_DOCKER_IMAGE ?? "";
  const dockerBlock =
    agentImage.length > 0
      ? `
if command -v docker >/dev/null 2>&1; then
  echo "Pulling agent image ${agentImage}..."
  docker pull ${agentImage}
  docker rm -f deployhub-agent 2>/dev/null || true
  docker run -d --name deployhub-agent --restart unless-stopped \\
    -v /var/run/docker.sock:/var/run/docker.sock \\
    --env-file /etc/deployhub/agent.env \\
    ${agentImage}
  echo "Agent container started. Check ONLINE status in DeployHub."
else
  echo "Docker not found. Install Docker, then run:"
  echo "  docker pull ${agentImage}"
  echo "  docker run -d --name deployhub-agent --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock --env-file /etc/deployhub/agent.env ${agentImage}"
fi`
      : `
echo "Set AGENT_DOCKER_IMAGE on the control plane for automatic docker run, or see docs/AGENT-SETUP.md"`;

  return `#!/usr/bin/env bash
set -euo pipefail

REGISTRATION_TOKEN="\${1:-}"
if [ -z "$REGISTRATION_TOKEN" ]; then
  echo "Usage: curl -fsSL ${apiBase}/api/agents/install.sh | bash -s -- <registration-token>"
  exit 1
fi

CONTROL_PLANE_URL="${apiBase}"
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
${dockerBlock}
`;
}
