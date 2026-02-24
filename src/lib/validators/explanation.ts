import { z } from "zod";

export const createExplanationSchema = z.object({
  content: z
    .string()
    .min(1, "Explanation content is required")
    .max(5000, "Explanation must be under 5000 characters"),
  imageUrls: z
    .array(z.string().url("Each image URL must be valid"))
    .max(5, "Maximum 5 images allowed")
    .optional()
    .default([]),
});

export type CreateExplanationInput = z.infer<typeof createExplanationSchema>;

export const updateExplanationSchema = createExplanationSchema;

export type UpdateExplanationInput = z.infer<typeof updateExplanationSchema>;
