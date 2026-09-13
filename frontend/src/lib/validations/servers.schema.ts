import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateServerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500),
});

export type CreateServerForm = z.infer<typeof createServerSchema>;
export type UpdateServerForm = z.infer<typeof updateServerSchema>;
