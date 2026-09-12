import type { Request, Response, NextFunction } from "express";
import { getInstallScript, registerAgent } from "./agents.service.js";

export async function registerAgentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await registerAgent(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export function installScriptController(_req: Request, res: Response): void {
  res.type("text/plain").send(getInstallScript());
}
