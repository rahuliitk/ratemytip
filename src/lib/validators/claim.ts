import { z } from "zod";

export const createClaimRequestSchema = z.object({
  proofUrl: z
    .string()
    .url("Must be a valid URL")
    .min(10, "Proof URL is required"),
  verificationNote: z
    .string()
    .max(1000, "Verification note must be under 1000 characters")
    .optional(),
});

export type CreateClaimRequestInput = z.infer<typeof createClaimRequestSchema>;

export const reviewClaimSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z
    .string()
    .max(500, "Review note must be under 500 characters")
    .optional(),
});

export type ReviewClaimInput = z.infer<typeof reviewClaimSchema>;
