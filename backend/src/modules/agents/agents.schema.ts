import { z } from "zod";

export const registerAgentSchema = z.object({
  registrationToken: z.string().min(1, "Registration token is required"),
});

export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;
