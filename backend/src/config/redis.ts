import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => logger.info("Connected to Redis"));
redis.on("error", (error) => logger.error("Redis error", error));

export async function checkRedisConnection(): Promise<void> {
  const pong = await redis.ping();
  if (pong !== "PONG") {
    throw new Error("Redis ping failed");
  }
}
