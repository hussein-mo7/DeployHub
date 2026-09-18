import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateServerSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field is required",
  });

export const serverIdParamsSchema = z.object({
  id: z.string().min(1),
});

const bootstrapBaseSchema = z.object({
  host: z.string().trim().min(1, "Host is required").max(253),
  port: z.coerce.number().int().min(1).max(65535).default(22),
  username: z.string().trim().min(1, "SSH user is required").max(64),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must confirm one-time SSH access" }),
  }),
});

export const bootstrapServerSchema = z.discriminatedUnion("authType", [
  bootstrapBaseSchema.extend({
    authType: z.literal("privateKey"),
    privateKey: z.string().min(32, "Paste a valid private key"),
    password: z.undefined().optional(),
  }),
  bootstrapBaseSchema.extend({
    authType: z.literal("password"),
    password: z.string().min(1, "Password is required"),
    privateKey: z.undefined().optional(),
  }),
]);

export type CreateServerInput = z.infer<typeof createServerSchema>;
export type UpdateServerInput = z.infer<typeof updateServerSchema>;
export type BootstrapServerInput = z.infer<typeof bootstrapServerSchema>;
