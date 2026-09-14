import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
import {
  authenticateAgentSocket,
  handleAgentConnect,
  handleAgentDisconnect,
  handleAgentHeartbeat,
} from "../services/agent-socket.service.js";
import {
  handleAgentDeploymentLog,
  handleAgentDeploymentStatus,
} from "../services/deployment-events.service.js";

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

    socket.on("deployment:join", (payload: { deploymentId?: string }) => {
      if (payload?.deploymentId) {
        void socket.join(`deployment:${payload.deploymentId}`);
      }
    });

    socket.on("deployment:leave", (payload: { deploymentId?: string }) => {
      if (payload?.deploymentId) {
        void socket.leave(`deployment:${payload.deploymentId}`);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`User socket disconnected: ${socket.id}`);
    });
  });

  const agentNamespace = io.of("/agent");

  agentNamespace.use(async (socket, next) => {
    try {
      const serverId = await authenticateAgentSocket(socket.handshake.auth.token);

      if (!serverId) {
        next(new Error("Agent authentication failed"));
        return;
      }

      socket.data.serverId = serverId;
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  agentNamespace.on("connection", async (socket) => {
    const serverId = socket.data.serverId as string;

    await handleAgentConnect(serverId, socket.id);
    socket.emit("CONNECTED", { serverId, timestamp: new Date().toISOString() });

    socket.on("HEARTBEAT", async () => {
      await handleAgentHeartbeat(serverId);
    });

    socket.on("DEPLOYMENT_LOG", (payload: { deploymentId?: string; message?: string }) => {
      if (!payload?.deploymentId) return;
      void handleAgentDeploymentLog(payload.deploymentId, payload.message ?? "").catch((error) => {
        logger.error("DEPLOYMENT_LOG handler failed", error);
      });
    });

    socket.on(
      "DEPLOYMENT_STATUS",
      (payload: { deploymentId?: string; status?: string; errorMessage?: string }) => {
        if (!payload?.deploymentId) return;
        void handleAgentDeploymentStatus(payload.deploymentId, payload).catch((error) => {
          logger.error("DEPLOYMENT_STATUS handler failed", error);
        });
      },
    );

    socket.on("disconnect", async () => {
      await handleAgentDisconnect(serverId);
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

/** API process only; worker and one-off scripts have no Socket.IO server. */
export function getIOIfReady(): Server | null {
  return io;
}

export function getAgentNamespace() {
  return getIO().of("/agent");
}
