import { z } from "zod";

export const updateCreatorSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  specializations: z.array(z.string()).optional(),
});

export const moderateCreatorSchema = z.object({
  action: z.enum(["ACTIVATED", "DEACTIVATED", "FLAGGED", "UNFLAGGED", "NOTE_ADDED"]),
  reason: z.string().min(1).max(500),
});

export type UpdateCreatorInput = z.infer<typeof updateCreatorSchema>;
export type ModerateCreatorInput = z.infer<typeof moderateCreatorSchema>;
