// src/lib/validators/subscription.ts

import { z } from "zod";

export const checkoutSessionSchema = z.object({
  tier: z.enum(["PRO", "PREMIUM"]),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
