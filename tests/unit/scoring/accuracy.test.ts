// tests/unit/scoring/accuracy.test.ts
//
// Unit tests for the Accuracy Score Calculator.
// The accuracy score has 40% weight in the RMT Score composite.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateAccuracy, calculateFilteredAccuracy } from "@/lib/scoring/accuracy";
import { TIP_STATUS, TIP_TIMEFRAME, SCORING } from "@/lib/constants";
import {
  buildCompletedTip,
  buildLosingTip,
  buildExpiredTip,
  buildWinningTips,
  buildLosingTips,
  resetTipCounter,
  BASE_DATE,
} from "../../fixtures/scoring";

const HALF_LIFE = SCORING.RECENCY_DECAY_HALFLIFE_DAYS;

beforeEach(() => {
  resetTipCounter();
  // Pin "now" so recency weighting is deterministic
  vi.useFakeTimers();
  vi.setSystemTime(BASE_DATE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("calculateAccuracy", () => {
  it("returns zero values for an empty tip array", () => {
    const result = calculateAccuracy({ tips: [], halfLifeDays: HALF_LIFE });

    expect(result.accuracyRate).toBe(0);
    expect(result.weightedAccuracyRate).toBe(0);
    expect(result.accuracyScore).toBe(0);
    expect(result.totalCompleted).toBe(0);
    expect(result.totalHit).toBe(0);
  });

  it("calculates 100% accuracy when all tips hit target", () => {
    const tips = buildWinningTips(10);
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });

    expect(result.accuracyRate).toBe(1);
    expect(result.weightedAccuracyRate).toBeCloseTo(1, 5);
    expect(result.accuracyScore).toBeCloseTo(100, 3);
    expect(result.totalCompleted).toBe(10);
    expect(result.totalHit).toBe(10);
  });

  it("calculates 0% accuracy when no tips hit target", () => {
    const tips = buildLosingTips(10);
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });

    expect(result.accuracyRate).toBe(0);
    expect(result.weightedAccuracyRate).toBe(0);
    expect(result.accuracyScore).toBe(0);
    expect(result.totalCompleted).toBe(10);
    expect(result.totalHit).toBe(0);
  });

  it("handles mixed results correctly (7 hits out of 10)", () => {
    const wins = buildWinningTips(7);
    const losses = buildLosingTips(3);
    const tips = [...wins, ...losses];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });

    expect(result.accuracyRate).toBeCloseTo(0.7, 5);
    expect(result.totalCompleted).toBe(10);
    expect(result.totalHit).toBe(7);
    // Weighted rate should be close to raw when all tips are same age
    expect(result.weightedAccuracyRate).toBeCloseTo(0.7, 1);
  });

  it("applies recency weighting so recent tips are weighted more", () => {
    // Create scenario: old tips were losers, recent tips are winners
    const oldLosses = buildLosingTips(5).map((tip) => ({
      ...tip,
      closedAt: new Date(BASE_DATE.getTime() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
    }));
    const recentWins = buildWinningTips(5).map((tip) => ({
      ...tip,
      closedAt: new Date(BASE_DATE.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    }));
    const tips = [...oldLosses, ...recentWins];

    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });

    // Raw accuracy is 50% (5 hits out of 10)
    expect(result.accuracyRate).toBe(0.5);
    // Weighted accuracy should be higher because recent tips (winners) are weighted more
    expect(result.weightedAccuracyRate).toBeGreaterThan(0.5);
    expect(result.accuracyScore).toBeGreaterThan(50);
  });

  it("weights recent losers more heavily than old winners", () => {
    // Opposite scenario: old tips were winners, recent tips are losers
    const oldWins = buildWinningTips(5).map((tip) => ({
      ...tip,
      closedAt: new Date(BASE_DATE.getTime() - 180 * 24 * 60 * 60 * 1000),
    }));
    const recentLosses = buildLosingTips(5).map((tip) => ({
      ...tip,
      closedAt: new Date(BASE_DATE.getTime() - 1 * 24 * 60 * 60 * 1000),
    }));
    const tips = [...oldWins, ...recentLosses];

    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });

    // Raw accuracy is 50% (5 hits out of 10)
    expect(result.accuracyRate).toBe(0.5);
    // Weighted accuracy should be lower because recent tips (losers) are weighted more
    expect(result.weightedAccuracyRate).toBeLessThan(0.5);
    expect(result.accuracyScore).toBeLessThan(50);
  });

  it("counts TARGET_1_HIT as a hit", () => {
    const tips = [buildCompletedTip({ status: TIP_STATUS.TARGET_1_HIT })];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });
    expect(result.totalHit).toBe(1);
  });

  it("counts TARGET_2_HIT as a hit", () => {
    const tips = [buildCompletedTip({ status: TIP_STATUS.TARGET_2_HIT })];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });
    expect(result.totalHit).toBe(1);
  });

  it("counts TARGET_3_HIT as a hit", () => {
    const tips = [buildCompletedTip({ status: TIP_STATUS.TARGET_3_HIT })];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });
    expect(result.totalHit).toBe(1);
  });

  it("counts ALL_TARGETS_HIT as a hit", () => {
    const tips = [buildCompletedTip({ status: TIP_STATUS.ALL_TARGETS_HIT })];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });
    expect(result.totalHit).toBe(1);
  });

  it("counts STOPLOSS_HIT as a miss", () => {
    const tips = [buildLosingTip()];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });
    expect(result.totalHit).toBe(0);
    expect(result.accuracyRate).toBe(0);
  });

  it("counts EXPIRED tips as misses", () => {
    const tips = [buildExpiredTip()];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });
    expect(result.totalHit).toBe(0);
    expect(result.accuracyRate).toBe(0);
  });

  it("handles edge case of exactly MIN_TIPS_FOR_RATING (20) tips", () => {
    const wins = buildWinningTips(14);
    const losses = buildLosingTips(6);
    const tips = [...wins, ...losses];

    expect(tips.length).toBe(SCORING.MIN_TIPS_FOR_RATING);

    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });

    expect(result.accuracyRate).toBeCloseTo(0.7, 5);
    expect(result.totalCompleted).toBe(20);
    expect(result.totalHit).toBe(14);
  });

  it("handles a single winning tip", () => {
    const tips = [buildCompletedTip()];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });
    expect(result.accuracyRate).toBe(1);
    expect(result.totalCompleted).toBe(1);
  });

  it("handles a single losing tip", () => {
    const tips = [buildLosingTip()];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });
    expect(result.accuracyRate).toBe(0);
    expect(result.totalCompleted).toBe(1);
  });

  it("produces accuracy score between 0 and 100", () => {
    const tips = [...buildWinningTips(3), ...buildLosingTips(7)];
    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });

    expect(result.accuracyScore).toBeGreaterThanOrEqual(0);
    expect(result.accuracyScore).toBeLessThanOrEqual(100);
  });

  it("tip closed today has weight close to 1.0", () => {
    const tip = buildCompletedTip({
      closedAt: BASE_DATE, // today
    });
    const result = calculateAccuracy({ tips: [tip], halfLifeDays: HALF_LIFE });

    // A tip closed today should have nearly full weight
    // weightedAccuracy ~ rawAccuracy for same-day tips
    expect(result.weightedAccuracyRate).toBeCloseTo(result.accuracyRate, 3);
  });

  it("tip closed half-life days ago has approximately half weight", () => {
    // 5 wins today, 5 losses from exactly HALF_LIFE days ago
    const recentWins = buildWinningTips(5).map((t) => ({
      ...t,
      closedAt: BASE_DATE,
    }));
    const oldLosses = buildLosingTips(5).map((t) => ({
      ...t,
      closedAt: new Date(BASE_DATE.getTime() - HALF_LIFE * 24 * 60 * 60 * 1000),
    }));
    const tips = [...recentWins, ...oldLosses];

    const result = calculateAccuracy({ tips, halfLifeDays: HALF_LIFE });

    // Raw: 50%. Recent wins have weight ~1.0, old losses have weight ~0.5.
    // Weighted: 5*1.0 / (5*1.0 + 5*0.5) = 5/7.5 = 0.667
    expect(result.weightedAccuracyRate).toBeCloseTo(0.667, 1);
  });
});

