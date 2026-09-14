import { io, type Socket } from "socket.io-client";
import { env } from "../config/env.js";
import { registerDeployHandler } from "./handlers.js";

const AGENT_HEARTBEAT_INTERVAL_MS = 45_000;

let socket: Socket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function sendHeartbeat(sock: Socket): void {
  sock.emit("HEARTBEAT");
}

function startHeartbeat(sock: Socket): void {
  stopHeartbeat();
  sendHeartbeat(sock);
  heartbeatTimer = setInterval(() => sendHeartbeat(sock), AGENT_HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

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
    registerDeployHandler(socket!);
    startHeartbeat(socket!);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[INFO] Agent disconnected: ${reason}`);
    stopHeartbeat();
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
  stopHeartbeat();
  socket?.disconnect();
  socket = null;
}
