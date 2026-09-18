import { getUserSocket } from "./deployment-socket";

export function joinServerBootstrapRoom(serverId: string): void {
  getUserSocket().emit("server:bootstrap:join", { serverId });
}

export function leaveServerBootstrapRoom(serverId: string): void {
  getUserSocket().emit("server:bootstrap:leave", { serverId });
}

export type BootstrapLogEvent = { line: string; timestamp: string };
export type BootstrapStatusEvent = {
  status: "running" | "success" | "failed";
  errorMessage: string | null;
};
