import { prisma } from "../../config/database.js";
import { checkRedisConnection } from "../../config/redis.js";

export async function getHealthStatus() {
  await prisma.$queryRaw`SELECT 1`;
  await checkRedisConnection();

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      redis: "connected",
    },
  };
}
