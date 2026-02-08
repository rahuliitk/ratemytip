// tests/fixtures/scoring.ts
//
// Reusable test fixture builders for the scoring algorithm tests.
// All dates are deterministic (pinned) so tests are never flaky.

import type { CompletedTip } from "@/lib/scoring/types";
import { TIP_STATUS, TIP_DIRECTION, TIP_TIMEFRAME } from "@/lib/constants";

// ────────────────────────────────────────
// Base date for all test fixtures
// ────────────────────────────────────────

/** All tests are pinned relative to this date: 2025-07-15 */
export const BASE_DATE = new Date("2025-07-15T10:00:00.000Z");

// ────────────────────────────────────────
// Tip builder
// ────────────────────────────────────────

let tipCounter = 0;

interface TipOverrides {
  readonly id?: string;
  readonly creatorId?: string;
  readonly status?: string;
  readonly direction?: string;
  readonly timeframe?: string;
  readonly entryPrice?: number;
  readonly target1?: number;
  readonly target2?: number | null;
  readonly target3?: number | null;
  readonly stopLoss?: number;
  readonly closedPrice?: number | null;
  readonly closedAt?: Date;
  readonly tipTimestamp?: Date;
  readonly returnPct?: number | null;
  readonly riskRewardRatio?: number | null;
}

/**
 * Creates a CompletedTip with sensible defaults for a BUY tip that hit target 1.
 * Override any field as needed.
 */
export function buildCompletedTip(overrides: TipOverrides = {}): CompletedTip {
  tipCounter++;
  const id = overrides.id ?? `tip-${tipCounter}`;

  return {
    id,
    creatorId: overrides.creatorId ?? "creator-1",
    status: (overrides.status ?? TIP_STATUS.TARGET_1_HIT) as CompletedTip["status"],
    direction: (overrides.direction ?? TIP_DIRECTION.BUY) as CompletedTip["direction"],
    timeframe: (overrides.timeframe ?? TIP_TIMEFRAME.SWING) as CompletedTip["timeframe"],
    entryPrice: overrides.entryPrice ?? 1000,
    target1: overrides.target1 ?? 1100,
    target2: overrides.target2 === undefined ? null : overrides.target2,
    target3: overrides.target3 === undefined ? null : overrides.target3,
    stopLoss: overrides.stopLoss ?? 950,
    closedPrice: overrides.closedPrice === undefined ? 1100 : overrides.closedPrice,
    closedAt: overrides.closedAt ?? BASE_DATE,
    tipTimestamp: overrides.tipTimestamp ?? new Date(BASE_DATE.getTime() - 7 * 24 * 60 * 60 * 1000),
    returnPct: overrides.returnPct === undefined ? null : overrides.returnPct,
    riskRewardRatio: overrides.riskRewardRatio === undefined ? null : overrides.riskRewardRatio,
  };
}

/**
 * Creates a CompletedTip that hit the stop-loss (a loss).
 */
export function buildLosingTip(overrides: TipOverrides = {}): CompletedTip {
  return buildCompletedTip({
    status: TIP_STATUS.STOPLOSS_HIT,
    closedPrice: 950,
    ...overrides,
  });
}

/**
 * Creates a CompletedTip that expired without hitting target or stoploss.
 */
export function buildExpiredTip(overrides: TipOverrides = {}): CompletedTip {
  return buildCompletedTip({
    status: TIP_STATUS.EXPIRED,
    closedPrice: 1020,
    ...overrides,
  });
}

/**
 * Creates a CompletedTip for a SELL direction that hit target 1.
 */
export function buildSellTip(overrides: TipOverrides = {}): CompletedTip {
  return buildCompletedTip({
    direction: TIP_DIRECTION.SELL,
    entryPrice: 1000,
    target1: 900,
    stopLoss: 1050,
    closedPrice: 900,
    ...overrides,
  });
}

/**
 * Creates a tip with multi-target setup (target1, target2, target3).
 */
export function buildMultiTargetTip(overrides: TipOverrides = {}): CompletedTip {
  return buildCompletedTip({
    entryPrice: 1000,
    target1: 1100,
    target2: 1200,
    target3: 1300,
    stopLoss: 950,
    ...overrides,
  });
}

// ────────────────────────────────────────
// Batch builders
// ────────────────────────────────────────

/**
 * Creates N winning tips, all closed on different days counting back from BASE_DATE.
 */
export function buildWinningTips(count: number, baseDate?: Date): CompletedTip[] {
  const base = baseDate ?? BASE_DATE;
  return Array.from({ length: count }, (_, i) =>
    buildCompletedTip({
      status: TIP_STATUS.TARGET_1_HIT,
      closedAt: new Date(base.getTime() - i * 24 * 60 * 60 * 1000),
      tipTimestamp: new Date(base.getTime() - (i + 7) * 24 * 60 * 60 * 1000),
    }),
  );
}

/**
 * Creates N losing tips, all closed on different days counting back from BASE_DATE.
 */
export function buildLosingTips(count: number, baseDate?: Date): CompletedTip[] {
  const base = baseDate ?? BASE_DATE;
  return Array.from({ length: count }, (_, i) =>
    buildLosingTip({
      closedAt: new Date(base.getTime() - i * 24 * 60 * 60 * 1000),
      tipTimestamp: new Date(base.getTime() - (i + 7) * 24 * 60 * 60 * 1000),
    }),
  );
}

/**
 * Creates tips spread across multiple months for consistency testing.
 * Returns tips where each month has the specified accuracy rate.
 *
 * @param monthlyConfig - Array of { year, month, wins, losses } definitions
 */
export function buildMonthlyTips(
  monthlyConfig: readonly {
    readonly year: number;
    readonly month: number;
    readonly wins: number;
    readonly losses: number;
  }[],
): CompletedTip[] {
  const tips: CompletedTip[] = [];

  for (const config of monthlyConfig) {
    const monthBase = new Date(config.year, config.month - 1, 15, 12, 0, 0);

    // Add winning tips
    for (let i = 0; i < config.wins; i++) {
      tips.push(
        buildCompletedTip({
          status: TIP_STATUS.TARGET_1_HIT,
          closedAt: new Date(monthBase.getTime() + i * 24 * 60 * 60 * 1000),
          tipTimestamp: new Date(monthBase.getTime() + (i - 7) * 24 * 60 * 60 * 1000),
        }),
      );
    }

    // Add losing tips
    for (let i = 0; i < config.losses; i++) {
      tips.push(
        buildLosingTip({
          closedAt: new Date(monthBase.getTime() + (config.wins + i) * 24 * 60 * 60 * 1000),
          tipTimestamp: new Date(monthBase.getTime() + (config.wins + i - 7) * 24 * 60 * 60 * 1000),
        }),
      );
    }
  }

  return tips;
}

/**
 * Resets the tip counter. Call in beforeEach to ensure deterministic IDs.
 */
export function resetTipCounter(): void {
  tipCounter = 0;
}
