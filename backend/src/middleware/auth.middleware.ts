import type { Request, Response, NextFunction } from "express";
import { ACCESS_TOKEN_COOKIE } from "../constants/auth.js";
import { AppError } from "./error.middleware.js";
import { ERROR_CODES } from "../constants/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies[ACCESS_TOKEN_COOKIE];

  if (!token) {
    next(new AppError(401, "Authentication required", ERROR_CODES.UNAUTHORIZED));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired session", ERROR_CODES.UNAUTHORIZED));
  }
}
