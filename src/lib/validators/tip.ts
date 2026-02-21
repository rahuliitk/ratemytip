import { z } from "zod";

export const createTipSchema = z.object({
  creatorId: z.string().cuid(),
  stockId: z.string().cuid(),
  direction: z.enum(["BUY", "SELL"]),
  assetClass: z.enum(["EQUITY_NSE", "EQUITY_BSE", "INDEX", "FUTURES", "OPTIONS", "CRYPTO", "COMMODITY"]),
  entryPrice: z.number().positive(),
  target1: z.number().positive(),
  target2: z.number().positive().optional(),
  target3: z.number().positive().optional(),
  stopLoss: z.number().positive(),
  timeframe: z.enum(["INTRADAY", "SWING", "POSITIONAL", "LONG_TERM"]),
  conviction: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  rationale: z.string().max(1000).optional(),
  sourceUrl: z.string().url().optional(),
  tipTimestamp: z.string().datetime(),
});

export type CreateTipInput = z.infer<typeof createTipSchema>;
