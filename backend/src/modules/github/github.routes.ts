import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validation.middleware.js";
import {
  callbackController,
  disconnectController,
  installUrlController,
  integrationController,
  listBranchesController,
  listReposController,
} from "./github.controller.js";
import {
  githubCallbackSchema,
  listReposQuerySchema,
  repoParamsSchema,
} from "./github.schema.js";

export const githubRoutes = Router();

githubRoutes.get("/install-url", authMiddleware, installUrlController);
githubRoutes.get("/integration", authMiddleware, integrationController);
githubRoutes.delete("/integration", authMiddleware, disconnectController);
githubRoutes.get(
  "/repos",
  authMiddleware,
  validateQuery(listReposQuerySchema),
  listReposController,
);
githubRoutes.get(
  "/repos/:owner/:repo/branches",
  authMiddleware,
  validateParams(repoParamsSchema),
  listBranchesController,
);

// GitHub redirects here after install — state JWT identifies the user (no cookie required)
githubRoutes.get("/callback", validateQuery(githubCallbackSchema), callbackController);
