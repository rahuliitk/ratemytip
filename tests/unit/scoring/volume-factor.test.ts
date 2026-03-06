// tests/unit/scoring/volume-factor.test.ts
//
// Unit tests for the Volume Factor Score Calculator.
// The volume factor score has 10% weight in the RMT Score composite.

import { describe, it, expect } from "vitest";
import { calculateVolumeFactor } from "@/lib/scoring/volume-factor";
import { SCORING } from "@/lib/constants";

describe("calculateVolumeFactor", () => {
  // ────────────────────────────────────────
  // Zero / negative input
  // ────────────────────────────────────────

  it("returns zero for 0 tips", () => {
    const result = calculateVolumeFactor({ totalScoredTips: 0 });

    expect(result.volumeFactor).toBe(0);
    expect(result.volumeFactorScore).toBe(0);
  });

  it("returns zero for negative tips", () => {
    const result = calculateVolumeFactor({ totalScoredTips: -5 });

    expect(result.volumeFactor).toBe(0);
    expect(result.volumeFactorScore).toBe(0);
  });

  // ────────────────────────────────────────
  // Single tip edge case
  // ────────────────────────────────────────

  it("returns 0 score for 1 tip (log10(1) = 0)", () => {
    const result = calculateVolumeFactor({ totalScoredTips: 1 });

    expect(result.volumeFactor).toBe(0);
    expect(result.volumeFactorScore).toBe(0);
  });

  // ────────────────────────────────────────
  // Known score mappings from spec
  // ────────────────────────────────────────

  it("returns ~39.4 for 20 tips", () => {
    const result = calculateVolumeFactor({ totalScoredTips: 20 });

    expect(result.volumeFactorScore).toBeCloseTo(39.4, 0);
  });

  it("returns ~51.5 for 50 tips", () => {
    const result = calculateVolumeFactor({ totalScoredTips: 50 });

    expect(result.volumeFactorScore).toBeCloseTo(51.5, 0);
  });

  it("returns ~60.6 for 100 tips", () => {
    const result = calculateVolumeFactor({ totalScoredTips: 100 });

    expect(result.volumeFactorScore).toBeCloseTo(60.6, 0);
  });

  it("returns ~81.8 for 500 tips", () => {
    const result = calculateVolumeFactor({ totalScoredTips: 500 });

    expect(result.volumeFactorScore).toBeCloseTo(81.8, 0);
  });

  it("returns ~90.9 for 1000 tips", () => {
    const result = calculateVolumeFactor({ totalScoredTips: 1000 });

    expect(result.volumeFactorScore).toBeCloseTo(90.9, 0);
  });

  it("returns 100 for MAX_EXPECTED_TIPS (2000)", () => {
    const result = calculateVolumeFactor({ totalScoredTips: SCORING.MAX_EXPECTED_TIPS });

    expect(result.volumeFactor).toBeCloseTo(1, 5);
    expect(result.volumeFactorScore).toBeCloseTo(100, 3);
  });

  // ────────────────────────────────────────
  // Clamping
  // ────────────────────────────────────────

  it("clamps score to 100 when tips exceed MAX_EXPECTED_TIPS", () => {
    const result = calculateVolumeFactor({ totalScoredTips: 5000 });

    expect(result.volumeFactorScore).toBe(100);
  });

  // ────────────────────────────────────────
  // Score properties
  // ────────────────────────────────────────

  it("score is always between 0 and 100", () => {
    for (const tips of [0, 1, 5, 10, 50, 100, 500, 1000, 2000, 5000]) {
      const result = calculateVolumeFactor({ totalScoredTips: tips });
      expect(result.volumeFactorScore).toBeGreaterThanOrEqual(0);
      expect(result.volumeFactorScore).toBeLessThanOrEqual(100);
    }
  });

  it("score increases monotonically with more tips", () => {
    let prevScore = -1;
    for (const tips of [1, 10, 20, 50, 100, 200, 500, 1000, 2000]) {
      const result = calculateVolumeFactor({ totalScoredTips: tips });
      expect(result.volumeFactorScore).toBeGreaterThanOrEqual(prevScore);
      prevScore = result.volumeFactorScore;
    }
  });
});
