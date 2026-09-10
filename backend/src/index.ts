import "dotenv/config";
import { createServer } from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { redis } from "./config/redis.js";
import { initSocketIO } from "./config/socket.js";
import { logger } from "./utils/logger.js";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await redis.ping();

  const httpServer = createServer(app);
  initSocketIO(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`DeployHub API running at http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    httpServer.close();
    await disconnectDatabase();
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});
