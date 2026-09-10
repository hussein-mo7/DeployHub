import "dotenv/config";
import { redis } from "./config/redis.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { workers, closeWorkers } from "./workers/index.js";
import { logger } from "./utils/logger.js";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await redis.ping();

  logger.info(`DeployHub worker started (${workers.length} queues)`);

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down worker...`);
    await closeWorkers();
    await disconnectDatabase();
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logger.error("Failed to start worker", error);
  process.exit(1);
});
