import { z } from "zod";

export const createDirectTipSchema = z.object({
  stockSymbol: z.string().min(1, "Stock symbol is required").max(20),
  direction: z.enum(["BUY", "SELL"]),
  entryPrice: z.number().positive("Entry price must be positive"),
  target1: z.number().positive("Target 1 must be positive"),
  target2: z.number().positive("Target 2 must be positive").nullable().optional(),
  target3: z.number().positive("Target 3 must be positive").nullable().optional(),
  stopLoss: z.number().positive("Stop loss must be positive"),
  timeframe: z.enum(["INTRADAY", "SWING", "POSITIONAL", "LONG_TERM"]),
  conviction: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  rationale: z.string().max(2000, "Rationale must be under 2000 characters").optional(),
  sourceUrl: z.string().url("Must be a valid URL").optional(),
}).refine(
  (data) => {
    if (data.direction === "BUY") {
      return data.target1 > data.entryPrice && data.stopLoss < data.entryPrice;
    }
    return data.target1 < data.entryPrice && data.stopLoss > data.entryPrice;
  },
  {
    message: "For BUY tips, target must be above entry and SL below entry. For SELL, the reverse.",
  }
);

export type CreateDirectTipInput = z.infer<typeof createDirectTipSchema>;

export const updateDirectTipSchema = z.object({
  rationale: z.string().max(2000, "Rationale must be under 2000 characters").optional(),
  conviction: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  sourceUrl: z.string().url("Must be a valid URL").nullable().optional(),
});

export type UpdateDirectTipInput = z.infer<typeof updateDirectTipSchema>;
