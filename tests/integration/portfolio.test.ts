// tests/integration/portfolio.test.ts
//
// Integration tests for POST /api/v1/portfolio/entries
// Tests adding tips to portfolio with tier limits, duplicates, and missing tips.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/auth-helpers", () => ({
  requireUser: vi.fn(),
  isAuthError: vi.fn((r: unknown) => r instanceof NextResponse),
}));

vi.mock("@/lib/db", () => ({
  db: {
    portfolio: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUniqueOrThrow: vi.fn(),
    },
    portfolioEntry: {
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    tip: {
      findUnique: vi.fn(),
    },
  },
}));

import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { POST } from "@/app/api/v1/portfolio/entries/route";

// ──── Helpers ────

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/v1/portfolio/entries", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// ──── Tests ────

describe("POST /api/v1/portfolio/entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
    });
  });

  it("successfully adds a tip to portfolio", async () => {
    vi.mocked(db.portfolio.findFirst).mockResolvedValue({
      id: "portfolio1",
      userId: "user1",
    } as never);

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      subscriptionTier: "PRO",
    } as never);

    vi.mocked(db.portfolioEntry.count).mockResolvedValue(3 as never);

    vi.mocked(db.tip.findUnique).mockResolvedValue({
      entryPrice: 1500.0,
      status: "ACTIVE",
    } as never);

    vi.mocked(db.portfolioEntry.findUnique).mockResolvedValue(null);

    const mockEntry = {
      id: "entry1",
      portfolioId: "portfolio1",
      tipId: "tip1",
      entryPrice: 1500.0,
      quantity: 10,
      notes: null,
    };
    vi.mocked(db.portfolioEntry.create).mockResolvedValue(mockEntry as never);

    const res = await POST(makeRequest({ tipId: "tip1", quantity: 10 }));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.tipId).toBe("tip1");
    expect(body.data.quantity).toBe(10);
  });

  it("creates portfolio if none exists", async () => {
    vi.mocked(db.portfolio.findFirst).mockResolvedValue(null);
    vi.mocked(db.portfolio.create).mockResolvedValue({
      id: "new-portfolio",
      userId: "user1",
    } as never);

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      subscriptionTier: "PRO",
    } as never);

    vi.mocked(db.portfolioEntry.count).mockResolvedValue(0 as never);

    vi.mocked(db.tip.findUnique).mockResolvedValue({
      entryPrice: 200.0,
      status: "ACTIVE",
    } as never);

    vi.mocked(db.portfolioEntry.findUnique).mockResolvedValue(null);

    vi.mocked(db.portfolioEntry.create).mockResolvedValue({
      id: "entry2",
      portfolioId: "new-portfolio",
      tipId: "tip2",
      entryPrice: 200.0,
      quantity: 1,
      notes: null,
    } as never);

    const res = await POST(makeRequest({ tipId: "tip2" }));
    expect(res.status).toBe(201);

    // Verify portfolio was created
    expect(db.portfolio.create).toHaveBeenCalledWith({
      data: { userId: "user1", name: "My Portfolio" },
    });
  });

  it("returns 402 when portfolio limit is reached for FREE tier", async () => {
    vi.mocked(db.portfolio.findFirst).mockResolvedValue({
      id: "portfolio1",
      userId: "user1",
    } as never);

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      subscriptionTier: "FREE",
    } as never);

    // FREE tier limit is 5
    vi.mocked(db.portfolioEntry.count).mockResolvedValue(5 as never);

    const res = await POST(makeRequest({ tipId: "tip1" }));
    expect(res.status).toBe(402);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("PORTFOLIO_LIMIT_REACHED");
    expect(body.error.message).toContain("FREE");
  });

  it("returns 404 when tip does not exist", async () => {
    vi.mocked(db.portfolio.findFirst).mockResolvedValue({
      id: "portfolio1",
      userId: "user1",
    } as never);

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      subscriptionTier: "PRO",
    } as never);

    vi.mocked(db.portfolioEntry.count).mockResolvedValue(0 as never);

    vi.mocked(db.tip.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest({ tipId: "nonexistent-tip" }));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("TIP_NOT_FOUND");
  });

  it("returns 409 when tip is already in portfolio", async () => {
    vi.mocked(db.portfolio.findFirst).mockResolvedValue({
      id: "portfolio1",
      userId: "user1",
    } as never);

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      subscriptionTier: "PRO",
    } as never);

    vi.mocked(db.portfolioEntry.count).mockResolvedValue(1 as never);

    vi.mocked(db.tip.findUnique).mockResolvedValue({
      entryPrice: 1500.0,
      status: "ACTIVE",
    } as never);

    vi.mocked(db.portfolioEntry.findUnique).mockResolvedValue({
      id: "existing-entry",
      portfolioId: "portfolio1",
      tipId: "tip1",
    } as never);

    const res = await POST(makeRequest({ tipId: "tip1" }));
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("DUPLICATE_ENTRY");
  });

  it("returns 400 for invalid request body", async () => {
    const res = await POST(makeRequest({ tipId: "" }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireUser).mockResolvedValue(
      NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      )
    );

    const res = await POST(makeRequest({ tipId: "tip1" }));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
