import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../middleware/validation.middleware.js";
import {
  createServerController,
  deleteServerController,
  getServerController,
  listServersController,
  bootstrapServerController,
  regenerateRegistrationTokenController,
  updateServerController,
} from "./servers.controller.js";
import {
  bootstrapServerSchema,
  createServerSchema,
  serverIdParamsSchema,
  updateServerSchema,
} from "./servers.schema.js";

export const serversRoutes = Router();

serversRoutes.use(authMiddleware);

serversRoutes.get("/", listServersController);
serversRoutes.post("/", validateBody(createServerSchema), createServerController);
serversRoutes.get("/:id", validateParams(serverIdParamsSchema), getServerController);
serversRoutes.patch(
  "/:id",
  validateParams(serverIdParamsSchema),
  validateBody(updateServerSchema),
  updateServerController,
);
serversRoutes.delete("/:id", validateParams(serverIdParamsSchema), deleteServerController);
serversRoutes.post(
  "/:id/regenerate-token",
  validateParams(serverIdParamsSchema),
  regenerateRegistrationTokenController,
);
serversRoutes.post(
  "/:id/bootstrap",
  validateParams(serverIdParamsSchema),
  validateBody(bootstrapServerSchema),
  bootstrapServerController,
);
