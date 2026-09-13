import type { Request, Response, NextFunction } from "express";
import {
  createEnvironment,
  createProject,
  createService,
  deleteEnvironment,
  deleteProject,
  deleteService,
  getEnvironment,
  getProject,
  getService,
  listEnvironments,
  listProjects,
  listServices,
  updateEnvironment,
  updateProject,
  updateService,
} from "./projects.service.js";

export async function createProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createProject(req.user!.userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listProjectsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listProjects(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getProject(req.user!.userId, req.params.projectId as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await updateProject(
      req.user!.userId,
      req.params.projectId as string,
      req.body,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await deleteProject(req.user!.userId, req.params.projectId as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createService(
      req.user!.userId,
      req.params.projectId as string,
      req.body,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listServicesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listServices(req.user!.userId, req.params.projectId as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getService(
      req.user!.userId,
      req.params.projectId as string,
      req.params.serviceId as string,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await updateService(
      req.user!.userId,
      req.params.projectId as string,
      req.params.serviceId as string,
      req.body,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteServiceController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await deleteService(
      req.user!.userId,
      req.params.projectId as string,
      req.params.serviceId as string,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createEnvironmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createEnvironment(
      req.user!.userId,
      req.params.projectId as string,
      req.body,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listEnvironmentsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listEnvironments(req.user!.userId, req.params.projectId as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getEnvironmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getEnvironment(
      req.user!.userId,
      req.params.projectId as string,
      req.params.environmentId as string,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateEnvironmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await updateEnvironment(
      req.user!.userId,
      req.params.projectId as string,
      req.params.environmentId as string,
      req.body,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteEnvironmentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await deleteEnvironment(
      req.user!.userId,
      req.params.projectId as string,
      req.params.environmentId as string,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}
