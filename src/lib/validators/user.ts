import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters")
    .trim()
    .optional(),
  avatarUrl: z.string().url("Invalid URL").nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
