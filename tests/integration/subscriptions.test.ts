// tests/integration/subscriptions.test.ts
//
// Integration tests for GET /api/v1/subscriptions/current
// Tests subscription status retrieval with mocked dependencies.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/auth-helpers", () => ({
  requireUser: vi.fn(),
  isAuthError: vi.fn((r: unknown) => r instanceof NextResponse),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUniqueOrThrow: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
    },
  },
}));

import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { GET } from "@/app/api/v1/subscriptions/current/route";

// ──── Tests ────

describe("GET /api/v1/subscriptions/current", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns current subscription data for authenticated user", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
    });

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      subscriptionTier: "PRO",
    } as never);

    const mockSubscription = {
      tier: "PRO",
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-01-01"),
      currentPeriodEnd: new Date("2026-02-01"),
      cancelAtPeriodEnd: false,
      canceledAt: null,
    };
    vi.mocked(db.subscription.findFirst).mockResolvedValue(mockSubscription as never);

    vi.mocked(db.payment.findMany).mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.tier).toBe("PRO");
    expect(body.data.subscription.status).toBe("ACTIVE");
    expect(body.data.payments).toEqual([]);
  });

  it("returns subscription with payment history", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
    });

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      subscriptionTier: "PREMIUM",
    } as never);

    vi.mocked(db.subscription.findFirst).mockResolvedValue({
      tier: "PREMIUM",
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-01-15"),
      currentPeriodEnd: new Date("2026-02-15"),
      cancelAtPeriodEnd: false,
      canceledAt: null,
    } as never);

    const mockPayments = [
      {
        amount: 999,
        currency: "inr",
        status: "SUCCEEDED",
        description: "Premium subscription",
        createdAt: new Date("2026-01-15"),
      },
      {
        amount: 999,
        currency: "inr",
        status: "SUCCEEDED",
        description: "Premium subscription",
        createdAt: new Date("2025-12-15"),
      },
    ];
    vi.mocked(db.payment.findMany).mockResolvedValue(mockPayments as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.tier).toBe("PREMIUM");
    expect(body.data.payments).toHaveLength(2);
  });

  it("returns null subscription for FREE tier user", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user2",
      username: "freeuser",
    });

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      subscriptionTier: "FREE",
    } as never);

    vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(db.payment.findMany).mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.tier).toBe("FREE");
    expect(body.data.subscription).toBeNull();
    expect(body.data.payments).toEqual([]);
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireUser).mockResolvedValue(
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

  it("queries subscription with correct filters", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user3",
      username: "test3",
    });

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      subscriptionTier: "PRO",
    } as never);

    vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(db.payment.findMany).mockResolvedValue([]);

    await GET();

    // Verify the query was called with correct filters
    expect(db.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user3", status: { in: ["ACTIVE", "PAST_DUE"] } },
        orderBy: { createdAt: "desc" },
      })
    );

    // Verify payment query limits to 10 records
    expect(db.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user3" },
        take: 10,
      })
    );
  });
});
