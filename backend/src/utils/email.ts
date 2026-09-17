import { env } from "../config/env.js";
import { logger } from "./logger.js";

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;

  if (!env.RESEND_API_KEY) {
    logger.info(`[DEV] Email verification link for ${email}:`);
    logger.info(verifyUrl);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: "Verify your DeployHub account",
      html: `
        <p>Welcome to DeployHub!</p>
        <p>Click the link below to open the verification page:</p>
        <p><a href="${verifyUrl}">Verify your email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you did not create an account, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("Failed to send verification email", body);

    if (env.NODE_ENV === "development") {
      logger.warn(
        "[DEV] Resend failed. Common fixes: EMAIL_FROM must be DeployHub <onboarding@resend.dev>, " +
          "and the recipient must be the email on your Resend account (test sender restriction).",
      );
      logger.warn("[DEV] Verification link logged below — use this to continue Postman testing:");
      logger.info(verifyUrl);
      return;
    }

    throw new Error("Failed to send verification email");
  }

  const result = (await response.json()) as { id?: string };
  logger.info(`Verification email sent to ${email}${result.id ? ` (Resend id: ${result.id})` : ""}`);
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;

  if (!env.RESEND_API_KEY) {
    logger.info(`[DEV] Password reset link for ${email}:`);
    logger.info(resetUrl);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: "Reset your DeployHub password",
      html: `
        <p>We received a request to reset your DeployHub password.</p>
        <p><a href="${resetUrl}">Choose a new password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("Failed to send password reset email", body);

    if (env.NODE_ENV === "development") {
      logger.warn("[DEV] Password reset link logged below:");
      logger.info(resetUrl);
      return;
    }

    throw new Error("Failed to send password reset email");
  }

  const result = (await response.json()) as { id?: string };
  logger.info(`Password reset email sent to ${email}${result.id ? ` (Resend id: ${result.id})` : ""}`);
}
