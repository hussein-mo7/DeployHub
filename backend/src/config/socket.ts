import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let io: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`User socket connected: ${socket.id}`);
    socket.on("disconnect", () => {
      logger.info(`User socket disconnected: ${socket.id}`);
    });
  });

  const agentNamespace = io.of("/agent");
  agentNamespace.on("connection", (socket) => {
    logger.info(`Agent socket connected: ${socket.id}`);
    socket.on("disconnect", () => {
      logger.info(`Agent socket disconnected: ${socket.id}`);
    });
  });

  logger.info("Socket.IO initialized");
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}
