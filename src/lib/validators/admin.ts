import { z } from "zod";

export const reviewTipSchema = z.object({
  action: z.enum(["approve", "reject", "edit_and_approve"]),
  note: z.string().max(500).optional(),
  edits: z.object({
    entryPrice: z.number().positive().optional(),
    target1: z.number().positive().optional(),
    target2: z.number().positive().optional(),
    target3: z.number().positive().optional(),
    stopLoss: z.number().positive().optional(),
    timeframe: z.enum(["INTRADAY", "SWING", "POSITIONAL", "LONG_TERM"]).optional(),
    stockId: z.string().cuid().optional(),
  }).optional(),
});

export const triggerScrapeSchema = z.object({
  platform: z.enum(["TWITTER", "YOUTUBE", "WEBSITE"]),
  type: z.enum(["FULL", "INCREMENTAL"]),
  creatorId: z.string().cuid().optional(),
});

export const claimsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const reportsQuerySchema = z.object({
  status: z.enum(["PENDING_REPORT", "REVIEWED", "ACTIONED", "DISMISSED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReviewTipInput = z.infer<typeof reviewTipSchema>;
export type TriggerScrapeInput = z.infer<typeof triggerScrapeSchema>;
export type ClaimsQueryInput = z.infer<typeof claimsQuerySchema>;
export type ReportsQueryInput = z.infer<typeof reportsQuerySchema>;
