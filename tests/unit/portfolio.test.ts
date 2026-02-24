// tests/unit/portfolio.test.ts

import { describe, it, expect } from "vitest";
import {
  addPortfolioEntrySchema,
  closePortfolioEntrySchema,
} from "@/lib/validators/portfolio";

describe("addPortfolioEntrySchema", () => {
  it("requires tipId", () => {
    const result = addPortfolioEntrySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts valid tipId with default quantity", () => {
    const result = addPortfolioEntrySchema.safeParse({
      tipId: "clx1234abcdef",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tipId).toBe("clx1234abcdef");
      expect(result.data.quantity).toBe(1);
    }
  });

  it("defaults quantity to 1 when not provided", () => {
    const result = addPortfolioEntrySchema.safeParse({
      tipId: "some-tip-id",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it("rejects negative quantity", () => {
    const result = addPortfolioEntrySchema.safeParse({
      tipId: "some-tip-id",
      quantity: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = addPortfolioEntrySchema.safeParse({
      tipId: "some-tip-id",
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts positive quantity", () => {
    const result = addPortfolioEntrySchema.safeParse({
      tipId: "some-tip-id",
      quantity: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(10);
    }
  });

  it("rejects empty tipId", () => {
    const result = addPortfolioEntrySchema.safeParse({
      tipId: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("closePortfolioEntrySchema", () => {
  it("requires positive closedPrice", () => {
    const result = closePortfolioEntrySchema.safeParse({
      closedPrice: 150.50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.closedPrice).toBe(150.50);
    }
  });

  it("rejects zero closedPrice", () => {
    const result = closePortfolioEntrySchema.safeParse({
      closedPrice: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative closedPrice", () => {
    const result = closePortfolioEntrySchema.safeParse({
      closedPrice: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing closedPrice", () => {
    const result = closePortfolioEntrySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
