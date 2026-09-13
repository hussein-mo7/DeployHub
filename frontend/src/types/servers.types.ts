export const SERVER_STATUSES = [
  "UNREGISTERED",
  "CONNECTING",
  "ONLINE",
  "OFFLINE",
  "UNHEALTHY",
] as const;

export type ServerStatus = (typeof SERVER_STATUSES)[number];

export interface ServerSummary {
  id: string;
  name: string;
  description: string | null;
  status: ServerStatus;
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

export interface ListServersResponse {
  servers: ServerSummary[];
}

export interface GetServerResponse {
  server: ServerSummary;
}

export interface UpdateServerResponse {
  server: ServerSummary;
}

export interface DeleteServerResponse {
  message: string;
}

export interface ServerSetupInfo {
  registrationToken: string;
  installCommand: string;
  expiresAt: string;
}
