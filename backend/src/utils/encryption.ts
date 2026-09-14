import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const KEY = scryptSync(env.ENCRYPTION_KEY, "deployhub-env-secrets", 32);

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptSecret(payload: string): string {
  const [version, ivEncoded, authTagEncoded, dataEncoded] = payload.split(":");

  if (version !== VERSION || !ivEncoded || !authTagEncoded || !dataEncoded) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = Buffer.from(ivEncoded, "base64url");
  const authTag = Buffer.from(authTagEncoded, "base64url");
  const encrypted = Buffer.from(dataEncoded, "base64url");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export const SECRET_MASK = "••••••••";
