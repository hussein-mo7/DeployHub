import type { Request, Response, NextFunction } from "express";
import {
  createServer,
  deleteServer,
  getServer,
  listServers,
  regenerateRegistrationToken,
  updateServer,
} from "./servers.service.js";

export async function createServerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createServer(req.user!.userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function listServersController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listServers(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getServerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getServer(req.user!.userId, req.params.id as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateServerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await updateServer(req.user!.userId, req.params.id as string, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteServerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await deleteServer(req.user!.userId, req.params.id as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function regenerateRegistrationTokenController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await regenerateRegistrationToken(req.user!.userId, req.params.id as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
