import { z } from "zod";
import { DEPLOYMENT_METHODS } from "../../constants/projects.js";

const deploymentMethodSchema = z.enum(DEPLOYMENT_METHODS);

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  repoOwner: z.string().trim().min(1).max(100),
  repoName: z.string().trim().min(1).max(100),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    repoOwner: z.string().trim().min(1).max(100).optional(),
    repoName: z.string().trim().min(1).max(100).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.repoOwner !== undefined ||
      data.repoName !== undefined,
    { message: "At least one field is required" },
  );

export const projectIdParamsSchema = z.object({
  projectId: z.string().min(1),
});

export const serviceIdParamsSchema = projectIdParamsSchema.extend({
  serviceId: z.string().min(1),
});

export const environmentIdParamsSchema = projectIdParamsSchema.extend({
  environmentId: z.string().min(1),
});

export const createServiceSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    description: z.string().trim().max(500).optional(),
    deploymentMethod: deploymentMethodSchema.default("DOCKERFILE"),
    dockerfilePath: z.string().trim().min(1).max(255).default("Dockerfile"),
    composeFilePath: z.string().trim().min(1).max(255).default("docker-compose.yml"),
    imageName: z.string().trim().min(1).max(255).optional(),
    buildContext: z.string().trim().min(1).max(255).default("."),
  })
  .superRefine((data, ctx) => {
    if (data.deploymentMethod === "IMAGE" && !data.imageName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "imageName is required for IMAGE deployment method",
        path: ["imageName"],
      });
    }
  });

export const updateServiceSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    deploymentMethod: deploymentMethodSchema.optional(),
    dockerfilePath: z.string().trim().min(1).max(255).optional(),
    composeFilePath: z.string().trim().min(1).max(255).optional(),
    imageName: z.string().trim().min(1).max(255).nullable().optional(),
    buildContext: z.string().trim().min(1).max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const createEnvironmentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  serverId: z.string().min(1),
  branch: z.string().trim().min(1).max(255).default("main"),
  autoDeployEnabled: z.boolean().default(false),
});

export const updateEnvironmentSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    serverId: z.string().min(1).optional(),
    branch: z.string().trim().min(1).max(255).optional(),
    autoDeployEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;
