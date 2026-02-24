// tests/unit/validators/direct-tip.test.ts

import { describe, it, expect } from "vitest";
import {
  createDirectTipSchema,
  updateDirectTipSchema,
} from "@/lib/validators/direct-tip";

describe("createDirectTipSchema", () => {
  const validBuyTip = {
    stockSymbol: "RELIANCE",
    direction: "BUY" as const,
    entryPrice: 2400,
    target1: 2600,
    stopLoss: 2300,
    timeframe: "SWING" as const,
  };

  const validSellTip = {
    stockSymbol: "INFY",
    direction: "SELL" as const,
    entryPrice: 1500,
    target1: 1400,
    stopLoss: 1600,
    timeframe: "INTRADAY" as const,
  };

  it("accepts a valid BUY tip", () => {
    const result = createDirectTipSchema.safeParse(validBuyTip);
    expect(result.success).toBe(true);
  });

  it("accepts a valid SELL tip", () => {
    const result = createDirectTipSchema.safeParse(validSellTip);
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      target2: 2700,
      target3: 2800,
      conviction: "HIGH",
      rationale: "Strong Q3 earnings expected",
      sourceUrl: "https://twitter.com/example/status/123",
    });
    expect(result.success).toBe(true);
  });

  it("defaults conviction to MEDIUM", () => {
    const result = createDirectTipSchema.safeParse(validBuyTip);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.conviction).toBe("MEDIUM");
    }
  });

  it("rejects BUY tip where target is below entry", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      target1: 2200, // below entry of 2400
    });
    expect(result.success).toBe(false);
  });

  it("rejects BUY tip where stop loss is above entry", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      stopLoss: 2500, // above entry of 2400
    });
    expect(result.success).toBe(false);
  });

  it("rejects SELL tip where target is above entry", () => {
    const result = createDirectTipSchema.safeParse({
      ...validSellTip,
      target1: 1600, // above entry of 1500
    });
    expect(result.success).toBe(false);
  });

  it("rejects SELL tip where stop loss is below entry", () => {
    const result = createDirectTipSchema.safeParse({
      ...validSellTip,
      stopLoss: 1400, // below entry of 1500
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = createDirectTipSchema.safeParse({
      stockSymbol: "RELIANCE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty stock symbol", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      stockSymbol: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative entry price", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      entryPrice: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero stop loss", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      stopLoss: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid timeframe", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      timeframe: "WEEKLY",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid direction", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      direction: "HOLD",
    });
    expect(result.success).toBe(false);
  });

  it("rejects rationale over 2000 characters", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      rationale: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source URL", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      sourceUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("allows null for optional targets", () => {
    const result = createDirectTipSchema.safeParse({
      ...validBuyTip,
      target2: null,
      target3: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateDirectTipSchema", () => {
  it("accepts partial updates (rationale only)", () => {
    const result = updateDirectTipSchema.safeParse({
      rationale: "Updated reasoning",
    });
    expect(result.success).toBe(true);
  });

  it("accepts conviction update", () => {
    const result = updateDirectTipSchema.safeParse({
      conviction: "HIGH",
    });
    expect(result.success).toBe(true);
  });

  it("accepts sourceUrl update", () => {
    const result = updateDirectTipSchema.safeParse({
      sourceUrl: "https://example.com/analysis",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null sourceUrl (removing it)", () => {
    const result = updateDirectTipSchema.safeParse({
      sourceUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no changes)", () => {
    const result = updateDirectTipSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid conviction value", () => {
    const result = updateDirectTipSchema.safeParse({
      conviction: "VERY_HIGH",
    });
    expect(result.success).toBe(false);
  });

  it("does not allow editing immutable fields like entryPrice", () => {
    // updateDirectTipSchema should not have entryPrice
    const result = updateDirectTipSchema.safeParse({
      entryPrice: 2500,
    });
    // The schema strips unknown fields, so it should succeed but ignore entryPrice
    expect(result.success).toBe(true);
    if (result.success) {
      expect("entryPrice" in result.data).toBe(false);
    }
  });
});
