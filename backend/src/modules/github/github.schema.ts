import { z } from "zod";

export const githubCallbackSchema = z.object({
  installation_id: z.coerce.number().int().positive(),
  setup_action: z.string().optional(),
  state: z.string().min(1),
});

export const listReposQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(30),
});

export const repoParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

export type GitHubCallbackInput = z.infer<typeof githubCallbackSchema>;
export type ListReposQuery = z.infer<typeof listReposQuerySchema>;
export type RepoParams = z.infer<typeof repoParamsSchema>;
