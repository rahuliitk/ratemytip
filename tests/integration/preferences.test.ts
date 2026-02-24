// tests/integration/preferences.test.ts
//
// Integration tests for GET/POST /api/v1/user/preferences
// Tests user preference CRUD with mocked database and Redis.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/auth-helpers", () => ({
  requireUser: vi.fn(),
  isAuthError: vi.fn((r: unknown) => r instanceof NextResponse),
}));

vi.mock("@/lib/db", () => ({
  db: {
    userPreference: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    del: vi.fn(),
  },
}));

import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { GET, POST } from "@/app/api/v1/user/preferences/route";

// ──── Tests ────

describe("GET /api/v1/user/preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default preferences when none exist", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
    });

    vi.mocked(db.userPreference.findUnique).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      preferredTimeframes: [],
      preferredAssetClasses: [],
      riskTolerance: "MODERATE",
      minCreatorScore: null,
      preferredSectors: [],
    });
  });

  it("returns saved preferences when they exist", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
    });

    const mockPrefs = {
      userId: "user1",
      preferredTimeframes: ["SWING", "POSITIONAL"],
      preferredAssetClasses: ["EQUITY", "INDEX"],
      riskTolerance: "HIGH",
      minCreatorScore: 60,
      preferredSectors: ["IT", "Pharma"],
    };
    vi.mocked(db.userPreference.findUnique).mockResolvedValue(mockPrefs as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.preferredTimeframes).toEqual(["SWING", "POSITIONAL"]);
    expect(body.data.riskTolerance).toBe("HIGH");
    expect(body.data.minCreatorScore).toBe(60);
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
});

describe("POST /api/v1/user/preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
    });
  });

  it("saves preferences and returns them", async () => {
    const inputPrefs = {
      preferredTimeframes: ["INTRADAY", "SWING"],
      preferredAssetClasses: ["EQUITY"],
      riskTolerance: "LOW",
      minCreatorScore: 70,
      preferredSectors: ["Banking"],
    };

    const savedPrefs = {
      userId: "user1",
      ...inputPrefs,
    };
    vi.mocked(db.userPreference.upsert).mockResolvedValue(savedPrefs as never);
    vi.mocked(redis.del).mockResolvedValue(1 as never);

    const req = new Request("http://localhost/api/v1/user/preferences", {
      method: "POST",
      body: JSON.stringify(inputPrefs),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.preferredTimeframes).toEqual(["INTRADAY", "SWING"]);
    expect(body.data.riskTolerance).toBe("LOW");

    // Verify upsert was called correctly
    expect(db.userPreference.upsert).toHaveBeenCalledWith({
      where: { userId: "user1" },
      create: expect.objectContaining({ userId: "user1", ...inputPrefs }),
      update: inputPrefs,
    });

    // Verify Redis cache was invalidated
    expect(redis.del).toHaveBeenCalledWith("reco:tips:user1");
    expect(redis.del).toHaveBeenCalledWith("reco:creators:user1");
  });

  it("saves preferences with defaults for optional fields", async () => {
    const minimalPrefs = {
      riskTolerance: "HIGH",
    };

    vi.mocked(db.userPreference.upsert).mockResolvedValue({
      userId: "user1",
      preferredTimeframes: [],
      preferredAssetClasses: [],
      riskTolerance: "HIGH",
      minCreatorScore: null,
      preferredSectors: [],
    } as never);
    vi.mocked(redis.del).mockResolvedValue(1 as never);

    const req = new Request("http://localhost/api/v1/user/preferences", {
      method: "POST",
      body: JSON.stringify(minimalPrefs),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.riskTolerance).toBe("HIGH");
  });

  it("returns 400 for invalid preference data", async () => {
    const req = new Request("http://localhost/api/v1/user/preferences", {
      method: "POST",
      body: JSON.stringify({
        riskTolerance: "EXTREME", // invalid enum value
        minCreatorScore: 200,     // exceeds max of 100
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
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

    const req = new Request("http://localhost/api/v1/user/preferences", {
      method: "POST",
      body: JSON.stringify({ riskTolerance: "LOW" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("still succeeds when Redis is unavailable", async () => {
    const inputPrefs = {
      preferredTimeframes: ["SWING"],
      riskTolerance: "MODERATE",
    };

    vi.mocked(db.userPreference.upsert).mockResolvedValue({
      userId: "user1",
      preferredTimeframes: ["SWING"],
      preferredAssetClasses: [],
      riskTolerance: "MODERATE",
      minCreatorScore: null,
      preferredSectors: [],
    } as never);

    // Simulate Redis failure
    vi.mocked(redis.del).mockRejectedValue(new Error("Connection refused"));

    const req = new Request("http://localhost/api/v1/user/preferences", {
      method: "POST",
      body: JSON.stringify(inputPrefs),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    // Should succeed despite Redis failure (error is caught)
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
