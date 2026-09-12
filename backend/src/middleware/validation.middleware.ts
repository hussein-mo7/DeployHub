import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "./error.middleware.js";
import { ERROR_CODES } from "../constants/errors.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError(400, "Validation failed", ERROR_CODES.VALIDATION_ERROR, result.error.flatten()),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(
        new AppError(400, "Validation failed", ERROR_CODES.VALIDATION_ERROR, result.error.flatten()),
      );
      return;
    }

    req.query = result.data as typeof req.query;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(
        new AppError(400, "Validation failed", ERROR_CODES.VALIDATION_ERROR, result.error.flatten()),
      );
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };
}
