// tests/integration/recommendations.test.ts
//
// Integration tests for GET /api/v1/recommendations
// Tests personalized tip recommendations gated by subscription tier.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/auth-helpers", () => ({
  requireSubscription: vi.fn(),
  isAuthError: vi.fn((r: unknown) => r instanceof NextResponse),
}));

vi.mock("@/lib/db", () => ({
  db: {
    tip: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/recommendations", () => ({
  computeTipRecommendations: vi.fn(),
}));

import { requireSubscription } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { computeTipRecommendations } from "@/lib/recommendations";
import { GET } from "@/app/api/v1/recommendations/route";

// ──── Tests ────

describe("GET /api/v1/recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 402 when user is on FREE tier", async () => {
    vi.mocked(requireSubscription).mockResolvedValue(
      NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYMENT_REQUIRED",
            message: "This feature requires a PRO subscription",
            requiredTier: "PRO",
          },
        },
        { status: 402 }
      )
    );

    const res = await GET();
    expect(res.status).toBe(402);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("PAYMENT_REQUIRED");
    expect(body.error.requiredTier).toBe("PRO");
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireSubscription).mockResolvedValue(
      NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      )
    );

    const res = await GET();
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns recommendations for PRO users", async () => {
    vi.mocked(requireSubscription).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "prouser",
      subscriptionTier: "PRO",
    });

    const mockRecommendations = [
      { tipId: "tip1", score: 0.92, reason: "Top-rated creator, Matches your preferences" },
      { tipId: "tip2", score: 0.85, reason: "Recent tip, Highly engaged" },
      { tipId: "tip3", score: 0.78, reason: "Good match" },
    ];
    vi.mocked(computeTipRecommendations).mockResolvedValue(mockRecommendations);

    const mockTips = [
      {
        id: "tip1",
        direction: "BUY",
        entryPrice: 1500,
        target1: 1600,
        stopLoss: 1450,
        status: "ACTIVE",
        timeframe: "SWING",
        tipTimestamp: new Date("2026-02-20"),
        stock: { symbol: "RELIANCE", name: "Reliance Industries", lastPrice: 1520 },
        creator: {
          slug: "finance-guru",
          displayName: "Finance Guru",
          currentScore: { rmtScore: 82.5 },
        },
      },
      {
        id: "tip2",
        direction: "BUY",
        entryPrice: 300,
        target1: 340,
        stopLoss: 280,
        status: "ACTIVE",
        timeframe: "POSITIONAL",
        tipTimestamp: new Date("2026-02-19"),
        stock: { symbol: "TCS", name: "TCS Ltd", lastPrice: 310 },
        creator: {
          slug: "market-master",
          displayName: "Market Master",
          currentScore: { rmtScore: 75.0 },
        },
      },
      {
        id: "tip3",
        direction: "SELL",
        entryPrice: 450,
        target1: 400,
        stopLoss: 475,
        status: "ACTIVE",
        timeframe: "INTRADAY",
        tipTimestamp: new Date("2026-02-18"),
        stock: { symbol: "INFY", name: "Infosys", lastPrice: 430 },
        creator: {
          slug: "day-trader",
          displayName: "Day Trader",
          currentScore: { rmtScore: 68.0 },
        },
      },
    ];
    vi.mocked(db.tip.findMany).mockResolvedValue(mockTips as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);

    // Verify recommendations have hydrated tip data
    expect(body.data[0].tipId).toBe("tip1");
    expect(body.data[0].score).toBe(0.92);
    expect(body.data[0].tip.stock.symbol).toBe("RELIANCE");
    expect(body.data[0].tip.creator.slug).toBe("finance-guru");
  });

  it("returns empty recommendations when no tips match", async () => {
    vi.mocked(requireSubscription).mockResolvedValue({
      session: {} as never,
      userId: "user2",
      username: "newpro",
      subscriptionTier: "PRO",
    });

    vi.mocked(computeTipRecommendations).mockResolvedValue([]);
    vi.mocked(db.tip.findMany).mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("calls requireSubscription with PRO minimum tier", async () => {
    vi.mocked(requireSubscription).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
      subscriptionTier: "PREMIUM",
    });

    vi.mocked(computeTipRecommendations).mockResolvedValue([]);
    vi.mocked(db.tip.findMany).mockResolvedValue([]);

    await GET();

    expect(requireSubscription).toHaveBeenCalledWith("PRO");
  });
});
