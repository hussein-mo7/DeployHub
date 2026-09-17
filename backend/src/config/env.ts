import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CLIENT_URL: z.string().url(),
  /** Public API base URL (HTTPS in production). Used in agent install.sh and UI. Defaults to localhost:PORT in dev. */
  PUBLIC_API_URL: z.string().url().optional(),
  /** Docker image for agent on VPS, e.g. ghcr.io/org/deployhub-agent:latest */
  AGENT_DOCKER_IMAGE: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1),
  /** Access JWT + cookie lifetime (seconds). Default 15 minutes. */
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).default(900),
  /** Refresh token + cookie lifetime (seconds). Default 7 days. */
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().min(3600).default(604_800),
  ENCRYPTION_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1).default("DeployHub <onboarding@resend.dev>"),
  RESEND_API_KEY: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_SLUG: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    process.exit(1);
  }

  const data = result.data;
  if (data.REFRESH_TOKEN_TTL_SECONDS < data.ACCESS_TOKEN_TTL_SECONDS) {
    console.error(
      "Invalid environment variables: REFRESH_TOKEN_TTL_SECONDS must be >= ACCESS_TOKEN_TTL_SECONDS",
    );
    process.exit(1);
  }

  return data;
}

export const env = loadEnv();
