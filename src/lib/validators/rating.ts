import { z } from "zod";

export const tipRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export type TipRatingInput = z.infer<typeof tipRatingSchema>;
