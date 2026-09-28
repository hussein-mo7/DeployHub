import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { githubWebhookController } from "./modules/github/github-webhook.controller.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { githubRoutes } from "./modules/github/github.routes.js";
import { serversRoutes } from "./modules/servers/servers.routes.js";
import { agentsRoutes } from "./modules/agents/agents.routes.js";
import { projectsRoutes } from "./modules/projects/projects.routes.js";
import { deploymentsRoutes, projectDeploymentRoutes } from "./modules/deployments/deployments.routes.js";
import { configRoutes } from "./modules/config/config.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.post(
  "/api/github/webhook",
  express.raw({ type: "application/json" }),
  githubWebhookController,
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res, next) => {
  if (env.NODE_ENV === "production") {
    next();
    return;
  }
  res.json({ name: "DeployHub API", version: "0.1.0" });
});

app.use("/api/health", healthRoutes);
app.use("/api/config", configRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/servers", serversRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/projects/:projectId/environments", projectDeploymentRoutes);
app.use("/api/deployments", deploymentsRoutes);

if (env.NODE_ENV === "production") {
  // Repo root when started via `npm run start` (WorkingDirectory = project root on VPS).
  const frontendDist = path.resolve(process.cwd(), "frontend/dist");
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      next();
      return;
    }
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

app.use(errorMiddleware);
