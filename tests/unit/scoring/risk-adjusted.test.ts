// tests/unit/scoring/risk-adjusted.test.ts
//
// Unit tests for the Risk-Adjusted Return Score Calculator.
// The risk-adjusted return score has 30% weight in the RMT Score composite.

import { describe, it, expect, beforeEach } from "vitest";
import { calculateRiskAdjustedReturn } from "@/lib/scoring/risk-adjusted";
import { TIP_STATUS } from "@/lib/constants";
import {
  buildCompletedTip,
  buildLosingTip,
  buildExpiredTip,
  buildSellTip,
  buildMultiTargetTip,
  resetTipCounter,
  BASE_DATE,
} from "../../fixtures/scoring";

beforeEach(() => {
  resetTipCounter();
});

describe("calculateRiskAdjustedReturn", () => {
  // ────────────────────────────────────────
  // Empty input
  // ────────────────────────────────────────

  it("returns zero values for an empty tip array", () => {
    const result = calculateRiskAdjustedReturn({ tips: [] });

    expect(result.avgReturnPct).toBe(0);
    expect(result.avgRiskRewardRatio).toBe(0);
    expect(result.riskAdjustedScore).toBe(0);
    expect(result.bestTipReturnPct).toBeNull();
    expect(result.worstTipReturnPct).toBeNull();
    expect(result.tipDetails).toHaveLength(0);
  });

  // ────────────────────────────────────────
  // BUY direction tips
  // ────────────────────────────────────────

  it("calculates positive return for a BUY tip that hit target", () => {
    // Entry: 1000, Target1: 1100, SL: 950, ClosedPrice: 1100
    const tip = buildCompletedTip({
      entryPrice: 1000,
      target1: 1100,
      stopLoss: 950,
      closedPrice: 1100,
      status: TIP_STATUS.TARGET_1_HIT,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Return: (1100 - 1000) / 1000 * 100 = 10%
    expect(result.avgReturnPct).toBeCloseTo(10, 2);
    // Risk: (1000 - 950) / 1000 * 100 = 5%
    // R:R = 10 / 5 = 2
    expect(result.avgRiskRewardRatio).toBeCloseTo(2, 2);
    expect(result.bestTipReturnPct).toBeCloseTo(10, 2);
    expect(result.tipDetails).toHaveLength(1);
  });

  it("calculates negative return for a BUY tip that hit stop-loss", () => {
    // Entry: 1000, SL: 950
    const tip = buildLosingTip({
      entryPrice: 1000,
      stopLoss: 950,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Return: -(1000 - 950) / 1000 * 100 = -5%
    expect(result.avgReturnPct).toBeCloseTo(-5, 2);
    // Risk-reward for stoploss hit is always -1
    expect(result.avgRiskRewardRatio).toBe(-1);
    expect(result.worstTipReturnPct).toBeCloseTo(-5, 2);
  });

  it("calculates return for an expired BUY tip based on closed price", () => {
    // Entry: 1000, ClosedPrice: 1020 (small gain, but did not hit target)
    const tip = buildExpiredTip({
      entryPrice: 1000,
      closedPrice: 1020,
      stopLoss: 950,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Return: (1020 - 1000) / 1000 * 100 = 2%
    expect(result.avgReturnPct).toBeCloseTo(2, 2);
    // Risk: 5%, R:R = 2 / 5 = 0.4
    expect(result.avgRiskRewardRatio).toBeCloseTo(0.4, 2);
  });

  // ────────────────────────────────────────
  // SELL direction tips
  // ────────────────────────────────────────

  it("calculates positive return for a SELL tip that hit target", () => {
    // Entry: 1000, Target1: 900, SL: 1050, ClosedPrice: 900
    const tip = buildSellTip({
      entryPrice: 1000,
      target1: 900,
      stopLoss: 1050,
      closedPrice: 900,
      status: TIP_STATUS.TARGET_1_HIT,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Return (SELL): (1000 - 900) / 1000 * 100 = 10%
    expect(result.avgReturnPct).toBeCloseTo(10, 2);
    // Risk (SELL): (1050 - 1000) / 1000 * 100 = 5%
    // R:R = 10 / 5 = 2
    expect(result.avgRiskRewardRatio).toBeCloseTo(2, 2);
  });

  it("calculates negative return for a SELL tip that hit stop-loss", () => {
    const tip = buildSellTip({
      entryPrice: 1000,
      stopLoss: 1050,
      status: TIP_STATUS.STOPLOSS_HIT,
      closedPrice: 1050,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Return (SELL SL): -(1050 - 1000) / 1000 * 100 = -5%
    expect(result.avgReturnPct).toBeCloseTo(-5, 2);
    expect(result.avgRiskRewardRatio).toBe(-1);
  });

  // ────────────────────────────────────────
  // Multi-target tips
  // ────────────────────────────────────────

  it("calculates return for a tip with only target 1 hit (2 targets defined)", () => {
    const tip = buildMultiTargetTip({
      entryPrice: 1000,
      target1: 1100,
      target2: 1200,
      target3: null,
      stopLoss: 950,
      status: TIP_STATUS.TARGET_1_HIT,
      closedPrice: 1100,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Only target 1 hit: return = (1100-1000)/1000*100 = 10%
    expect(result.avgReturnPct).toBeCloseTo(10, 2);
  });

  it("calculates weighted return for a tip with target 2 hit (2 targets defined)", () => {
    const tip = buildMultiTargetTip({
      entryPrice: 1000,
      target1: 1100,
      target2: 1200,
      target3: null,
      stopLoss: 950,
      status: TIP_STATUS.TARGET_2_HIT,
      closedPrice: 1200,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Weighted: 0.5 * 10% + 0.5 * 20% = 15%
    expect(result.avgReturnPct).toBeCloseTo(15, 2);
  });

  it("calculates weighted return for all 3 targets hit", () => {
    const tip = buildMultiTargetTip({
      entryPrice: 1000,
      target1: 1100,
      target2: 1200,
      target3: 1300,
      stopLoss: 950,
      status: TIP_STATUS.ALL_TARGETS_HIT,
      closedPrice: 1300,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Weighted: 0.33 * 10% + 0.33 * 20% + 0.34 * 30% = 3.3 + 6.6 + 10.2 = 20.1%
    expect(result.avgReturnPct).toBeCloseTo(20.1, 1);
  });

  it("calculates target 1 return for 3-target tip with only T1 hit", () => {
    const tip = buildMultiTargetTip({
      entryPrice: 1000,
      target1: 1100,
      target2: 1200,
      target3: 1300,
      stopLoss: 950,
      status: TIP_STATUS.TARGET_1_HIT,
      closedPrice: 1100,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Only T1: return = 10%
    expect(result.avgReturnPct).toBeCloseTo(10, 2);
  });

  it("calculates T1+T2 weighted return for 3-target tip with T2 hit", () => {
    const tip = buildMultiTargetTip({
      entryPrice: 1000,
      target1: 1100,
      target2: 1200,
      target3: 1300,
      stopLoss: 950,
      status: TIP_STATUS.TARGET_2_HIT,
      closedPrice: 1200,
    });
    const result = calculateRiskAdjustedReturn({ tips: [tip] });

    // Weighted: 0.5 * 10% + 0.5 * 20% = 15%
    expect(result.avgReturnPct).toBeCloseTo(15, 2);
  });

  // ────────────────────────────────────────
  // Score normalization
  // ────────────────────────────────────────

  it("normalizes score to 0-100 range", () => {
    const tips = buildWinningTips(5);
    const result = calculateRiskAdjustedReturn({ tips });

    expect(result.riskAdjustedScore).toBeGreaterThanOrEqual(0);
    expect(result.riskAdjustedScore).toBeLessThanOrEqual(100);
  });

  it("produces score of 0 when avg risk-reward equals RISK_ADJUSTED_FLOOR (-2)", () => {
    // Need tips with very negative risk-reward ratios.
    // Stoploss tips have R:R = -1, so we need additional very bad expired tips.
    const badTips = Array.from({ length: 5 }, (_, i) =>
      buildExpiredTip({
        entryPrice: 1000,
        closedPrice: 800, // -20% loss
        stopLoss: 950,    // risk = 5%
        // R:R = -20/5 = -4
        closedAt: new Date(BASE_DATE.getTime() - i * 24 * 60 * 60 * 1000),
      }),
    );
    const result = calculateRiskAdjustedReturn({ tips: badTips });

    // avg R:R should be very negative, score should be 0
    expect(result.riskAdjustedScore).toBe(0);
  });

  it("produces score near 100 for very high risk-reward ratio", () => {
    // Entry: 1000, Target1: 1500 (50% gain), SL: 990 (1% risk)
    // R:R = 50/1 = 50 (way above ceiling of 5)
    const tips = Array.from({ length: 5 }, (_, i) =>
      buildCompletedTip({
        entryPrice: 1000,
        target1: 1500,
        stopLoss: 990,
        closedPrice: 1500,
        status: TIP_STATUS.TARGET_1_HIT,
        closedAt: new Date(BASE_DATE.getTime() - i * 24 * 60 * 60 * 1000),
      }),
    );
    const result = calculateRiskAdjustedReturn({ tips });

    expect(result.riskAdjustedScore).toBe(100);
  });

  it("maps avg_rr of 0 to approximately score 28.6", () => {
    // R:R = 0 means (0 - (-2)) / 7 * 100 = 28.57
    // Need expired tips with 0 return
    const tips = Array.from({ length: 5 }, (_, i) =>
      buildExpiredTip({
        entryPrice: 1000,
        closedPrice: 1000, // 0% return
        stopLoss: 950,
        closedAt: new Date(BASE_DATE.getTime() - i * 24 * 60 * 60 * 1000),
      }),
    );
    const result = calculateRiskAdjustedReturn({ tips });

    expect(result.avgRiskRewardRatio).toBeCloseTo(0, 2);
    expect(result.riskAdjustedScore).toBeCloseTo(28.57, 0);
  });

  // ────────────────────────────────────────
  // Best/worst tracking
  // ────────────────────────────────────────

  it("correctly identifies the best and worst tip returns", () => {
    const tips = [
      buildCompletedTip({
        entryPrice: 1000,
        target1: 1100,
        closedPrice: 1100,
        stopLoss: 950,
        status: TIP_STATUS.TARGET_1_HIT,
      }),
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
    const result = calculateRiskAdjustedReturn({ tips });

    // Best: (1200-1000)/1000*100 = 20%
    expect(result.bestTipReturnPct).toBeCloseTo(20, 2);
    // Worst: -(1000-900)/1000*100 = -10%
    expect(result.worstTipReturnPct).toBeCloseTo(-10, 2);
  });

  // ────────────────────────────────────────
  // Averaging across multiple tips
  // ────────────────────────────────────────

  it("averages returns across all tips", () => {
    // Tip 1: +10% return, Tip 2: -5% return
    const tips = [
      buildCompletedTip({
        entryPrice: 1000,
        target1: 1100,
        closedPrice: 1100,
        stopLoss: 950,
        status: TIP_STATUS.TARGET_1_HIT,
      }),
      buildLosingTip({
        entryPrice: 1000,
        stopLoss: 950,
      }),
    ];
    const result = calculateRiskAdjustedReturn({ tips });

    // Avg return: (10 + (-5)) / 2 = 2.5%
    expect(result.avgReturnPct).toBeCloseTo(2.5, 2);
  });

  it("returns per-tip details array", () => {
    const tips = buildWinningTips(3);
    const result = calculateRiskAdjustedReturn({ tips });

    expect(result.tipDetails).toHaveLength(3);
    for (const detail of result.tipDetails) {
      expect(detail.tipId).toBeDefined();
      expect(typeof detail.returnPct).toBe("number");
      expect(typeof detail.riskPct).toBe("number");
      expect(typeof detail.riskRewardRatio).toBe("number");
    }
  });
});
