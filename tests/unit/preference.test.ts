// tests/unit/preference.test.ts

import { describe, it, expect } from "vitest";
import { userPreferenceSchema } from "@/lib/validators/preference";

describe("userPreferenceSchema", () => {
  it("validates valid preferences", () => {
    const result = userPreferenceSchema.safeParse({
      preferredTimeframes: ["INTRADAY", "SWING"],
      preferredAssetClasses: ["EQUITY", "INDEX"],
      riskTolerance: "HIGH",
      minCreatorScore: 70,
      preferredSectors: ["Technology", "Finance"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferredTimeframes).toEqual(["INTRADAY", "SWING"]);
      expect(result.data.riskTolerance).toBe("HIGH");
      expect(result.data.minCreatorScore).toBe(70);
    }
  });

  it("defaults riskTolerance to MODERATE", () => {
    const result = userPreferenceSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.riskTolerance).toBe("MODERATE");
    }
  });

  it("rejects invalid timeframes", () => {
    const result = userPreferenceSchema.safeParse({
      preferredTimeframes: ["WEEKLY"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid risk tolerance", () => {
    const result = userPreferenceSchema.safeParse({
      riskTolerance: "EXTREME",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty arrays for timeframes and asset classes", () => {
    const result = userPreferenceSchema.safeParse({
      preferredTimeframes: [],
      preferredAssetClasses: [],
      preferredSectors: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferredTimeframes).toEqual([]);
      expect(result.data.preferredAssetClasses).toEqual([]);
      expect(result.data.preferredSectors).toEqual([]);
    }
  });

  it("allows null minCreatorScore", () => {
    const result = userPreferenceSchema.safeParse({
      minCreatorScore: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minCreatorScore).toBeNull();
    }
  });

  it("defaults arrays to empty when not provided", () => {
    const result = userPreferenceSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferredTimeframes).toEqual([]);
      expect(result.data.preferredAssetClasses).toEqual([]);
      expect(result.data.preferredSectors).toEqual([]);
    }
  });

  it("rejects minCreatorScore below 0", () => {
    const result = userPreferenceSchema.safeParse({
      minCreatorScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects minCreatorScore above 100", () => {
    const result = userPreferenceSchema.safeParse({
      minCreatorScore: 101,
    });
    expect(result.success).toBe(false);
  });
});
