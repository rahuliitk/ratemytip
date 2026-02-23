import { z } from "zod";

export const creatorReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().max(2000, "Review cannot exceed 2000 characters").trim().nullable().optional(),
});

export type CreatorReviewInput = z.infer<typeof creatorReviewSchema>;
