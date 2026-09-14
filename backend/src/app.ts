import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { githubRoutes } from "./modules/github/github.routes.js";
import { serversRoutes } from "./modules/servers/servers.routes.js";
import { agentsRoutes } from "./modules/agents/agents.routes.js";
import { projectsRoutes } from "./modules/projects/projects.routes.js";
import { projectDeploymentRoutes, deploymentsRoutes } from "./modules/deployments/deployments.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({ name: "DeployHub API", version: "0.1.0" });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/servers", serversRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/projects/:projectId/environments", projectDeploymentRoutes);
app.use("/api/deployments", deploymentsRoutes);

app.use(errorMiddleware);
