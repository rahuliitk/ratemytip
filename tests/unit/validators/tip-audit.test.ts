import { describe, it, expect } from "vitest";
import { createTipSchema } from "@/lib/validators/tip";

const validBuyTip = {
  creatorId: "clx1234567890abcdefghijkl",
  stockId: "clx1234567890abcdefghijkl",
  direction: "BUY" as const,
  assetClass: "EQUITY" as const,
  entryPrice: 1000,
  target1: 1100,
  stopLoss: 950,
  timeframe: "SWING" as const,
  tipTimestamp: "2025-07-15T10:00:00.000Z",
};

describe("createTipSchema — audit refinements", () => {
  it("rejects when entryPrice === stopLoss (zero risk)", () => {
    const result = createTipSchema.safeParse({
      ...validBuyTip,
      entryPrice: 1000,
      stopLoss: 1000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain(
        "Entry price and stop-loss must not be equal (zero risk)"
      );
    }
  });

  it("rejects BUY tip where stopLoss > entryPrice", () => {
    const result = createTipSchema.safeParse({
      ...validBuyTip,
      direction: "BUY",
      entryPrice: 1000,
      stopLoss: 1050,
      target1: 1100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects BUY tip where target1 < entryPrice", () => {
    const result = createTipSchema.safeParse({
      ...validBuyTip,
      direction: "BUY",
      entryPrice: 1000,
      target1: 900,
      stopLoss: 950,
    });
    expect(result.success).toBe(false);
  });

  it("rejects SELL tip where stopLoss < entryPrice", () => {
    const result = createTipSchema.safeParse({
      ...validBuyTip,
      direction: "SELL",
      entryPrice: 1000,
      target1: 900,
      stopLoss: 950,
    });
    expect(result.success).toBe(false);
  });

  it("rejects SELL tip where target1 > entryPrice", () => {
    const result = createTipSchema.safeParse({
      ...validBuyTip,
      direction: "SELL",
      entryPrice: 1000,
      target1: 1100,
      stopLoss: 1050,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid BUY tip (target > entry > stopLoss)", () => {
    const result = createTipSchema.safeParse(validBuyTip);
    expect(result.success).toBe(true);
  });

  it("accepts valid SELL tip (stopLoss > entry > target)", () => {
    const result = createTipSchema.safeParse({
      ...validBuyTip,
      direction: "SELL",
      entryPrice: 1000,
      target1: 900,
      stopLoss: 1050,
    });
    expect(result.success).toBe(true);
  });
});
