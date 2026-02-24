// src/lib/utils/map-tip.ts
// Shared mapper: Prisma tip (with included relations) → TipWithCreator.

import type { TipWithCreator } from "@/types";

/**
 * Raw shape returned by Prisma when using the standard tip include.
 * Kept intentionally loose to accept Prisma's generated types without
 * importing the Prisma client directly.
 */
interface PrismaTipRow {
  id: string;
  direction: string;
  entryPrice: number;
  target1: number;
  target2: number | null;
  stopLoss: number;
  timeframe: string;
  status: string;
  returnPct: number | null;
  tipTimestamp: Date;
  stock: { symbol: string; name: string };
  creator: {
    id: string;
    slug: string;
    displayName: string;
    profileImageUrl: string | null;
    tier: string;
    isVerified: boolean;
    currentScore: { rmtScore: number } | null;
  };
}

export function mapTipRow(row: PrismaTipRow): TipWithCreator {
  return {
    id: row.id,
    direction: row.direction as TipWithCreator["direction"],
    entryPrice: row.entryPrice,
    target1: row.target1,
    target2: row.target2,
    stopLoss: row.stopLoss,
    timeframe: row.timeframe as TipWithCreator["timeframe"],
    status: row.status as TipWithCreator["status"],
    returnPct: row.returnPct,
    tipTimestamp: row.tipTimestamp.toISOString(),
    stockSymbol: row.stock.symbol,
    stockName: row.stock.name,
    creator: {
      id: row.creator.id,
      slug: row.creator.slug,
      displayName: row.creator.displayName,
      profileImageUrl: row.creator.profileImageUrl,
      tier: row.creator.tier,
      isVerified: row.creator.isVerified,
      rmtScore: row.creator.currentScore?.rmtScore ?? null,
    },
  };
}
