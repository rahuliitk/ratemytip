// src/lib/portfolio/index.ts
//
// Portfolio service — calculates P&L for individual positions and full portfolios.

import { db } from "@/lib/db";
import type { PositionPnl, PortfolioSummary, PortfolioAnalytics } from "./types";
import { differenceInDays } from "date-fns";

/**
 * Calculate P&L for a single position.
 * For BUY: pnl = (currentPrice - entryPrice) * quantity
 * For SELL: pnl = (entryPrice - currentPrice) * quantity
 */
export function calculatePositionPnl(
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  direction: "BUY" | "SELL",
  isRealized: boolean
): PositionPnl {
  const pnl = direction === "BUY"
    ? (currentPrice - entryPrice) * quantity
    : (entryPrice - currentPrice) * quantity;
  const pnlPct = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
  const adjustedPnlPct = direction === "SELL" ? -pnlPct : pnlPct;

  return { entryPrice, currentPrice, quantity, pnl, pnlPct: adjustedPnlPct, isRealized };
}

/**
 * Calculate aggregated P&L for all positions in a user's portfolio.
 */
export async function calculatePortfolioPnl(userId: string): Promise<PortfolioSummary> {
  const portfolio = await db.portfolio.findFirst({
    where: { userId },
    include: {
      entries: {
        include: {
          tip: {
            select: {
              direction: true,
              entryPrice: true,
              closedPrice: true,
              status: true,
              stock: { select: { lastPrice: true } },
            },
          },
        },
      },
    },
  });

  if (!portfolio) {
    return { totalValue: 0, totalInvested: 0, totalPnl: 0, totalPnlPct: 0, openPositions: 0, closedPositions: 0, winRate: 0 };
  }

  let totalInvested = 0;
  let totalValue = 0;
  let openCount = 0;
  let closedCount = 0;
  let wins = 0;

  for (const entry of portfolio.entries) {
    const invested = entry.entryPrice * entry.quantity;
    totalInvested += invested;

    if (entry.status === "OPEN") {
      const currentPrice = entry.tip.stock.lastPrice ?? entry.entryPrice;
      const pnl = calculatePositionPnl(entry.entryPrice, currentPrice, entry.quantity, entry.tip.direction, false);
      totalValue += invested + pnl.pnl;
      openCount++;
    } else {
      const closedPrice = entry.closedPrice ?? entry.entryPrice;
      const pnl = calculatePositionPnl(entry.entryPrice, closedPrice, entry.quantity, entry.tip.direction, true);
      totalValue += invested + pnl.pnl;
      closedCount++;
      if (pnl.pnl > 0) wins++;
    }
  }

  const totalPnl = totalValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const winRate = closedCount > 0 ? (wins / closedCount) * 100 : 0;

  return { totalValue, totalInvested, totalPnl, totalPnlPct, openPositions: openCount, closedPositions: closedCount, winRate };
}

/**
 * Get detailed analytics for a user's portfolio (PRO+ feature).
 */
export async function getPortfolioAnalytics(userId: string): Promise<PortfolioAnalytics> {
  const summary = await calculatePortfolioPnl(userId);

  const portfolio = await db.portfolio.findFirst({
    where: { userId },
    include: {
      entries: {
        include: {
          tip: {
            select: {
              id: true,
              direction: true,
              entryPrice: true,
              closedPrice: true,
              assetClass: true,
              stock: { select: { sector: true, lastPrice: true } },
            },
          },
        },
      },
    },
  });

  if (!portfolio) {
    return { summary, sectorAllocation: [], assetClassAllocation: [], avgHoldingDays: 0, bestPosition: null, worstPosition: null };
  }

  // Sector allocation
  const sectorMap = new Map<string, { count: number; value: number }>();
  const assetClassMap = new Map<string, number>();
  let totalHoldingDays = 0;
  let holdingCount = 0;
  let best: { tipId: string; pnlPct: number } | null = null;
  let worst: { tipId: string; pnlPct: number } | null = null;

  for (const entry of portfolio.entries) {
    const sector = entry.tip.stock.sector ?? "Unknown";
    const existing = sectorMap.get(sector) ?? { count: 0, value: 0 };
    existing.count++;
    existing.value += entry.entryPrice * entry.quantity;
    sectorMap.set(sector, existing);

    const ac = entry.tip.assetClass;
    assetClassMap.set(ac, (assetClassMap.get(ac) ?? 0) + 1);

    if (entry.closedAt) {
      totalHoldingDays += differenceInDays(entry.closedAt, entry.createdAt);
      holdingCount++;
    }

    const currentPrice = entry.closedPrice ?? entry.tip.stock.lastPrice ?? entry.entryPrice;
    const pnlPct = entry.entryPrice > 0
      ? ((currentPrice - entry.entryPrice) / entry.entryPrice) * 100 * (entry.tip.direction === "SELL" ? -1 : 1)
      : 0;

    if (!best || pnlPct > best.pnlPct) best = { tipId: entry.tip.id, pnlPct };
    if (!worst || pnlPct < worst.pnlPct) worst = { tipId: entry.tip.id, pnlPct };
  }

  return {
    summary,
    sectorAllocation: Array.from(sectorMap.entries()).map(([sector, d]) => ({ sector, ...d })),
    assetClassAllocation: Array.from(assetClassMap.entries()).map(([assetClass, count]) => ({ assetClass, count })),
    avgHoldingDays: holdingCount > 0 ? Math.round(totalHoldingDays / holdingCount) : 0,
    bestPosition: best,
    worstPosition: worst,
  };
}
