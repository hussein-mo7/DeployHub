import type { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  verifyEmail,
  resendVerificationEmail,
  getUserById,
  toAuthResponse,
} from "./auth.service.js";
import { setAuthCookies, clearAuthCookies, getRefreshTokenFromRequest } from "../../utils/cookies.js";

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user, tokens } = await loginUser(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json(toAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function refreshController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Refresh token required" },
      });
      return;
    }

    const tokens = await refreshSession(refreshToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ message: "Session refreshed" });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await logoutUser(getRefreshTokenFromRequest(req));
    clearAuthCookies(res);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await verifyEmail(req.body.token);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await resendVerificationEmail(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getUserById(req.user!.userId);

    if (!user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "User not found" },
      });
      return;
    }

    res.json(toAuthResponse(user));
  } catch (error) {
    next(error);
  }
}
