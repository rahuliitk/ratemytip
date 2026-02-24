// tests/integration/api/creator-dashboard-extended.test.ts
//
// Integration tests for creator dashboard API endpoints:
//   GET  /api/v1/creator-dashboard          (dashboard stats)
//   GET  /api/v1/creator-dashboard/tips     (list tips)
//   POST /api/v1/creator-dashboard/tips     (create tip)
//   GET  /api/v1/creator-dashboard/analytics (performance metrics)
//   GET  /api/v1/creator-dashboard/profile  (get profile)
//   PATCH /api/v1/creator-dashboard/profile (update profile)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    creator: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tip: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    stock: {
      findUnique: vi.fn(),
    },
    scoreSnapshot: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth-helpers", () => ({
  requireCreator: vi.fn(),
  isAuthError: vi.fn((result: unknown) => result instanceof NextResponse),
}));

vi.mock("@/lib/utils/crypto", () => ({
  calculateTipContentHash: vi.fn().mockReturnValue("test-hash-123"),
}));

import { db } from "@/lib/db";
import { requireCreator } from "@/lib/auth-helpers";

// ──── Helpers ────

function mockCreatorAuth(creatorId = "creator-1", userId = "user-1"): void {
  vi.mocked(requireCreator).mockResolvedValue({
    session: { user: { userId, userType: "creator" } } as never,
    userId,
    username: "testcreator",
    creatorId,
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

// ──── Tests: Dashboard Stats ────

describe("GET /api/v1/creator-dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns dashboard stats for authenticated creator", async () => {
    mockCreatorAuth();
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      id: "creator-1",
      totalTips: 50,
      activeTips: 5,
      completedTips: 40,
      tier: "SILVER",
      currentScore: { accuracyRate: 0.72, rmtScore: 68.5 },
    } as never);
    vi.mocked(db.tip.count).mockResolvedValue(3);
    vi.mocked(db.scoreSnapshot.findMany).mockResolvedValue([]);

    const { GET } = await import("@/app/api/v1/creator-dashboard/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.totalTips).toBe(50);
    expect(body.data.pendingTips).toBe(3);
    expect(body.data.rmtScore).toBe(68.5);
    expect(body.data.tier).toBe("SILVER");
  });

  it("returns 404 when creator not found", async () => {
    mockCreatorAuth();
    vi.mocked(db.creator.findUnique).mockResolvedValue(null);
    vi.mocked(db.tip.count).mockResolvedValue(0);
    vi.mocked(db.scoreSnapshot.findMany).mockResolvedValue([]);

    const { GET } = await import("@/app/api/v1/creator-dashboard/route");
    const res = await GET();

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("CREATOR_NOT_FOUND");
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { GET } = await import("@/app/api/v1/creator-dashboard/route");
    const res = await GET();

    expect(res.status).toBe(401);
  });
});

// ──── Tests: List Tips ────

describe("GET /api/v1/creator-dashboard/tips", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated tips for creator", async () => {
    mockCreatorAuth();
    vi.mocked(db.tip.findMany).mockResolvedValue([
      {
        id: "tip-1",
        stock: { symbol: "RELIANCE", name: "Reliance Industries" },
        direction: "BUY",
        entryPrice: 2400,
        target1: 2500,
        target2: null,
        target3: null,
        stopLoss: 2350,
        status: "ACTIVE",
        timeframe: "SWING",
        conviction: "HIGH",
        rationale: "Breakout",
        tipTimestamp: new Date("2025-06-01"),
        returnPct: null,
        source: "DIRECT",
      },
    ] as never);
    vi.mocked(db.tip.count).mockResolvedValue(1);

    const { GET } = await import("@/app/api/v1/creator-dashboard/tips/route");
    const req = new NextRequest("http://localhost:3000/api/v1/creator-dashboard/tips?page=1&pageSize=20");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].stockSymbol).toBe("RELIANCE");
    expect(body.meta.total).toBe(1);
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { GET } = await import("@/app/api/v1/creator-dashboard/tips/route");
    const req = new NextRequest("http://localhost:3000/api/v1/creator-dashboard/tips");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

// ──── Tests: Create Tip ────

