export const REGISTRATION_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const SERVER_STATUSES = [
  "UNREGISTERED",
  "CONNECTING",
  "ONLINE",
  "OFFLINE",
  "UNHEALTHY",
] as const;

export type ServerStatusValue = (typeof SERVER_STATUSES)[number];
