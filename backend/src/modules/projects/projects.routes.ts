import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../middleware/validation.middleware.js";
import {
  createEnvironmentController,
  createProjectController,
  createServiceController,
  deleteEnvironmentController,
  deleteProjectController,
  deleteServiceController,
  getEnvironmentController,
  getProjectController,
  getServiceController,
  listEnvironmentsController,
  listProjectsController,
  listServicesController,
  updateEnvironmentController,
  updateProjectController,
  updateServiceController,
} from "./projects.controller.js";
import {
  createEnvironmentSchema,
  createProjectSchema,
  createServiceSchema,
  environmentIdParamsSchema,
  projectIdParamsSchema,
  serviceIdParamsSchema,
  updateEnvironmentSchema,
  updateProjectSchema,
  updateServiceSchema,
} from "./projects.schema.js";

export const projectsRoutes = Router();

projectsRoutes.use(authMiddleware);

projectsRoutes.get("/", listProjectsController);
projectsRoutes.post("/", validateBody(createProjectSchema), createProjectController);
projectsRoutes.get(
  "/:projectId",
  validateParams(projectIdParamsSchema),
  getProjectController,
);
projectsRoutes.patch(
  "/:projectId",
  validateParams(projectIdParamsSchema),
  validateBody(updateProjectSchema),
  updateProjectController,
);
projectsRoutes.delete(
  "/:projectId",
  validateParams(projectIdParamsSchema),
  deleteProjectController,
);

projectsRoutes.get(
  "/:projectId/services",
  validateParams(projectIdParamsSchema),
  listServicesController,
);
projectsRoutes.post(
  "/:projectId/services",
  validateParams(projectIdParamsSchema),
  validateBody(createServiceSchema),
  createServiceController,
);
projectsRoutes.get(
  "/:projectId/services/:serviceId",
  validateParams(serviceIdParamsSchema),
  getServiceController,
);
projectsRoutes.patch(
  "/:projectId/services/:serviceId",
  validateParams(serviceIdParamsSchema),
  validateBody(updateServiceSchema),
  updateServiceController,
);
projectsRoutes.delete(
  "/:projectId/services/:serviceId",
  validateParams(serviceIdParamsSchema),
  deleteServiceController,
);

projectsRoutes.get(
  "/:projectId/environments",
  validateParams(projectIdParamsSchema),
  listEnvironmentsController,
);
projectsRoutes.post(
  "/:projectId/environments",
  validateParams(projectIdParamsSchema),
  validateBody(createEnvironmentSchema),
  createEnvironmentController,
);
projectsRoutes.get(
  "/:projectId/environments/:environmentId",
  validateParams(environmentIdParamsSchema),
  getEnvironmentController,
);
projectsRoutes.patch(
  "/:projectId/environments/:environmentId",
  validateParams(environmentIdParamsSchema),
  validateBody(updateEnvironmentSchema),
  updateEnvironmentController,
);
projectsRoutes.delete(
  "/:projectId/environments/:environmentId",
  validateParams(environmentIdParamsSchema),
  deleteEnvironmentController,
);
