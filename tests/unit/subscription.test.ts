// tests/unit/subscription.test.ts

import { describe, it, expect } from "vitest";
import {
  checkoutSessionSchema,
  cancelSubscriptionSchema,
} from "@/lib/validators/subscription";
import { SUBSCRIPTION_FEATURES } from "@/lib/constants";

describe("checkoutSessionSchema", () => {
  it("validates PRO as a valid tier", () => {
    const result = checkoutSessionSchema.safeParse({ tier: "PRO" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tier).toBe("PRO");
    }
  });

  it("validates PREMIUM as a valid tier", () => {
    const result = checkoutSessionSchema.safeParse({ tier: "PREMIUM" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tier).toBe("PREMIUM");
    }
  });

  it("rejects invalid tier GOLD", () => {
    const result = checkoutSessionSchema.safeParse({ tier: "GOLD" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string tier", () => {
    const result = checkoutSessionSchema.safeParse({ tier: "" });
    expect(result.success).toBe(false);
  });
});

describe("cancelSubscriptionSchema", () => {
  it("validates optional reason string", () => {
    const result = cancelSubscriptionSchema.safeParse({
      reason: "Too expensive",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe("Too expensive");
    }
  });

  it("validates when reason is omitted", () => {
    const result = cancelSubscriptionSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBeUndefined();
    }
  });

  it("rejects reason over 500 characters", () => {
    const result = cancelSubscriptionSchema.safeParse({
      reason: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts reason at exactly 500 characters", () => {
    const result = cancelSubscriptionSchema.safeParse({
      reason: "x".repeat(500),
    });
    expect(result.success).toBe(true);
  });
});

describe("SUBSCRIPTION_FEATURES", () => {
  it("FREE tier has maxPortfolioEntries of 5", () => {
    expect(SUBSCRIPTION_FEATURES.FREE.maxPortfolioEntries).toBe(5);
  });

  it("PRO tier has maxPortfolioEntries of 50", () => {
    expect(SUBSCRIPTION_FEATURES.PRO.maxPortfolioEntries).toBe(50);
  });

  it("PREMIUM tier has maxPortfolioEntries of 500", () => {
    expect(SUBSCRIPTION_FEATURES.PREMIUM.maxPortfolioEntries).toBe(500);
  });

  it("FREE tier cannot view recommendations", () => {
    expect(SUBSCRIPTION_FEATURES.FREE.canViewRecommendations).toBe(false);
  });

  it("PRO tier can view recommendations", () => {
    expect(SUBSCRIPTION_FEATURES.PRO.canViewRecommendations).toBe(true);
  });
});
