import type { Request, Response, NextFunction } from "express";
import {
  cancelDeployment,
  createDeploymentForEnvironment,
  getDeployment,
  listEnvironmentDeployments,
  rollbackDeployment,
} from "./deployments.service.js";

export async function createEnvironmentDeploymentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createDeploymentForEnvironment(
      req.user!.userId,
      req.params.projectId as string,
      req.params.environmentId as string,
      "MANUAL",
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listEnvironmentDeploymentsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listEnvironmentDeployments(
      req.user!.userId,
      req.params.projectId as string,
      req.params.environmentId as string,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDeploymentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getDeployment(req.user!.userId, req.params.deploymentId as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function cancelDeploymentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await cancelDeployment(req.user!.userId, req.params.deploymentId as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function rollbackDeploymentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await rollbackDeployment(req.user!.userId, req.params.deploymentId as string);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
