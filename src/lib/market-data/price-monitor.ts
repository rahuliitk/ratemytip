// src/lib/market-data/price-monitor.ts
//
// Price monitoring service for active tips.
// Checks current prices against tip targets and stop-losses,
// updates tip statuses in the database, and calculates returns
// for resolved tips.

import { db } from "@/lib/db";
import { TIP_STATUS } from "@/lib/constants";

import { YahooFinanceService } from "./yahoo-finance";
import type { CurrentPrice, TipStatusUpdate } from "./types";

/**
 * For asset classes that don't directly map to an exchange,
 * the stock's own exchange field is used as a fallback.
 * This map only provides overrides where the asset class is more specific.
 */
const ASSET_CLASS_TO_EXCHANGE: Record<string, string> = {
  CRYPTO: "CRYPTO",
  COMMODITY: "MCX",
};

/** Tip fields selected from the database for monitoring */
interface ActiveTipRow {
  readonly id: string;
  readonly direction: string;
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2: number | null;
  readonly target3: number | null;
  readonly stopLoss: number;
  readonly status: string;
  readonly expiresAt: Date;
  readonly assetClass: string;
  readonly target1HitAt: Date | null;
  readonly target2HitAt: Date | null;
  readonly stock: {
    readonly symbol: string;
    readonly exchange: string;
  };
}

/**
 * Price monitor that checks active tips against live market prices.
 *
 * Workflow:
 *   1. Fetch all tips with status ACTIVE, TARGET_1_HIT, or TARGET_2_HIT
 *   2. Group tips by stock symbol (deduplicate API calls)
 *   3. Fetch current price for each unique stock
 *   4. Evaluate each tip against its targets, stop-loss, and expiry
 *   5. Update tip status and performance fields in the database
 */
export class PriceMonitor {
  private readonly yahoo: YahooFinanceService;

  constructor(yahoo?: YahooFinanceService) {
    this.yahoo = yahoo ?? new YahooFinanceService();
  }

  /**
   * Check all active tips against current market prices.
   *
   * @returns Array of status updates that were applied
   */
  async checkActiveTips(): Promise<TipStatusUpdate[]> {
    // Fetch tips that are still being monitored
    const activeTips = await db.tip.findMany({
      where: {
        status: {
          in: ["ACTIVE", "TARGET_1_HIT", "TARGET_2_HIT"],
        },
      },
      select: {
        id: true,
        direction: true,
        entryPrice: true,
        target1: true,
        target2: true,
        target3: true,
        stopLoss: true,
        status: true,
        expiresAt: true,
        assetClass: true,
        target1HitAt: true,
        target2HitAt: true,
        stock: {
          select: {
            symbol: true,
            exchange: true,
          },
        },
      },
    });

    if (activeTips.length === 0) {
      console.log("[PriceMonitor] No active tips to check");
      return [];
    }

    console.log(
      `[PriceMonitor] Checking ${activeTips.length} active tips across ${this.countUniqueStocks(activeTips)} stocks`
    );

    // Group tips by stock symbol to deduplicate price fetches
    const tipsByStock = this.groupTipsByStock(activeTips);

    // Fetch prices for all unique stocks
    const priceMap = await this.fetchPricesForStocks(tipsByStock);

    // Evaluate each tip against its current price
    const updates: TipStatusUpdate[] = [];

    for (const tip of activeTips) {
      const currentPrice = priceMap.get(tip.stock.symbol);
      if (!currentPrice) {
        console.warn(
          `[PriceMonitor] No price available for ${tip.stock.symbol}, skipping tip ${tip.id}`
        );
        continue;
      }

      const update = await this.evaluateTip(tip, currentPrice);
      if (update) {
        updates.push(update);
      }
    }

    // Update the last price on each stock record
    await this.updateStockPrices(priceMap);

    console.log(
      `[PriceMonitor] Applied ${updates.length} status updates`
    );
    return updates;
  }