describe("calculateFilteredAccuracy", () => {
  it("returns null when no tips match the predicate", () => {
    const tips = buildWinningTips(5);
    const result = calculateFilteredAccuracy(
      tips,
      (t) => t.timeframe === TIP_TIMEFRAME.INTRADAY,
    );
    // All tips default to SWING, so no INTRADAY tips
    expect(result).toBeNull();
  });

  it("calculates accuracy for only matching tips", () => {
    const intradayWins = buildWinningTips(3).map((t) => ({
      ...t,
      timeframe: TIP_TIMEFRAME.INTRADAY as CompletedTip["timeframe"],
    }));
    const swingLosses = buildLosingTips(7);
    const tips = [...intradayWins, ...swingLosses];

    const result = calculateFilteredAccuracy(
      tips,
      (t) => t.timeframe === TIP_TIMEFRAME.INTRADAY,
    );

    // Only intraday tips considered: 3 wins, 0 losses = 100%
    expect(result).toBe(1);
  });

  it("calculates partial accuracy for filtered subset", () => {
    const intradayWins = buildWinningTips(2).map((t) => ({
      ...t,
      timeframe: TIP_TIMEFRAME.INTRADAY as CompletedTip["timeframe"],
    }));
    const intradayLosses = buildLosingTips(3).map((t) => ({
      ...t,
      timeframe: TIP_TIMEFRAME.INTRADAY as CompletedTip["timeframe"],
    }));
    const tips = [...intradayWins, ...intradayLosses];

    const result = calculateFilteredAccuracy(
      tips,
      (t) => t.timeframe === TIP_TIMEFRAME.INTRADAY,
    );

    expect(result).toBeCloseTo(0.4, 5); // 2/5
  });

  it("returns null for empty input array", () => {
    const result = calculateFilteredAccuracy([], () => true);
    expect(result).toBeNull();
  });
});

// Need to import CompletedTip type for type assertion in map
import type { CompletedTip } from "@/lib/scoring/types";
