import { env } from "../config/env.js";

export const ACCESS_TOKEN_COOKIE = "deployhub_access_token";
export const REFRESH_TOKEN_COOKIE = "deployhub_refresh_token";

export const ACCESS_TOKEN_MAX_AGE_MS = env.ACCESS_TOKEN_TTL_SECONDS * 1000;
export const REFRESH_TOKEN_MAX_AGE_MS = env.REFRESH_TOKEN_TTL_SECONDS * 1000;
export const EMAIL_VERIFICATION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export const BCRYPT_ROUNDS = 12;