  /**
   * Evaluate a single tip against the current market price.
   * Determines if any target has been hit, stop-loss triggered, or tip expired.
   *
   * @returns A TipStatusUpdate if the status changed, or null if no change
   */
  private async evaluateTip(
    tip: ActiveTipRow,
    currentPrice: CurrentPrice
  ): Promise<TipStatusUpdate | null> {
    const now = new Date();
    const price = currentPrice.price;
    const isBuy = tip.direction === "BUY";

    // Check expiry first
    if (now >= tip.expiresAt) {
      return this.resolveTip(tip, price, TIP_STATUS.EXPIRED, now);
    }

    // Check stop-loss
    // BUY tip: price <= stopLoss means loss; SELL tip: price >= stopLoss means loss
    const stopLossHit = isBuy
      ? price <= tip.stopLoss
      : price >= tip.stopLoss;

    if (stopLossHit) {
      return this.resolveTip(tip, price, TIP_STATUS.STOPLOSS_HIT, now);
    }

    // Check targets in order (highest first for multi-target evaluation)
    const newStatus = this.checkTargets(tip, price, isBuy);

    if (newStatus && newStatus !== tip.status) {
      // Determine if this is a terminal status or an intermediate target hit
      const isTerminal = newStatus === TIP_STATUS.ALL_TARGETS_HIT;

      if (isTerminal) {
        return this.resolveTip(tip, price, newStatus, now);
      }

      // Intermediate target hit (TARGET_1_HIT or TARGET_2_HIT) — update status
      // but keep the tip active for monitoring remaining targets
      return this.updateTipStatus(tip, price, newStatus, now);
    }

    return null;
  }

  /**
   * Determine which targets have been hit based on the current price.
   * Returns the highest applicable status or null if no change.
   */
  private checkTargets(
    tip: ActiveTipRow,
    price: number,
    isBuy: boolean
  ): string | null {
    // For BUY: price >= target means hit
    // For SELL: price <= target means hit
    const targetHit = (target: number): boolean =>
      isBuy ? price >= target : price <= target;

    // Check target 3 (if exists and targets 1+2 already hit)
    if (
      tip.target3 !== null &&
      tip.target2HitAt !== null &&
      targetHit(tip.target3)
    ) {
      return TIP_STATUS.ALL_TARGETS_HIT;
    }

    // Check target 2 (if exists and target 1 already hit)
    if (
      tip.target2 !== null &&
      tip.target1HitAt !== null &&
      targetHit(tip.target2)
    ) {
      // If there is no target 3, this is the final target
      if (tip.target3 === null) {
        return TIP_STATUS.ALL_TARGETS_HIT;
      }
      return TIP_STATUS.TARGET_2_HIT;
    }

    // Check target 1
    if (targetHit(tip.target1)) {
      // If there are no further targets, this is the final target
      if (tip.target2 === null) {
        return TIP_STATUS.ALL_TARGETS_HIT;
      }
      return TIP_STATUS.TARGET_1_HIT;
    }

    return null;
  }

  /**
   * Resolve a tip to a terminal status (STOPLOSS_HIT, EXPIRED, ALL_TARGETS_HIT).
   * Calculates return percentage and risk-reward ratio, then updates the DB.
   */
  private async resolveTip(
    tip: ActiveTipRow,
    closedPrice: number,
    newStatus: string,
    timestamp: Date
  ): Promise<TipStatusUpdate> {
    const returnPct = this.calculateReturnPct(tip, closedPrice);
    const riskRewardRatio = this.calculateRiskRewardRatio(tip, closedPrice);

    const updateData: Record<string, unknown> = {
      status: newStatus,
      statusUpdatedAt: timestamp,
      closedPrice,
      closedAt: timestamp,
      returnPct,
      riskRewardRatio,
    };

    // Set the appropriate hit timestamp if resolving via a target hit
    if (newStatus === TIP_STATUS.ALL_TARGETS_HIT) {
      if (!tip.target1HitAt) {
        updateData.target1HitAt = timestamp;
      }
      if (tip.target2 !== null && !tip.target2HitAt) {
        updateData.target2HitAt = timestamp;
      }
      if (tip.target3 !== null) {
        updateData.target3HitAt = timestamp;
      }
    }

    if (newStatus === TIP_STATUS.STOPLOSS_HIT) {
      updateData.stopLossHitAt = timestamp;
    }

    await db.tip.update({
      where: { id: tip.id },
      data: updateData,
    });

    console.log(
      `[PriceMonitor] Tip ${tip.id}: ${tip.status} -> ${newStatus} ` +
        `(${tip.stock.symbol} @ ${closedPrice}, return: ${returnPct?.toFixed(2)}%)`
    );

    return {
      tipId: tip.id,
      oldStatus: tip.status,
      newStatus,
      price: closedPrice,
      timestamp,
    };
  }

