// tests/integration/api/social.test.ts
//
// Integration tests for social feature APIs:
//   Ratings (POST /api/v1/tips/[id]/ratings)
//   Save tips (POST /api/v1/tips/[id]/save)
//   Follows (POST /api/v1/follows)
//   Comments (POST /api/v1/tips/[id]/comments)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    comment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    tipRating: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    tip: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    savedTip: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    follow: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    creator: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/validators/comment", () => ({
  createCommentSchema: {
    safeParse: vi.fn((data: unknown) => {
      const d = data as Record<string, unknown>;
      if (d && typeof d.content === "string" && d.content.length > 0) {
        return { success: true, data: d };
      }
      return { success: false, error: { flatten: () => ({}) } };
    }),
  },
}));

vi.mock("@/lib/validators/rating", () => ({
  tipRatingSchema: {
    safeParse: vi.fn((data: unknown) => {
      const d = data as Record<string, unknown>;
      if (d && typeof d.rating === "number" && d.rating >= 1 && d.rating <= 5) {
        return { success: true, data: d };
      }
      return { success: false, error: { flatten: () => ({}) } };
    }),
  },
}));

vi.mock("@/lib/validators/follow", () => ({
  followSchema: {
    safeParse: vi.fn((data: unknown) => {
      const d = data as Record<string, unknown>;
      if (d && typeof d.creatorId === "string") {
        return { success: true, data: d };
      }
      return { success: false, error: { flatten: () => ({}) } };
    }),
  },
}));

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ──── Helpers ────

function mockAuthenticated(userId = "user-1"): void {
  vi.mocked(auth).mockResolvedValue({
    user: { userId, username: "testuser", userType: "user" },
  } as never);
}

function mockUnauthenticated(): void {
  vi.mocked(auth).mockResolvedValue(null as never);
}

// ──── Tests: Authentication ────

describe("Social API Authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 for unauthenticated comment creation", async () => {
    mockUnauthenticated();

    const { POST } = await import("@/app/api/v1/tips/[id]/comments/route");

    const req = new NextRequest("http://localhost:3000/api/v1/tips/tip-1/comments", {
      method: "POST",
      body: JSON.stringify({ content: "Great tip!" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "tip-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 401 for unauthenticated rating", async () => {
    mockUnauthenticated();

    const { POST } = await import("@/app/api/v1/tips/[id]/ratings/route");

    const req = new NextRequest("http://localhost:3000/api/v1/tips/tip-1/ratings", {
      method: "POST",
      body: JSON.stringify({ rating: 5 }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "tip-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 401 for unauthenticated save", async () => {
    mockUnauthenticated();

    const { POST } = await import("@/app/api/v1/tips/[id]/save/route");

    const req = new NextRequest("http://localhost:3000/api/v1/tips/tip-1/save", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "tip-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 401 for unauthenticated follow", async () => {
    mockUnauthenticated();

    const { POST } = await import("@/app/api/v1/follows/route");

    const req = new NextRequest("http://localhost:3000/api/v1/follows", {
      method: "POST",
      body: JSON.stringify({ creatorId: "c-1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

// ──── Tests: Ratings ────

describe("Tip Ratings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
  });

  it("accepts valid rating 1-5", async () => {
    vi.mocked(db.tip.findUnique).mockResolvedValue({ id: "tip-1" } as never);
    vi.mocked(db.tipRating.findUnique).mockResolvedValue(null);
    vi.mocked(db.$transaction).mockResolvedValue([] as never);
    vi.mocked(db.tipRating.aggregate).mockResolvedValue({ _avg: { rating: 4 } } as never);
    vi.mocked(db.tip.update).mockResolvedValue({} as never);

    const { POST } = await import("@/app/api/v1/tips/[id]/ratings/route");

    const req = new NextRequest("http://localhost:3000/api/v1/tips/tip-1/ratings", {
      method: "POST",
      body: JSON.stringify({ rating: 4 }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "tip-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("rejects out-of-range rating", async () => {
    const { POST } = await import("@/app/api/v1/tips/[id]/ratings/route");

    const req = new NextRequest("http://localhost:3000/api/v1/tips/tip-1/ratings", {
      method: "POST",
      body: JSON.stringify({ rating: 6 }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "tip-1" }) });
    expect(res.status).toBe(400);
  });
});
