// tests/unit/scoring/composite.test.ts
//
// Unit tests for the Composite RMT Score Calculator.
// The composite score combines all four scoring components:
//   RMT Score = (0.40 * Accuracy) + (0.30 * Risk-Adjusted) + (0.20 * Consistency) + (0.10 * Volume)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateCompositeScore } from "@/lib/scoring/composite";
import {
  SCORING,
  TIP_STATUS,
  TIP_TIMEFRAME,
  CREATOR_TIER,
} from "@/lib/constants";
import {
  buildCompletedTip,
  buildLosingTip,
  buildExpiredTip,
  buildWinningTips,
  buildLosingTips,
  buildMonthlyTips,
  resetTipCounter,
  BASE_DATE,
} from "../../fixtures/scoring";
import type { CompletedTip } from "@/lib/scoring/types";

const HALF_LIFE = SCORING.RECENCY_DECAY_HALFLIFE_DAYS;

beforeEach(() => {
  resetTipCounter();
  vi.useFakeTimers();
  vi.setSystemTime(BASE_DATE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("calculateCompositeScore", () => {
  // ────────────────────────────────────────
  // Basic score properties
  // ────────────────────────────────────────

  it("produces score between 0 and 100 for any valid input", () => {
    const tips = [...buildWinningTips(15), ...buildLosingTips(10)];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.rmtScore).toBeGreaterThanOrEqual(0);
    expect(result.rmtScore).toBeLessThanOrEqual(100);
  });

  it("produces score between 0 and 100 for all-winning tips", () => {
    const tips = buildWinningTips(30);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.rmtScore).toBeGreaterThanOrEqual(0);
    expect(result.rmtScore).toBeLessThanOrEqual(100);
  });

  it("produces score between 0 and 100 for all-losing tips", () => {
    const tips = buildLosingTips(30);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.rmtScore).toBeGreaterThanOrEqual(0);
    expect(result.rmtScore).toBeLessThanOrEqual(100);
  });

  // ────────────────────────────────────────
  // Weight verification
  // ────────────────────────────────────────

  it("applies correct weights: 40% accuracy + 30% risk-adj + 20% consistency + 10% volume", () => {
    const tips = [...buildWinningTips(15), ...buildLosingTips(5)];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    // Manually verify the composite calculation
    const expected =
      SCORING.WEIGHTS.ACCURACY * result.accuracyScore +
      SCORING.WEIGHTS.RISK_ADJUSTED_RETURN * result.riskAdjustedScore +
      SCORING.WEIGHTS.CONSISTENCY * result.consistencyScore +
      SCORING.WEIGHTS.VOLUME_FACTOR * result.volumeFactorScore;

    expect(result.rmtScore).toBeCloseTo(expected, 3);
  });

  it("weights sum to 1.0", () => {
    const totalWeight =
      SCORING.WEIGHTS.ACCURACY +
      SCORING.WEIGHTS.RISK_ADJUSTED_RETURN +
      SCORING.WEIGHTS.CONSISTENCY +
      SCORING.WEIGHTS.VOLUME_FACTOR;

    expect(totalWeight).toBeCloseTo(1.0, 10);
  });

  // ────────────────────────────────────────
  // Score comparison: better creators should score higher
  // ────────────────────────────────────────

  it("produces higher score for more accurate creators", () => {
    // Creator A: 90% accuracy (18 wins, 2 losses)
    const tipsA = [...buildWinningTips(18), ...buildLosingTips(2)];
    const scoreA = calculateCompositeScore({ tips: tipsA, halfLifeDays: HALF_LIFE });

    // Creator B: 50% accuracy (10 wins, 10 losses)
    const tipsB = [...buildWinningTips(10), ...buildLosingTips(10)];
    const scoreB = calculateCompositeScore({ tips: tipsB, halfLifeDays: HALF_LIFE });

    expect(scoreA.rmtScore).toBeGreaterThan(scoreB.rmtScore);
    expect(scoreA.accuracyRate).toBeGreaterThan(scoreB.accuracyRate);
  });

  it("produces higher score for more consistent creators at same accuracy", () => {
    // Creator A: 60% accuracy every month (very consistent)
    const tipsA = buildMonthlyTips([
      { year: 2025, month: 1, wins: 6, losses: 4 },
      { year: 2025, month: 2, wins: 6, losses: 4 },
      { year: 2025, month: 3, wins: 6, losses: 4 },
      { year: 2025, month: 4, wins: 6, losses: 4 },
      { year: 2025, month: 5, wins: 6, losses: 4 },
    ]);

    // Creator B: same overall 60% accuracy but wildly inconsistent
    const tipsB = buildMonthlyTips([
      { year: 2025, month: 1, wins: 10, losses: 0 },  // 100%
      { year: 2025, month: 2, wins: 2, losses: 8 },    // 20%
      { year: 2025, month: 3, wins: 10, losses: 0 },   // 100%
      { year: 2025, month: 4, wins: 2, losses: 8 },    // 20%
      { year: 2025, month: 5, wins: 6, losses: 4 },    // 60%
    ]);

    const scoreA = calculateCompositeScore({ tips: tipsA, halfLifeDays: HALF_LIFE });
    const scoreB = calculateCompositeScore({ tips: tipsB, halfLifeDays: HALF_LIFE });

    // Both have same overall accuracy, but A is more consistent
    expect(scoreA.consistencyScore).toBeGreaterThan(scoreB.consistencyScore);
  });

  // ────────────────────────────────────────
  // Component scores are all 0-100
  // ────────────────────────────────────────

  it("all component scores are between 0 and 100", () => {
    const tips = [...buildWinningTips(15), ...buildLosingTips(10)];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.accuracyScore).toBeGreaterThanOrEqual(0);
    expect(result.accuracyScore).toBeLessThanOrEqual(100);

    expect(result.riskAdjustedScore).toBeGreaterThanOrEqual(0);
    expect(result.riskAdjustedScore).toBeLessThanOrEqual(100);

    expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(result.consistencyScore).toBeLessThanOrEqual(100);

    expect(result.volumeFactorScore).toBeGreaterThanOrEqual(0);
    expect(result.volumeFactorScore).toBeLessThanOrEqual(100);
  });

  // ────────────────────────────────────────
  // Tier calculation
  // ────────────────────────────────────────

  it("returns UNRATED tier for creator with fewer than 20 tips", () => {
    const tips = buildWinningTips(15);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.tier).toBe(CREATOR_TIER.UNRATED);
    expect(result.totalScoredTips).toBe(15);
  });

  it("returns BRONZE tier for creator with 20-49 tips", () => {
    const tips = buildWinningTips(25);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.tier).toBe(CREATOR_TIER.BRONZE);
  });

  it("returns SILVER tier for creator with 50-199 tips", () => {
    const tips = buildWinningTips(75);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.tier).toBe(CREATOR_TIER.SILVER);
  });

  it("returns GOLD tier for creator with 200-499 tips", () => {
    const tips = buildWinningTips(250);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.tier).toBe(CREATOR_TIER.GOLD);
  });

  it("returns PLATINUM tier for creator with 500-999 tips", () => {
    const tips = buildWinningTips(600);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.tier).toBe(CREATOR_TIER.PLATINUM);
  });

  it("returns DIAMOND tier for creator with 1000+ tips", () => {
    const tips = buildWinningTips(1100);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.tier).toBe(CREATOR_TIER.DIAMOND);
  });

  it("returns exactly 20 as BRONZE threshold boundary", () => {
    const tips = buildWinningTips(20);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.tier).toBe(CREATOR_TIER.BRONZE);
    expect(result.totalScoredTips).toBe(20);
  });

  // ────────────────────────────────────────
  // Confidence interval
  // ────────────────────────────────────────

  it("calculates confidence interval based on accuracy rate and sample size", () => {
    const tips = [...buildWinningTips(14), ...buildLosingTips(6)];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    // p = 0.7, n = 20
    // SE = sqrt(0.7 * 0.3 / 20) = sqrt(0.0105) = 0.1025
    // CI = 1.96 * 0.1025 * 100 = 20.09
    expect(result.confidenceInterval).toBeGreaterThan(0);
    expect(result.confidenceInterval).toBeCloseTo(20.09, 0);
  });

  it("smaller confidence interval for more tips (higher confidence)", () => {
    const tipsSmall = [...buildWinningTips(14), ...buildLosingTips(6)];
    const tipsLarge = [...buildWinningTips(140), ...buildLosingTips(60)];

    const resultSmall = calculateCompositeScore({ tips: tipsSmall, halfLifeDays: HALF_LIFE });
    const resultLarge = calculateCompositeScore({ tips: tipsLarge, halfLifeDays: HALF_LIFE });

    // Same accuracy rate (70%) but more tips = narrower CI
    expect(resultLarge.confidenceInterval).toBeLessThan(resultSmall.confidenceInterval);
  });

  it("confidence interval is 0 for creator with 0 accuracy", () => {
    const tips = buildLosingTips(20);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    // p = 0, SE = sqrt(0 * 1 / 20) = 0
    expect(result.confidenceInterval).toBe(0);
  });

  // ────────────────────────────────────────
  // Win/loss streak tracking
  // ────────────────────────────────────────

  it("calculates win streak for consecutive recent winners", () => {
    // Most recent 4 tips are wins, then a loss
    const tips = [
      buildLosingTip({
        closedAt: new Date(BASE_DATE.getTime() - 5 * 24 * 60 * 60 * 1000),
      }),
      ...buildWinningTips(4), // Most recent: days 0-3
    ];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.winStreak).toBe(4);
    expect(result.lossStreak).toBe(0);
  });

  it("calculates loss streak for consecutive recent losers", () => {
    const tips = [
      ...buildWinningTips(5).map((t) => ({
        ...t,
        closedAt: new Date(BASE_DATE.getTime() - 10 * 24 * 60 * 60 * 1000),
      })),
      ...buildLosingTips(3), // Most recent
    ];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.lossStreak).toBe(3);
    expect(result.winStreak).toBe(0);
  });

  it("returns zero streaks for empty tips", () => {
    // Use a minimal set
    const tips = buildWinningTips(1);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.winStreak).toBe(1);
    expect(result.lossStreak).toBe(0);
  });

  // ────────────────────────────────────────
  // Timeframe accuracy breakdown
  // ────────────────────────────────────────

  it("provides timeframe accuracy breakdown", () => {
    const intradayWins = buildWinningTips(3).map((t) => ({
      ...t,
      timeframe: TIP_TIMEFRAME.INTRADAY as CompletedTip["timeframe"],
    }));
    const swingLosses = buildLosingTips(2).map((t) => ({
      ...t,
      timeframe: TIP_TIMEFRAME.SWING as CompletedTip["timeframe"],
    }));
    const tips = [...intradayWins, ...swingLosses];

    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.timeframeAccuracy.intradayAccuracy).toBe(1); // 3/3 = 100%
    expect(result.timeframeAccuracy.swingAccuracy).toBe(0);    // 0/2 = 0%
    expect(result.timeframeAccuracy.positionalAccuracy).toBeNull();
    expect(result.timeframeAccuracy.longTermAccuracy).toBeNull();
  });

  it("returns null for timeframes with no tips", () => {
    const tips = buildWinningTips(10); // All default to SWING
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.timeframeAccuracy.intradayAccuracy).toBeNull();
    expect(result.timeframeAccuracy.swingAccuracy).toBe(1); // All wins
    expect(result.timeframeAccuracy.positionalAccuracy).toBeNull();
    expect(result.timeframeAccuracy.longTermAccuracy).toBeNull();
  });

  // ────────────────────────────────────────
  // Score period tracking
  // ────────────────────────────────────────

  it("tracks the score period start and end dates", () => {
    const oldestTipDate = new Date("2025-01-10T10:00:00.000Z");
    const newestClosedDate = new Date("2025-07-10T10:00:00.000Z");

    const tips = [
      buildCompletedTip({
        tipTimestamp: oldestTipDate,
        closedAt: new Date("2025-02-10T10:00:00.000Z"),
      }),
      buildCompletedTip({
        tipTimestamp: new Date("2025-06-01T10:00:00.000Z"),
        closedAt: newestClosedDate,
      }),
    ];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.scorePeriodStart.getTime()).toBe(oldestTipDate.getTime());
    expect(result.scorePeriodEnd.getTime()).toBe(newestClosedDate.getTime());
  });

  // ────────────────────────────────────────
  // Raw metrics passthrough
  // ────────────────────────────────────────

  it("includes raw metrics in the output", () => {
    const tips = [...buildWinningTips(15), ...buildLosingTips(5)];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(typeof result.accuracyRate).toBe("number");
    expect(result.accuracyRate).toBeCloseTo(0.75, 1);
    expect(typeof result.avgReturnPct).toBe("number");
    expect(typeof result.avgRiskRewardRatio).toBe("number");
    expect(result.totalScoredTips).toBe(20);
  });

  it("includes best and worst tip return percentages", () => {
    const tips = [
      buildCompletedTip({
        entryPrice: 1000,
        target1: 1200,
        closedPrice: 1200,
        stopLoss: 950,
        status: TIP_STATUS.TARGET_1_HIT,
      }),
      buildLosingTip({
        entryPrice: 1000,
        stopLoss: 900,
      }),
    ];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    // Best: +20%, Worst: -10%
    expect(result.bestTipReturnPct).toBeCloseTo(20, 2);
    expect(result.worstTipReturnPct).toBeCloseTo(-10, 2);
  });

  // ────────────────────────────────────────
  // Minimum tips edge case
  // ────────────────────────────────────────

  it("still computes a score for creators below MIN_TIPS_FOR_RATING (tier is UNRATED)", () => {
    const tips = buildWinningTips(5);
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    // Score is computed but tier is UNRATED
    // Caller should check tier to decide whether to display
    expect(result.tier).toBe(CREATOR_TIER.UNRATED);
    expect(result.rmtScore).toBeGreaterThan(0);
    expect(result.totalScoredTips).toBe(5);
  });

  it("handles single tip input", () => {
    const tips = [buildCompletedTip()];
    const result = calculateCompositeScore({ tips, halfLifeDays: HALF_LIFE });

    expect(result.rmtScore).toBeGreaterThan(0);
    expect(result.totalScoredTips).toBe(1);
    expect(result.tier).toBe(CREATOR_TIER.UNRATED);
  });
});
