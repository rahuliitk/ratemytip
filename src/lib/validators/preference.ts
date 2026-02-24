// src/lib/validators/preference.ts

import { z } from "zod";

export const userPreferenceSchema = z.object({
  preferredTimeframes: z.array(z.enum(["INTRADAY", "SWING", "POSITIONAL", "LONG_TERM"])).default([]),
  preferredAssetClasses: z.array(z.enum(["EQUITY", "INDEX", "FUTURES", "OPTIONS", "CRYPTO", "COMMODITY", "FOREX"])).default([]),
  riskTolerance: z.enum(["LOW", "MODERATE", "HIGH"]).default("MODERATE"),
  minCreatorScore: z.number().min(0).max(100).nullable().optional(),
  preferredSectors: z.array(z.string().max(100)).default([]),
});

export type UserPreferenceInput = z.infer<typeof userPreferenceSchema>;
