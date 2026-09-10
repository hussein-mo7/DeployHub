import type { Request, Response, NextFunction } from "express";
import { getHealthStatus } from "./health.service.js";

export async function healthController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const health = await getHealthStatus();
    res.json(health);
  } catch (error) {
    next(error);
  }
}
