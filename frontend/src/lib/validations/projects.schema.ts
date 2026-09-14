import { z } from "zod";
import { DEPLOYMENT_METHODS } from "@/types/projects.types";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  repoOwner: z.string().trim().min(1, "Repository owner is required").max(100),
  repoName: z.string().trim().min(1, "Repository name is required").max(100),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    repoOwner: z.string().trim().min(1).max(100).optional(),
    repoName: z.string().trim().min(1).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const createServiceSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    description: z.string().trim().max(500).optional(),
    deploymentMethod: z.enum(DEPLOYMENT_METHODS).default("DOCKERFILE"),
    dockerfilePath: z.string().trim().min(1).max(255).default("Dockerfile"),
    composeFilePath: z.string().trim().min(1).max(255).default("docker-compose.yml"),
    imageName: z.string().trim().min(1).max(255).optional(),
    buildContext: z.string().trim().min(1).max(255).default("."),
  })
  .superRefine((data, ctx) => {
    if (data.deploymentMethod === "IMAGE" && !data.imageName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Image name is required for IMAGE deployment method",
        path: ["imageName"],
      });
    }
  });

export const createEnvironmentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  serverId: z.string().min(1, "Server is required"),
  branch: z.string().trim().min(1, "Branch is required").max(255).default("main"),
  autoDeployEnabled: z.boolean().default(false),
});

export type CreateProjectForm = z.infer<typeof createProjectSchema>;
export type UpdateProjectForm = z.infer<typeof updateProjectSchema>;
export type CreateServiceForm = z.infer<typeof createServiceSchema>;
export type CreateEnvironmentForm = z.infer<typeof createEnvironmentSchema>;

export const envVariableDraftSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(255)
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Key must look like an environment variable name"),
  value: z.string().max(10000),
  isSecret: z.boolean().default(false),
});

export const saveEnvironmentVariablesSchema = z.object({
  variables: z.array(envVariableDraftSchema).max(100),
  redeploy: z.boolean().default(false),
});

export type SaveEnvironmentVariablesForm = z.infer<typeof saveEnvironmentVariablesSchema>;