  /**
   * Update a tip to an intermediate status (TARGET_1_HIT, TARGET_2_HIT).
   * The tip remains active for monitoring remaining targets.
   */
  private async updateTipStatus(
    tip: ActiveTipRow,
    price: number,
    newStatus: string,
    timestamp: Date
  ): Promise<TipStatusUpdate> {
    const updateData: Record<string, unknown> = {
      status: newStatus,
      statusUpdatedAt: timestamp,
    };

    if (newStatus === TIP_STATUS.TARGET_1_HIT && !tip.target1HitAt) {
      updateData.target1HitAt = timestamp;
    }
    if (newStatus === TIP_STATUS.TARGET_2_HIT && !tip.target2HitAt) {
      updateData.target2HitAt = timestamp;
    }

    await db.tip.update({
      where: { id: tip.id },
      data: updateData,
    });

    console.log(
      `[PriceMonitor] Tip ${tip.id}: ${tip.status} -> ${newStatus} ` +
        `(${tip.stock.symbol} @ ${price})`
    );

    return {
      tipId: tip.id,
      oldStatus: tip.status,
      newStatus,
      price,
      timestamp,
    };
  }

  /**
   * Calculate the return percentage for a resolved tip.
   *
   * BUY: (closedPrice - entryPrice) / entryPrice * 100
   * SELL: (entryPrice - closedPrice) / entryPrice * 100
   */
  private calculateReturnPct(
    tip: ActiveTipRow,
    closedPrice: number
  ): number {
    if (tip.direction === "BUY") {
      return ((closedPrice - tip.entryPrice) / tip.entryPrice) * 100;
    }
    return ((tip.entryPrice - closedPrice) / tip.entryPrice) * 100;
  }

  /**
   * Calculate the realized risk-reward ratio.
   *
   * Risk is defined as |entryPrice - stopLoss| / entryPrice.
   * Reward is the actual return achieved.
   * Ratio = reward / risk (negative if loss).
   */
  private calculateRiskRewardRatio(
    tip: ActiveTipRow,
    closedPrice: number
  ): number {
    const riskPct =
      Math.abs(tip.entryPrice - tip.stopLoss) / tip.entryPrice;

    if (riskPct === 0) {
      return 0;
    }

    const returnPct = this.calculateReturnPct(tip, closedPrice) / 100;
    return returnPct / riskPct;
  }

  /**
   * Group tips by their stock symbol for deduplicating price fetches.
   */
  private groupTipsByStock(
    tips: readonly ActiveTipRow[]
  ): Map<string, { symbol: string; exchange: string }> {
    const stockMap = new Map<string, { symbol: string; exchange: string }>();

    for (const tip of tips) {
      if (!stockMap.has(tip.stock.symbol)) {
        const exchange =
          ASSET_CLASS_TO_EXCHANGE[tip.assetClass] ?? tip.stock.exchange;
        stockMap.set(tip.stock.symbol, {
          symbol: tip.stock.symbol,
          exchange,
        });
      }
    }

    return stockMap;
  }

  /**
   * Fetch current prices for all unique stocks in the active tips set.
   */
  private async fetchPricesForStocks(
    stocks: Map<string, { symbol: string; exchange: string }>
  ): Promise<Map<string, CurrentPrice>> {
    const priceMap = new Map<string, CurrentPrice>();

    for (const [symbol, stock] of stocks) {
      const price = await this.yahoo.getCurrentPrice(
        stock.symbol,
        stock.exchange
      );

      if (price) {
        priceMap.set(symbol, price);
      }
    }

    return priceMap;
  }

  /**
   * Update the lastPrice and lastPriceAt fields on Stock records
   * with the latest fetched prices.
   */
  private async updateStockPrices(
    priceMap: Map<string, CurrentPrice>
  ): Promise<void> {
    for (const [symbol, price] of priceMap) {
      try {
        await db.stock.update({
          where: { symbol },
          data: {
            lastPrice: price.price,
            lastPriceAt: price.timestamp,
          },
        });
      } catch (error) {
        console.error(
          `[PriceMonitor] Failed to update price for ${symbol}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  /**
   * Count unique stock symbols across a set of tips.
   */
  private countUniqueStocks(tips: readonly ActiveTipRow[]): number {
    const symbols = new Set<string>();
    for (const tip of tips) {
      symbols.add(tip.stock.symbol);
    }
    return symbols.size;
  }
}
