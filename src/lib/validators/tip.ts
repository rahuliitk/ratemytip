import { z } from "zod";

export const createTipSchema = z
  .object({
    creatorId: z.string().cuid(),
    stockId: z.string().cuid(),
    direction: z.enum(["BUY", "SELL"]),
    assetClass: z.enum(["EQUITY", "INDEX", "FUTURES", "OPTIONS", "CRYPTO", "COMMODITY", "FOREX"]),
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
  })
  .refine((data) => data.entryPrice !== data.stopLoss, {
    message: "Entry price and stop-loss must not be equal (zero risk)",
    path: ["stopLoss"],
  })
  .refine(
    (data) => {
      if (data.direction === "BUY") {
        return data.stopLoss < data.entryPrice && data.target1 > data.entryPrice;
      }
      return data.stopLoss > data.entryPrice && data.target1 < data.entryPrice;
    },
    {
      message:
        "For BUY: target must be above entry and stop-loss below. For SELL: target must be below entry and stop-loss above.",
      path: ["target1"],
    },
  );

export type CreateTipInput = z.infer<typeof createTipSchema>;
