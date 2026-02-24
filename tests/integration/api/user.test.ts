// tests/integration/api/user.test.ts
//
// Integration tests for user API endpoints:
//   GET/PATCH/DELETE /api/v1/user/profile
//   PATCH /api/v1/user/password
//   GET /api/v1/user/saved
//   GET /api/v1/user/following

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    savedTip: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    follow: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth-helpers", () => ({
  requireUser: vi.fn(),
  isAuthError: vi.fn((result: unknown) => result instanceof NextResponse),
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn().mockResolvedValue(true),
  hash: vi.fn().mockResolvedValue("new-hashed-password"),
}));

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ──── Helpers ────

function mockAuthenticated(userId = "user-1"): void {
  vi.mocked(auth).mockResolvedValue({
    user: { userId, userType: "user", username: "testuser", name: "Test User", email: "test@example.com" },
  } as never);
}

function mockUnauthenticated(): void {
  vi.mocked(auth).mockResolvedValue(null as never);
}

// ──── Tests: GET Profile ────

describe("GET /api/v1/user/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user profile for authenticated user", async () => {
    mockAuthenticated();
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      displayName: "Test User",
      username: "testuser",
      avatarUrl: null,
      role: "CONSUMER",
      createdAt: new Date("2025-01-01"),
      _count: { follows: 5, savedTips: 10, tipRatings: 3, comments: 7 },
    } as never);

    const { GET } = await import("@/app/api/v1/user/profile/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe("testuser");
    expect(body.data.followingCount).toBe(5);
    expect(body.data.savedCount).toBe(10);
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { GET } = await import("@/app/api/v1/user/profile/route");
    const res = await GET();

    expect(res.status).toBe(401);
  });
});

// ──── Tests: PATCH Profile ────

describe("PATCH /api/v1/user/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates display name", async () => {
    mockAuthenticated();
    vi.mocked(db.user.update).mockResolvedValue({
      id: "user-1",
      displayName: "New Name",
      avatarUrl: null,
    } as never);

    const { PATCH } = await import("@/app/api/v1/user/profile/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ displayName: "New Name" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.displayName).toBe("New Name");
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { PATCH } = await import("@/app/api/v1/user/profile/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ displayName: "New Name" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });
});

// ──── Tests: DELETE Profile (Account Deletion) ────

describe("DELETE /api/v1/user/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("soft-deletes account with valid password", async () => {
    mockAuthenticated();
    vi.mocked(db.user.findUnique).mockResolvedValue({
      passwordHash: "hashed",
    } as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);

    const { DELETE } = await import("@/app/api/v1/user/profile/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/profile", {
      method: "DELETE",
      body: JSON.stringify({ password: "correctpassword" }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      })
    );
  });

  it("returns 403 for incorrect password", async () => {
    mockAuthenticated();
    vi.mocked(db.user.findUnique).mockResolvedValue({
      passwordHash: "hashed",
    } as never);

    const { compare } = await import("bcryptjs");
    vi.mocked(compare).mockResolvedValueOnce(false as never);

    const { DELETE } = await import("@/app/api/v1/user/profile/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/profile", {
      method: "DELETE",
      body: JSON.stringify({ password: "wrongpassword" }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { DELETE } = await import("@/app/api/v1/user/profile/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/profile", {
      method: "DELETE",
      body: JSON.stringify({ password: "password" }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });
});
