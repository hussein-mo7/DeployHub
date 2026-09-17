import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { getPublicApiBaseUrl } from "../../config/public-url.js";

export function publicConfigController(_req: Request, res: Response): void {
  const agentDockerImage = env.AGENT_DOCKER_IMAGE ?? null;

  res.json({
    publicApiUrl: getPublicApiBaseUrl(),
    agentDockerImage,
    agentInstallMode: agentDockerImage ? "docker" : "manual",
  });
}
