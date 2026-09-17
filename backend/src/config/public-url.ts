import { env } from "./env.js";

/** Base URL for agent install scripts and agent WebSocket (reachable from VPS). */
export function getPublicApiBaseUrl(): string {
  if (env.PUBLIC_API_URL) {
    return env.PUBLIC_API_URL.replace(/\/$/, "");
  }
  return `http://localhost:${env.PORT}`;
}
