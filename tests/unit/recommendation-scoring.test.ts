// tests/unit/recommendation-scoring.test.ts

import { describe, it, expect } from "vitest";
import { RECOMMENDATION } from "@/lib/constants";

describe("RECOMMENDATION constants", () => {
  it("TIP_WEIGHTS sum to 1.0", () => {
    const weights = RECOMMENDATION.TIP_WEIGHTS;
    const sum =
      weights.CREATOR_SCORE +
      weights.PREFERENCE_MATCH +
      weights.RECENCY +
      weights.ENGAGEMENT;
    expect(sum).toBeCloseTo(1.0);
  });

  it("CREATOR_WEIGHTS sum to 1.0", () => {
    const weights = RECOMMENDATION.CREATOR_WEIGHTS;
    const sum =
      weights.RMT_SCORE +
      weights.SPECIALIZATION_MATCH +
      weights.ACTIVITY_RECENCY +
      weights.COMMUNITY_REVIEW;
    expect(sum).toBeCloseTo(1.0);
  });

  it("MAX_TIPS is 20", () => {
    expect(RECOMMENDATION.MAX_TIPS).toBe(20);
  });

  it("MAX_CREATORS is 10", () => {
    expect(RECOMMENDATION.MAX_CREATORS).toBe(10);
  });

  it("RECENCY_HALFLIFE_DAYS is 7", () => {
    expect(RECOMMENDATION.RECENCY_HALFLIFE_DAYS).toBe(7);
  });

  it("all TIP_WEIGHTS are between 0 and 1", () => {
    for (const value of Object.values(RECOMMENDATION.TIP_WEIGHTS)) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("all CREATOR_WEIGHTS are between 0 and 1", () => {
    for (const value of Object.values(RECOMMENDATION.CREATOR_WEIGHTS)) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
