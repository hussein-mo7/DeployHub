import type { Response, Request } from "express";
import { env } from "../config/env.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../constants/auth.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    path: "/",
  });
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: "/api/auth",
  });
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...cookieOptions, path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...cookieOptions, path: "/api/auth" });
}

export function getRefreshTokenFromRequest(req: Request): string | undefined {
  return req.cookies[REFRESH_TOKEN_COOKIE];
}
