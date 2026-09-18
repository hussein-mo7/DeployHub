import { z } from "zod";

const base = {
  host: z.string().trim().min(1, "Host is required"),
  port: z.coerce.number().int().min(1).max(65535).default(22),
  username: z.string().trim().min(1, "SSH user is required"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Confirm one-time SSH access" }),
  }),
};

export const serverBootstrapKeySchema = z.object({
  ...base,
  authType: z.literal("privateKey"),
  privateKey: z.string().min(32, "Paste your private key"),
});

export const serverBootstrapPasswordSchema = z.object({
  ...base,
  authType: z.literal("password"),
  password: z.string().min(1, "Password is required"),
});

export type ServerBootstrapForm =
  | z.infer<typeof serverBootstrapKeySchema>
  | z.infer<typeof serverBootstrapPasswordSchema>;