describe("POST /api/v1/creator-dashboard/tips", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates tip with valid data", async () => {
    mockCreatorAuth();
    vi.mocked(db.stock.findUnique).mockResolvedValue({
      id: "stock-1",
      symbol: "RELIANCE",
      lastPrice: 2410,
    } as never);
    vi.mocked(db.tip.findUnique).mockResolvedValue(null);
    vi.mocked(db.tip.create).mockResolvedValue({
      id: "tip-new",
      status: "PENDING_REVIEW",
      createdAt: new Date("2025-06-01"),
    } as never);

    const { POST } = await import("@/app/api/v1/creator-dashboard/tips/route");
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
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("tip-new");
  });

  it("returns 404 for unknown stock", async () => {
    mockCreatorAuth();
    vi.mocked(db.stock.findUnique).mockResolvedValue(null);

    const { POST } = await import("@/app/api/v1/creator-dashboard/tips/route");
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({
        stockSymbol: "UNKNOWN",
        direction: "BUY",
        entryPrice: 100,
        target1: 120,
        stopLoss: 90,
        timeframe: "SWING",
        conviction: "MEDIUM",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("STOCK_NOT_FOUND");
  });

  it("returns 409 for duplicate tip", async () => {
    mockCreatorAuth();
    vi.mocked(db.stock.findUnique).mockResolvedValue({
      id: "stock-1",
      symbol: "RELIANCE",
      lastPrice: 2410,
    } as never);
    vi.mocked(db.tip.findUnique).mockResolvedValue({ id: "existing-tip" } as never);

    const { POST } = await import("@/app/api/v1/creator-dashboard/tips/route");
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
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("DUPLICATE_TIP");
  });

  it("returns 400 for invalid tip data", async () => {
    mockCreatorAuth();

    const { POST } = await import("@/app/api/v1/creator-dashboard/tips/route");
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({ stockSymbol: "RELIANCE" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { POST } = await import("@/app/api/v1/creator-dashboard/tips/route");
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/tips", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

// ──── Tests: Analytics ────

describe("GET /api/v1/creator-dashboard/analytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns analytics for authenticated creator", async () => {
    mockCreatorAuth();
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      id: "creator-1",
      currentScore: {
        rmtScore: 68.5,
        accuracyScore: 72,
        riskAdjustedScore: 60,
        consistencyScore: 75,
        volumeFactorScore: 55,
        accuracyRate: 0.72,
        avgReturnPct: 3.5,
        winStreak: 5,
        lossStreak: 1,
        intradayAccuracy: 0.65,
        swingAccuracy: 0.78,
        positionalAccuracy: null,
        longTermAccuracy: null,
      },
    } as never);
    vi.mocked(db.scoreSnapshot.findMany).mockResolvedValue([]);
    vi.mocked(db.tip.groupBy).mockResolvedValue([] as never);

    const { GET } = await import("@/app/api/v1/creator-dashboard/analytics/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.score.rmtScore).toBe(68.5);
    expect(body.data.score.accuracyRate).toBe(0.72);
  });

  it("returns null score when no score exists", async () => {
    mockCreatorAuth();
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      id: "creator-1",
      currentScore: null,
    } as never);
    vi.mocked(db.scoreSnapshot.findMany).mockResolvedValue([]);
    vi.mocked(db.tip.groupBy).mockResolvedValue([] as never);

    const { GET } = await import("@/app/api/v1/creator-dashboard/analytics/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.score).toBeNull();
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { GET } = await import("@/app/api/v1/creator-dashboard/analytics/route");
    const res = await GET();

    expect(res.status).toBe(401);
  });
});

// ──── Tests: Profile GET ────

describe("GET /api/v1/creator-dashboard/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns creator profile for editing", async () => {
    mockCreatorAuth();
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      id: "creator-1",
      slug: "test-creator",
      displayName: "Test Creator",
      bio: "Financial tips",
      profileImageUrl: null,
      specializations: ["INTRADAY", "SWING"],
      tier: "SILVER",
      platforms: [
        {
          id: "p-1",
          platform: "TWITTER",
          platformHandle: "@testcreator",
          platformUrl: "https://twitter.com/testcreator",
          followerCount: 10000,
        },
      ],
    } as never);

    const { GET } = await import("@/app/api/v1/creator-dashboard/profile/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.slug).toBe("test-creator");
    expect(body.data.specializations).toContain("INTRADAY");
    expect(body.data.platforms).toHaveLength(1);
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { GET } = await import("@/app/api/v1/creator-dashboard/profile/route");
    const res = await GET();

    expect(res.status).toBe(401);
  });
});

// ──── Tests: Profile PATCH ────

describe("PATCH /api/v1/creator-dashboard/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates bio and specializations", async () => {
    mockCreatorAuth();
    vi.mocked(db.creator.update).mockResolvedValue({
      id: "creator-1",
      bio: "Updated bio",
      specializations: ["OPTIONS"],
      profileImageUrl: null,
    } as never);

    const { PATCH } = await import("@/app/api/v1/creator-dashboard/profile/route");
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/profile", {
      method: "PATCH",
      body: JSON.stringify({ bio: "Updated bio", specializations: ["OPTIONS"] }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.bio).toBe("Updated bio");
  });

  it("returns success with no changes when empty body", async () => {
    mockCreatorAuth();

    const { PATCH } = await import("@/app/api/v1/creator-dashboard/profile/route");
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/profile", {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.message).toBe("No changes");
  });

  it("returns 400 for invalid profile data", async () => {
    mockCreatorAuth();

    const { PATCH } = await import("@/app/api/v1/creator-dashboard/profile/route");
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/profile", {
      method: "PATCH",
      body: JSON.stringify({ bio: "x".repeat(600) }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { PATCH } = await import("@/app/api/v1/creator-dashboard/profile/route");
    const req = new Request("http://localhost:3000/api/v1/creator-dashboard/profile", {
      method: "PATCH",
      body: JSON.stringify({ bio: "test" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });
});
