import { z } from "zod";

export const followSchema = z.object({
  creatorId: z.string().min(1, "Creator ID is required"),
});

export type FollowInput = z.infer<typeof followSchema>;
