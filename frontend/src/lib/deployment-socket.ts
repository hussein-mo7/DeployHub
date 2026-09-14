import { io, type Socket } from "socket.io-client";

function resolveSocketOrigin(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (!configured || configured.startsWith("/")) {
    return window.location.origin;
  }

  try {
    return new URL(configured).origin;
  } catch {
    return window.location.origin;
  }
}

let socket: Socket | null = null;

export function getUserSocket(): Socket {
  if (!socket) {
    socket = io(resolveSocketOrigin(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function joinDeploymentRoom(deploymentId: string): void {
  getUserSocket().emit("deployment:join", { deploymentId });
}

export function leaveDeploymentRoom(deploymentId: string): void {
  void getUserSocket().emit("deployment:leave", { deploymentId });
}
