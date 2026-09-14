import "dotenv/config";
import { env } from "./config/env.js";
import { connectAgentSocket, disconnectAgentSocket } from "./connection/socket.js";

console.log(`[INFO] DeployHub Agent starting (${env.NODE_ENV})`);

const socket = connectAgentSocket();

const shutdown = (signal: string) => {
  console.log(`[INFO] ${signal} received, shutting down agent...`);
  disconnectAgentSocket();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
