import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validateParams } from "../../middleware/validation.middleware.js";
import {
  cancelDeploymentController,
  createEnvironmentDeploymentController,
  getDeploymentController,
  listEnvironmentDeploymentsController,
  rollbackDeploymentController,
} from "./deployments.controller.js";
import {
  deploymentIdParamsSchema,
  environmentDeploymentParamsSchema,
} from "./deployments.schema.js";

export const deploymentsRoutes = Router();

deploymentsRoutes.use(authMiddleware);

deploymentsRoutes.get(
  "/:deploymentId",
  validateParams(deploymentIdParamsSchema),
  getDeploymentController,
);

deploymentsRoutes.post(
  "/:deploymentId/cancel",
  validateParams(deploymentIdParamsSchema),
  cancelDeploymentController,
);

deploymentsRoutes.post(
  "/:deploymentId/rollback",
  validateParams(deploymentIdParamsSchema),
  rollbackDeploymentController,
);

export const projectDeploymentRoutes = Router({ mergeParams: true });

projectDeploymentRoutes.use(authMiddleware);

projectDeploymentRoutes.post(
  "/:environmentId/deployments",
  validateParams(environmentDeploymentParamsSchema),
  createEnvironmentDeploymentController,
);

projectDeploymentRoutes.get(
  "/:environmentId/deployments",
  validateParams(environmentDeploymentParamsSchema),
  listEnvironmentDeploymentsController,
);
