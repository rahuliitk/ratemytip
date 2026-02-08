// tests/unit/scoring/consistency.test.ts
//
// Unit tests for the Consistency Score Calculator.
// The consistency score has 20% weight in the RMT Score composite.
//
// A consistency score measures how stable a creator's accuracy is over time.
// Lower variance = higher consistency = higher score.

import { describe, it, expect, beforeEach } from "vitest";
import { calculateConsistency } from "@/lib/scoring/consistency";
import { TIP_STATUS } from "@/lib/constants";
import {
  buildCompletedTip,
  buildLosingTip,
  buildMonthlyTips,
  resetTipCounter,
} from "../../fixtures/scoring";

beforeEach(() => {
  resetTipCounter();
});

describe("calculateConsistency", () => {
  // ────────────────────────────────────────
  // Empty input
  // ────────────────────────────────────────

  it("returns zero values for an empty tip array", () => {
    const result = calculateConsistency({ tips: [] });

    expect(result.consistencyScore).toBe(0);
    expect(result.coefficientOfVariation).toBe(0);
    expect(result.monthsWithData).toBe(0);
    expect(result.monthlyBreakdown).toHaveLength(0);
  });

  // ────────────────────────────────────────
  // Insufficient data (< 3 months)
  // ────────────────────────────────────────

  it("returns neutral score of 50 when less than 3 months of data", () => {
    // Only 1 month of data
    const tips = buildMonthlyTips([
      { year: 2025, month: 5, wins: 5, losses: 2 },
    ]);
    const result = calculateConsistency({ tips });

    expect(result.consistencyScore).toBe(50);
    expect(result.monthsWithData).toBe(1);
  });

  it("returns neutral score of 50 when exactly 2 months of data", () => {
    const tips = buildMonthlyTips([
      { year: 2025, month: 4, wins: 5, losses: 2 },
      { year: 2025, month: 5, wins: 4, losses: 3 },
    ]);
    const result = calculateConsistency({ tips });

    expect(result.consistencyScore).toBe(50);
    expect(result.monthsWithData).toBe(2);
  });

  // ────────────────────────────────────────
  // Perfect consistency (CV = 0)
  // ────────────────────────────────────────

  it("returns score of 100 for perfectly consistent creator (same accuracy each month)", () => {
    // Each month: exactly 7 wins, 3 losses = 70% accuracy
    const tips = buildMonthlyTips([
      { year: 2025, month: 1, wins: 7, losses: 3 },
      { year: 2025, month: 2, wins: 7, losses: 3 },
      { year: 2025, month: 3, wins: 7, losses: 3 },
      { year: 2025, month: 4, wins: 7, losses: 3 },
    ]);
    const result = calculateConsistency({ tips });

    // CV = 0 because all monthly rates are identical
    expect(result.coefficientOfVariation).toBeCloseTo(0, 5);
    expect(result.consistencyScore).toBeCloseTo(100, 3);
    expect(result.monthsWithData).toBe(4);
  });

  // ────────────────────────────────────────
  // High inconsistency
  // ────────────────────────────────────────

  it("returns low score for very inconsistent creator", () => {
    // Wildly varying accuracy: 100%, 0%, 100%, 0%
    const tips = buildMonthlyTips([
      { year: 2025, month: 1, wins: 10, losses: 0 },  // 100%
      { year: 2025, month: 2, wins: 0, losses: 10 },   // 0%
      { year: 2025, month: 3, wins: 10, losses: 0 },  // 100%
      { year: 2025, month: 4, wins: 0, losses: 10 },   // 0%
    ]);
    const result = calculateConsistency({ tips });

    // CV = stddev / mean = large value
    expect(result.coefficientOfVariation).toBeGreaterThan(0.5);
    expect(result.consistencyScore).toBeLessThan(50);
  });

  it("returns score of 0 when CV exceeds 1", () => {
    // Extreme variance: one great month, rest terrible
    const tips = buildMonthlyTips([
      { year: 2025, month: 1, wins: 10, losses: 0 },  // 100%
      { year: 2025, month: 2, wins: 0, losses: 10 },   // 0%
      { year: 2025, month: 3, wins: 0, losses: 10 },   // 0%
      { year: 2025, month: 4, wins: 0, losses: 10 },   // 0%
    ]);
    const result = calculateConsistency({ tips });

    // Mean = 25%, stddev will be high relative to mean
    // CV = stddev / mean > 1
    expect(result.coefficientOfVariation).toBeGreaterThanOrEqual(1);
    expect(result.consistencyScore).toBe(0);
  });

  // ────────────────────────────────────────
  // Mean accuracy of 0
  // ────────────────────────────────────────

  it("returns score of 0 when mean accuracy is 0 (consistently wrong)", () => {
    // All months: 0% accuracy
    const tips = buildMonthlyTips([
      { year: 2025, month: 1, wins: 0, losses: 5 },
      { year: 2025, month: 2, wins: 0, losses: 5 },
      { year: 2025, month: 3, wins: 0, losses: 5 },
      { year: 2025, month: 4, wins: 0, losses: 5 },
    ]);
    const result = calculateConsistency({ tips });

    expect(result.consistencyScore).toBe(0);
    expect(result.monthsWithData).toBe(4);
  });

  // ────────────────────────────────────────
  // Moderate consistency
  // ────────────────────────────────────────

  it("returns moderate score for moderately consistent creator", () => {
    // Accuracy varies between 60% and 80%
    const tips = buildMonthlyTips([
      { year: 2025, month: 1, wins: 6, losses: 4 },  // 60%
      { year: 2025, month: 2, wins: 7, losses: 3 },  // 70%
      { year: 2025, month: 3, wins: 8, losses: 2 },  // 80%
      { year: 2025, month: 4, wins: 7, losses: 3 },  // 70%
    ]);
    const result = calculateConsistency({ tips });

    // Mean = 70%, stddev is modest
    expect(result.consistencyScore).toBeGreaterThan(50);
    expect(result.consistencyScore).toBeLessThan(100);
    expect(result.monthsWithData).toBe(4);
  });

  // ────────────────────────────────────────
  // Monthly breakdown
  // ────────────────────────────────────────

  it("groups tips by month correctly", () => {
    const tips = buildMonthlyTips([
      { year: 2025, month: 1, wins: 5, losses: 5 },
      { year: 2025, month: 2, wins: 8, losses: 2 },
      { year: 2025, month: 3, wins: 3, losses: 7 },
    ]);
    const result = calculateConsistency({ tips });

    expect(result.monthlyBreakdown).toHaveLength(3);

    // Verify each month
    const jan = result.monthlyBreakdown.find((m) => m.month === "2025-01");
    const feb = result.monthlyBreakdown.find((m) => m.month === "2025-02");
    const mar = result.monthlyBreakdown.find((m) => m.month === "2025-03");

    expect(jan).toBeDefined();
    expect(jan!.accuracyRate).toBeCloseTo(0.5, 5);  // 5/10
    expect(jan!.tipCount).toBe(10);

    expect(feb).toBeDefined();
    expect(feb!.accuracyRate).toBeCloseTo(0.8, 5);  // 8/10
    expect(feb!.tipCount).toBe(10);

    expect(mar).toBeDefined();
    expect(mar!.accuracyRate).toBeCloseTo(0.3, 5);  // 3/10
    expect(mar!.tipCount).toBe(10);
  });

  it("sorts monthly breakdown oldest first", () => {
    const tips = buildMonthlyTips([
      { year: 2025, month: 6, wins: 5, losses: 5 },
      { year: 2025, month: 3, wins: 5, losses: 5 },
      { year: 2025, month: 9, wins: 5, losses: 5 },
    ]);
    const result = calculateConsistency({ tips });

    const months = result.monthlyBreakdown.map((m) => m.month);
    expect(months).toEqual(["2025-03", "2025-06", "2025-09"]);
  });

  // ────────────────────────────────────────
  // Edge cases
  // ────────────────────────────────────────

  it("handles exactly 3 months of data (minimum for non-neutral score)", () => {
    const tips = buildMonthlyTips([
      { year: 2025, month: 1, wins: 5, losses: 5 },
      { year: 2025, month: 2, wins: 5, losses: 5 },
      { year: 2025, month: 3, wins: 5, losses: 5 },
    ]);
    const result = calculateConsistency({ tips });

    // Should NOT return neutral 50; should compute actual score
    expect(result.monthsWithData).toBe(3);
    // Perfect consistency: 50% each month, CV = 0
    expect(result.consistencyScore).toBeCloseTo(100, 3);
  });

  it("consistency score is always between 0 and 100", () => {
    const tips = buildMonthlyTips([
      { year: 2025, month: 1, wins: 9, losses: 1 },
      { year: 2025, month: 2, wins: 2, losses: 8 },
      { year: 2025, month: 3, wins: 6, losses: 4 },
      { year: 2025, month: 4, wins: 4, losses: 6 },
    ]);
    const result = calculateConsistency({ tips });

    expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(result.consistencyScore).toBeLessThanOrEqual(100);
  });

  it("counts all target hit statuses as hits within monthly grouping", () => {
    // Mix of target hit statuses should all count
    const tips = [
      buildCompletedTip({
        status: TIP_STATUS.TARGET_1_HIT,
        closedAt: new Date("2025-03-10T12:00:00.000Z"),
        tipTimestamp: new Date("2025-03-03T12:00:00.000Z"),
      }),
      buildCompletedTip({
        status: TIP_STATUS.TARGET_2_HIT,
        closedAt: new Date("2025-03-12T12:00:00.000Z"),
        tipTimestamp: new Date("2025-03-05T12:00:00.000Z"),
      }),
      buildCompletedTip({
        status: TIP_STATUS.ALL_TARGETS_HIT,
        closedAt: new Date("2025-03-14T12:00:00.000Z"),
        tipTimestamp: new Date("2025-03-07T12:00:00.000Z"),
      }),
      buildLosingTip({
        closedAt: new Date("2025-03-16T12:00:00.000Z"),
        tipTimestamp: new Date("2025-03-09T12:00:00.000Z"),
      }),
      // Also need 2 more months for non-neutral result
      ...buildMonthlyTips([
        { year: 2025, month: 4, wins: 5, losses: 5 },
        { year: 2025, month: 5, wins: 5, losses: 5 },
      ]),
    ];
    const result = calculateConsistency({ tips });

    const march = result.monthlyBreakdown.find((m) => m.month === "2025-03");
    expect(march).toBeDefined();
    expect(march!.tipCount).toBe(4);
    expect(march!.accuracyRate).toBeCloseTo(0.75, 5); // 3 hits out of 4
  });
});
