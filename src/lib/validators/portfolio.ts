// src/lib/validators/portfolio.ts

import { z } from "zod";

export const addPortfolioEntrySchema = z.object({
  tipId: z.string().min(1),
  quantity: z.number().positive().default(1),
  notes: z.string().max(500).optional(),
});

export const closePortfolioEntrySchema = z.object({
  closedPrice: z.number().positive(),
});

export const portfolioQuerySchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "ALL"]).default("ALL"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type AddPortfolioEntryInput = z.infer<typeof addPortfolioEntrySchema>;
export type ClosePortfolioEntryInput = z.infer<typeof closePortfolioEntrySchema>;
