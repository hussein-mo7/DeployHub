import type { ServerStatusValue } from "../../constants/servers.js";

export interface ServerSummary {
  id: string;
  name: string;
  description: string | null;
  status: ServerStatusValue;
  sshHost: string | null;
  sshPort: number;
  sshUser: string | null;
  lastSeenAt: string | null;
  registeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServerResult {
  server: ServerSummary;
  registrationToken: string;
  installCommand: string;
  expiresAt: string;
}

export interface RegisterAgentResult {
  serverId: string;
  agentToken: string;
  controlPlaneUrl: string;
}
