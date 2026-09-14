import type { Request, Response, NextFunction } from "express";
import {
  listEnvironmentVariables,
  saveEnvironmentVariables,
} from "./env-variables.service.js";

export async function listEnvironmentVariablesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listEnvironmentVariables(
      req.user!.userId,
      req.params.projectId as string,
      req.params.environmentId as string,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function saveEnvironmentVariablesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await saveEnvironmentVariables(
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
