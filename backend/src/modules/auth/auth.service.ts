import bcrypt from "bcrypt";
import { prisma } from "../../config/database.js";
import {
  BCRYPT_ROUNDS,
  EMAIL_VERIFICATION_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../../constants/auth.js";
import { AppError } from "../../middleware/error.middleware.js";
import { ERROR_CODES } from "../../constants/errors.js";
import { signAccessToken } from "../../utils/jwt.js";
import { generateOpaqueToken, hashToken } from "../../utils/tokens.js";
import { sendVerificationEmail } from "../../utils/email.js";
import type { AuthUser, SessionTokens } from "./auth.types.js";
import type { LoginInput, RegisterInput, ResendVerificationInput } from "./auth.schema.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  createdAt: true,
} as const;

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

async function createEmailVerificationToken(userId: string, email: string): Promise<void> {
  const token = generateOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_MAX_AGE_MS);

  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  await sendVerificationEmail(email, token);
}

async function createSession(userId: string): Promise<SessionTokens> {
  const accessToken = signAccessToken({ userId });

  const refreshToken = generateOpaqueToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { accessToken, refreshToken };
}

async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function registerUser(
  input: RegisterInput,
): Promise<{ message: string; email: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new AppError(409, "Email is already registered", ERROR_CODES.EMAIL_IN_USE);
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      emailVerified: false,
    },
  });

  await createEmailVerificationToken(user.id, user.email);

  return {
    message: "Registration successful. Please check your email to verify your account.",
    email: user.email,
  };
}

export async function loginUser(input: LoginInput): Promise<{ user: AuthUser; tokens: SessionTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new AppError(401, "Invalid email or password", ERROR_CODES.INVALID_CREDENTIALS);
  }

  const valid = await bcrypt.compare(input.password, user.password);

  if (!valid) {
    throw new AppError(401, "Invalid email or password", ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (!user.emailVerified) {
    throw new AppError(
      403,
      "Please verify your email before signing in",
      ERROR_CODES.EMAIL_NOT_VERIFIED,
    );
  }

  const tokens = await createSession(user.id);

  return {
    user: toAuthUser(user),
    tokens,
  };
}

export async function refreshSession(refreshToken: string): Promise<SessionTokens> {
  const tokenHash = hashToken(refreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: userSelect } },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError(401, "Invalid or expired refresh token", ERROR_CODES.UNAUTHORIZED);
  }

  if (!stored.user.emailVerified) {
    throw new AppError(403, "Email not verified", ERROR_CODES.EMAIL_NOT_VERIFIED);
  }

  await revokeRefreshToken(tokenHash);
  return createSession(stored.userId);
}

export async function logoutUser(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  await revokeRefreshToken(tokenHash);
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const tokenHash = hashToken(token);

  const stored = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored) {
    throw new AppError(400, "Invalid verification token", ERROR_CODES.INVALID_VERIFICATION_TOKEN);
  }

  if (stored.expiresAt < new Date()) {
    throw new AppError(410, "Verification link has expired", ERROR_CODES.VERIFICATION_TOKEN_EXPIRED);
  }

  if (stored.user.emailVerified) {
    return { message: "Email is already verified. You can sign in." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: stored.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: stored.userId } }),
  ]);

  return { message: "Email verified successfully. You can now sign in." };
}

export async function resendVerificationEmail(
  input: ResendVerificationInput,
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (user && !user.emailVerified) {
    await createEmailVerificationToken(user.id, user.email);
  }

  return {
    message: "If an unverified account exists for this email, a new verification link has been sent.",
  };
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  return user ? toAuthUser(user) : null;
}

export function toAuthResponse(user: AuthUser) {
  return { user };
}
