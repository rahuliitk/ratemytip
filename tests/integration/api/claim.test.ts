// tests/integration/api/claim.test.ts
//
// Integration tests for the claim request API endpoints:
//   GET  /api/admin/claims     — List claims (admin only)
//   PATCH /api/admin/claims/:id — Approve/reject claim (admin only)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    claimRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    creator: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth-helpers", () => ({
  requireAdmin: vi.fn(),
  isAuthError: vi.fn((result: unknown) => result instanceof NextResponse),
}));

vi.mock("@/lib/queue", () => ({
  enqueueNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email", () => ({
  sendClaimApprovedEmail: vi.fn().mockResolvedValue(undefined),
  sendClaimRejectedEmail: vi.fn().mockResolvedValue(undefined),
}));

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { GET } from "@/app/api/admin/claims/route";
import { PATCH } from "@/app/api/admin/claims/[id]/route";

// ──── Helpers ────

function mockAdminAuth(): void {
  vi.mocked(requireAdmin).mockResolvedValue({
    session: { user: { adminId: "admin-1" } } as never,
    adminId: "admin-1",
  });
}

function mockUnauthenticated(): void {
  vi.mocked(requireAdmin).mockResolvedValue(
    NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    )
  );
}

// ──── Tests ────

describe("GET /api/admin/claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminAuth();
  });

  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const req = new NextRequest("http://localhost:3000/api/admin/claims");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns claims list with pagination meta", async () => {
    const mockClaims = [
      {
        id: "claim-1",
        status: "PENDING",
        proofUrl: "https://twitter.com/user/proof",
        verificationNote: "This is my profile",
        reviewNote: null,
        createdAt: new Date("2026-01-15"),
        reviewedAt: null,
        creatorId: "creator-1",
        userId: "user-1",
        user: { id: "user-1", displayName: "Test User", username: "testuser", email: "test@example.com", avatarUrl: null },
        reviewer: null,
      },
    ];

    vi.mocked(db.claimRequest.findMany).mockResolvedValue(mockClaims as never);
    vi.mocked(db.claimRequest.count).mockResolvedValue(1);
    vi.mocked(db.creator.findMany).mockResolvedValue([
      { id: "creator-1", slug: "test-creator", displayName: "Test Creator", profileImageUrl: null, isClaimed: false },
    ] as never);

    const req = new NextRequest("http://localhost:3000/api/admin/claims");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe("PENDING");
    expect(body.data[0].creator.slug).toBe("test-creator");
    expect(body.meta.total).toBe(1);
  });

  it("filters by status when provided", async () => {
    vi.mocked(db.claimRequest.findMany).mockResolvedValue([]);
    vi.mocked(db.claimRequest.count).mockResolvedValue(0);
    vi.mocked(db.creator.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/admin/claims?status=APPROVED");
    await GET(req);

    expect(db.claimRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "APPROVED" },
      })
    );
  });

  it("returns empty list when no claims exist", async () => {
    vi.mocked(db.claimRequest.findMany).mockResolvedValue([]);
    vi.mocked(db.claimRequest.count).mockResolvedValue(0);
    vi.mocked(db.creator.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/admin/claims");
    const res = await GET(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    vi.mocked(db.claimRequest.findMany).mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost:3000/api/admin/claims");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/claims/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminAuth();
  });

  it("returns 401 when unauthenticated", async () => {
    mockUnauthenticated();
    const req = new Request("http://localhost:3000/api/admin/claims/claim-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "APPROVED" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid action", async () => {
    const req = new Request("http://localhost:3000/api/admin/claims/claim-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "INVALID" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when claim not found", async () => {
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/admin/claims/nonexistent", {
      method: "PATCH",
      body: JSON.stringify({ action: "APPROVED" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });

  it("returns 409 when claim already reviewed", async () => {
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue({
      id: "claim-1",
      status: "APPROVED",
      userId: "user-1",
      creatorId: "creator-1",
      user: { id: "user-1", claimedCreatorId: null },
    } as never);

    const req = new Request("http://localhost:3000/api/admin/claims/claim-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "APPROVED" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-1" }) });
    expect(res.status).toBe(409);
  });

  it("approves a pending claim with transaction", async () => {
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue({
      id: "claim-1",
      status: "PENDING",
      userId: "user-1",
      creatorId: "creator-1",
      user: { id: "user-1", claimedCreatorId: null },
    } as never);
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      id: "creator-1",
      isClaimed: false,
      displayName: "Test Creator",
    } as never);
    vi.mocked(db.$transaction).mockResolvedValue(undefined as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      email: "user@example.com",
    } as never);

    const req = new Request("http://localhost:3000/api/admin/claims/claim-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "APPROVED", reviewNote: "Looks good" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("APPROVED");
    expect(db.$transaction).toHaveBeenCalled();
  });

  it("returns 409 when creator already claimed by another user", async () => {
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue({
      id: "claim-1",
      status: "PENDING",
      userId: "user-1",
      creatorId: "creator-1",
      user: { id: "user-1", claimedCreatorId: null },
    } as never);
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      id: "creator-1",
      isClaimed: true,
    } as never);

    const req = new Request("http://localhost:3000/api/admin/claims/claim-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "APPROVED" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-1" }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_CLAIMED");
  });

  it("rejects a pending claim", async () => {
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue({
      id: "claim-1",
      status: "PENDING",
      userId: "user-1",
      creatorId: "creator-1",
      user: { id: "user-1", claimedCreatorId: null },
    } as never);
    vi.mocked(db.claimRequest.update).mockResolvedValue({} as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      email: "user@example.com",
    } as never);
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      displayName: "Test Creator",
    } as never);

    const req = new Request("http://localhost:3000/api/admin/claims/claim-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "REJECTED", reviewNote: "Insufficient proof" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe("REJECTED");
    expect(db.claimRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REJECTED",
          reviewNote: "Insufficient proof",
        }),
      })
    );
  });
});
