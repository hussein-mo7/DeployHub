import { io, type Socket } from "socket.io-client";
import { env } from "../config/env.js";

let socket: Socket | null = null;

export function connectAgentSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(`${env.CONTROL_PLANE_URL}/agent`, {
    auth: { token: env.AGENT_TOKEN },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log(`[INFO] Agent connected: ${socket?.id}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[INFO] Agent disconnected: ${reason}`);
  });

  socket.on("connect_error", (error) => {
    console.error(`[ERROR] Agent connection error: ${error.message}`);
  });

  return socket;
}

export function getAgentSocket(): Socket | null {
  return socket;
}

export function disconnectAgentSocket(): void {
  socket?.disconnect();
  socket = null;
}
