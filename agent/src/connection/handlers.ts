import type { Socket } from "socket.io-client";
import type { DeployCommandPayload } from "../types/deploy.js";
import { runDeployment } from "../deployment/run-deployment.js";

function emitLog(socket: Socket, deploymentId: string, message: string): void {
  socket.emit("DEPLOYMENT_LOG", { deploymentId, message });
}

function emitStatus(
  socket: Socket,
  deploymentId: string,
  status: "SUCCESS" | "FAILED",
  errorMessage?: string,
): void {
  socket.emit("DEPLOYMENT_STATUS", { deploymentId, status, errorMessage });
}

export function registerDeployHandler(socket: Socket): void {
  socket.off("DEPLOY");
  socket.on("DEPLOY", async (payload: DeployCommandPayload) => {
    if (!payload?.deploymentId) {
      return;
    }

    const { deploymentId } = payload;

    try {
      emitLog(socket, deploymentId, "Agent received deploy command.");
      await runDeployment(payload, (message) => emitLog(socket, deploymentId, message));
      emitStatus(socket, deploymentId, "SUCCESS");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Deployment failed";
      emitLog(socket, deploymentId, `ERROR: ${message}`);
      emitStatus(socket, deploymentId, "FAILED", message);
    }
  });
}
