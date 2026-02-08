import { createHash } from "crypto";

export function calculateTipContentHash(tip: {
  creatorId: string;
  stockSymbol: string;
  direction: string;
  entryPrice: number;
  target1: number;
  target2: number | null;
  target3: number | null;
  stopLoss: number;
  timeframe: string;
  tipTimestamp: Date;
}): string {
  const content = [
    tip.creatorId,
    tip.stockSymbol,
    tip.direction,
    tip.entryPrice.toFixed(2),
    tip.target1.toFixed(2),
    tip.target2?.toFixed(2) ?? "null",
    tip.target3?.toFixed(2) ?? "null",
    tip.stopLoss.toFixed(2),
    tip.timeframe,
    tip.tipTimestamp.toISOString(),
  ].join("|");

  return createHash("sha256").update(content).digest("hex");
}
