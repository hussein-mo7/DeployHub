import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { healthRoutes } from "./modules/health/health.routes.js";
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

app.use(errorMiddleware);
