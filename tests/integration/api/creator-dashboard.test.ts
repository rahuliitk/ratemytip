// tests/integration/api/creator-dashboard.test.ts
//
// Integration tests for creator dashboard API endpoints:
//   GET  /api/v1/creator-dashboard/tips — List creator's tips
//   POST /api/v1/creator-dashboard/tips — Create a new tip

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    tip: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    stock: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth-helpers", () => ({
  requireCreator: vi.fn(),
  isAuthError: vi.fn((result: unknown) => result instanceof NextResponse),
}));

vi.mock("@/lib/utils/crypto", () => ({
  calculateTipContentHash: vi.fn().mockReturnValue("mock-hash-123"),
}));

import { db } from "@/lib/db";
import { requireCreator } from "@/lib/auth-helpers";
import { GET, POST } from "@/app/api/v1/creator-dashboard/tips/route";

// ──── Helpers ────

function mockCreatorAuth(): void {
  vi.mocked(requireCreator).mockResolvedValue({
    session: { user: { userId: "user-1", role: "CREATOR" } } as never,
    userId: "user-1",
    username: "testcreator",
    creatorId: "creator-1",
  });
}

function mockUnauthenticated(): void {
  vi.mocked(requireCreator).mockResolvedValue(
    NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    )
  );
}

// ──── Tests ────

describe("GET /api/v1/creator-dashboard/tips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatorAuth();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticated();
    const req = new NextRequest("http://localhost:3000/api/v1/creator-dashboard/tips");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns creator's tips with pagination", async () => {
    const mockTips = [
      {
        id: "tip-1",
        direction: "BUY",
        entryPrice: 2400,
        target1: 2500,
        target2: null,
        target3: null,
        stopLoss: 2350,
        status: "ACTIVE",
        timeframe: "SWING",
        conviction: "HIGH",
        rationale: "Strong breakout",
        tipTimestamp: new Date("2026-01-20"),
        returnPct: null,
        source: "DIRECT",
        stock: { symbol: "RELIANCE", name: "Reliance Industries" },
      },
    ];

    vi.mocked(db.tip.findMany).mockResolvedValue(mockTips as never);
    vi.mocked(db.tip.count).mockResolvedValue(1);

    const req = new NextRequest("http://localhost:3000/api/v1/creator-dashboard/tips");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].stockSymbol).toBe("RELIANCE");
    expect(body.data[0].direction).toBe("BUY");
    expect(body.meta.total).toBe(1);
  });

  it("filters by status when provided", async () => {
    vi.mocked(db.tip.findMany).mockResolvedValue([]);
    vi.mocked(db.tip.count).mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/v1/creator-dashboard/tips?status=ACTIVE");
    await GET(req);

    expect(db.tip.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          creatorId: "creator-1",
          status: "ACTIVE",
        }),
      })
    );
  });

  it("returns 500 on database error", async () => {
    vi.mocked(db.tip.findMany).mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost:3000/api/v1/creator-dashboard/tips");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe("POST /api/v1/creator-dashboard/tips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatorAuth();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticated();
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid tip data", async () => {
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({ stockSymbol: "RELIANCE" }), // Missing required fields
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when stock not found", async () => {
    vi.mocked(db.stock.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({
        stockSymbol: "NONEXISTENT",
        direction: "BUY",
        entryPrice: 100,
        target1: 110,
        stopLoss: 95,
        timeframe: "SWING",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("STOCK_NOT_FOUND");
  });

  it("creates a tip successfully", async () => {
    vi.mocked(db.stock.findUnique).mockResolvedValue({
      id: "stock-1",
      symbol: "RELIANCE",
      lastPrice: 2410,
    } as never);
    vi.mocked(db.tip.findUnique).mockResolvedValue(null); // No duplicate
    vi.mocked(db.tip.create).mockResolvedValue({
      id: "tip-new",
      status: "PENDING_REVIEW",
      createdAt: new Date("2026-01-20"),
    } as never);

    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({
        stockSymbol: "RELIANCE",
        direction: "BUY",
        entryPrice: 2400,
        target1: 2500,
        stopLoss: 2350,
        timeframe: "SWING",
        conviction: "HIGH",
        rationale: "Breakout expected",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("tip-new");
    expect(body.data.status).toBe("PENDING_REVIEW");

    // Verify tip was created with correct data
    expect(db.tip.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creatorId: "creator-1",
          stockId: "stock-1",
          direction: "BUY",
          entryPrice: 2400,
          target1: 2500,
          stopLoss: 2350,
          source: "DIRECT",
          status: "PENDING_REVIEW",
        }),
      })
    );
  });

  it("returns 409 for duplicate tip", async () => {
    vi.mocked(db.stock.findUnique).mockResolvedValue({
      id: "stock-1",
      symbol: "RELIANCE",
      lastPrice: 2410,
    } as never);
    vi.mocked(db.tip.findUnique).mockResolvedValue({ id: "existing-tip" } as never); // Duplicate exists

    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({
        stockSymbol: "RELIANCE",
        direction: "BUY",
        entryPrice: 2400,
        target1: 2500,
        stopLoss: 2350,
        timeframe: "SWING",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("DUPLICATE_TIP");
  });

  it("returns 400 when BUY tip has target below entry", async () => {
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({
        stockSymbol: "RELIANCE",
        direction: "BUY",
        entryPrice: 2400,
        target1: 2300, // Below entry — invalid for BUY
        stopLoss: 2350,
        timeframe: "SWING",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when BUY tip has stop loss above entry", async () => {
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({
        stockSymbol: "RELIANCE",
        direction: "BUY",
        entryPrice: 2400,
        target1: 2500,
        stopLoss: 2450, // Above entry — invalid for BUY
        timeframe: "SWING",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
