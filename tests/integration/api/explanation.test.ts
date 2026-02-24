// tests/integration/api/explanation.test.ts
//
// Integration tests for the tip explanation API:
//   GET   /api/v1/tips/:id/explanation — Fetch explanation (public)
//   POST  /api/v1/tips/:id/explanation — Create explanation (creator only)
//   PATCH /api/v1/tips/:id/explanation — Update explanation (creator only)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    tipExplanation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    tip: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth-helpers", () => ({
  requireCreator: vi.fn(),
  isAuthError: vi.fn((result: unknown) => result instanceof NextResponse),
}));

import { db } from "@/lib/db";
import { requireCreator } from "@/lib/auth-helpers";
import { GET, POST, PATCH } from "@/app/api/v1/tips/[id]/explanation/route";

// ──── Helpers ────

function mockCreatorAuth(creatorId = "creator-1"): void {
  vi.mocked(requireCreator).mockResolvedValue({
    session: { user: { userId: "user-1", role: "CREATOR" } } as never,
    userId: "user-1",
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

const routeParams = { params: Promise.resolve({ id: "tip-1" }) };

// ──── Tests ────

describe("GET /api/v1/tips/:id/explanation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns explanation when it exists", async () => {
    vi.mocked(db.tipExplanation.findUnique).mockResolvedValue({
      id: "expl-1",
      tipId: "tip-1",
      content: "This stock shows strong fundamentals.",
      imageUrls: ["https://example.com/chart.png"],
      version: 1,
      createdAt: new Date("2026-01-15"),
      updatedAt: new Date("2026-01-15"),
    } as never);

    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation");
    const res = await GET(req, routeParams);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.content).toBe("This stock shows strong fundamentals.");
    expect(body.data.imageUrls).toHaveLength(1);
    expect(body.data.version).toBe(1);
  });

  it("returns 404 when no explanation exists", async () => {
    vi.mocked(db.tipExplanation.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation");
    const res = await GET(req, routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 500 on database error", async () => {
    vi.mocked(db.tipExplanation.findUnique).mockRejectedValue(new Error("DB error"));

    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation");
    const res = await GET(req, routeParams);
    expect(res.status).toBe(500);
  });
});

describe("POST /api/v1/tips/:id/explanation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatorAuth();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticated();
    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "POST",
      body: JSON.stringify({ content: "Test" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty content", async () => {
    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "POST",
      body: JSON.stringify({ content: "" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });

  it("returns 404 when tip not owned by creator", async () => {
    vi.mocked(db.tip.findUnique).mockResolvedValue({
      id: "tip-1",
      creatorId: "other-creator", // Different creator
    } as never);

    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "POST",
      body: JSON.stringify({ content: "My analysis of this tip." }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 409 when explanation already exists", async () => {
    vi.mocked(db.tip.findUnique).mockResolvedValue({
      id: "tip-1",
      creatorId: "creator-1",
    } as never);
    vi.mocked(db.tipExplanation.findUnique).mockResolvedValue({
      id: "existing-expl",
    } as never);

    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "POST",
      body: JSON.stringify({ content: "My analysis." }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, routeParams);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_EXISTS");
  });

  it("creates explanation successfully", async () => {
    vi.mocked(db.tip.findUnique).mockResolvedValue({
      id: "tip-1",
      creatorId: "creator-1",
    } as never);
    vi.mocked(db.tipExplanation.findUnique).mockResolvedValue(null); // No existing explanation
    vi.mocked(db.tipExplanation.create).mockResolvedValue({
      id: "expl-new",
      tipId: "tip-1",
      createdAt: new Date("2026-01-20"),
    } as never);

    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "POST",
      body: JSON.stringify({
        content: "This stock has strong revenue growth and improving margins.",
        imageUrls: ["https://example.com/chart.png"],
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, routeParams);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("expl-new");

    expect(db.tipExplanation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipId: "tip-1",
          creatorId: "creator-1",
          content: "This stock has strong revenue growth and improving margins.",
          imageUrls: ["https://example.com/chart.png"],
        }),
      })
    );
  });
});

describe("PATCH /api/v1/tips/:id/explanation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatorAuth();
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthenticated();
    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "PATCH",
      body: JSON.stringify({ content: "Updated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 404 when no explanation exists to update", async () => {
    vi.mocked(db.tipExplanation.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "PATCH",
      body: JSON.stringify({ content: "Updated analysis." }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 403 when creator does not own the explanation", async () => {
    vi.mocked(db.tipExplanation.findUnique).mockResolvedValue({
      id: "expl-1",
      creatorId: "other-creator", // Different creator
      version: 1,
    } as never);

    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "PATCH",
      body: JSON.stringify({ content: "Trying to modify someone else's explanation." }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(403);
  });

  it("updates explanation and increments version", async () => {
    vi.mocked(db.tipExplanation.findUnique).mockResolvedValue({
      id: "expl-1",
      creatorId: "creator-1",
      version: 2,
    } as never);
    vi.mocked(db.tipExplanation.update).mockResolvedValue({
      id: "expl-1",
      version: 3,
      updatedAt: new Date("2026-01-21"),
    } as never);

    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "PATCH",
      body: JSON.stringify({ content: "Updated analysis with new data." }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, routeParams);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.version).toBe(3);

    expect(db.tipExplanation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: 3, // 2 + 1
          content: "Updated analysis with new data.",
        }),
      })
    );
  });

  it("returns 400 for content exceeding 5000 characters", async () => {
    const req = new Request("http://localhost:3000/api/v1/tips/tip-1/explanation", {
      method: "PATCH",
      body: JSON.stringify({ content: "x".repeat(5001) }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(400);
  });
});
