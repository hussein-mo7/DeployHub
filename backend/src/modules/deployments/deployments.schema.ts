import { z } from "zod";

export const projectIdParamsSchema = z.object({
  projectId: z.string().min(1),
});

export const environmentDeploymentParamsSchema = projectIdParamsSchema.extend({
  environmentId: z.string().min(1),
});

export const deploymentIdParamsSchema = z.object({
  deploymentId: z.string().min(1),
});
