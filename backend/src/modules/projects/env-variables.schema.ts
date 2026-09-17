import { z } from "zod";
import { environmentIdParamsSchema } from "./projects.schema.js";

export const envVariableIdParamsSchema = environmentIdParamsSchema.extend({
  variableId: z.string().min(1),
});

const envVariableInputSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(255)
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Key must look like an environment variable name"),
  value: z.string().max(10000).optional(),
  isSecret: z.boolean().default(false),
});

export const saveEnvironmentVariablesSchema = z.object({
  variables: z.array(envVariableInputSchema).max(100),
  redeploy: z.boolean().default(false),
});

export type SaveEnvironmentVariablesInput = z.infer<typeof saveEnvironmentVariablesSchema>;
