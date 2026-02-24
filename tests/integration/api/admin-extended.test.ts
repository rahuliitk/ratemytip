// tests/integration/api/admin-extended.test.ts
//
// Integration tests for admin API endpoints:
//   GET   /api/admin/claims         (list claims)
//   PATCH /api/admin/claims/:id     (approve/reject claim)
//   GET   /api/admin/reports        (list reports)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    claimRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    creator: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    commentReport: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
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

// ──── Helpers ────

function mockAdminAuth(adminId = "admin-1"): void {
  vi.mocked(requireAdmin).mockResolvedValue({
    session: { user: { adminId, role: "SUPER_ADMIN" } } as never,
    adminId,
  });
}

function mockUnauthenticated(): void {
  vi.mocked(requireAdmin).mockResolvedValue(
    NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Admin access required" } },
      { status: 401 }
    )
  );
}

// ──── Tests: List Claims ────

describe("GET /api/admin/claims", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated claims list", async () => {
    mockAdminAuth();
    vi.mocked(db.claimRequest.findMany).mockResolvedValue([
      {
        id: "claim-1",
        status: "PENDING",
        creatorId: "creator-1",
        proofUrl: "https://example.com/proof",
        verificationNote: "I am this creator",
        reviewNote: null,
        createdAt: new Date("2025-06-01"),
        reviewedAt: null,
        user: { id: "user-1", displayName: "Test User", username: "testuser", email: "test@example.com", avatarUrl: null },
        reviewer: null,
      },
    ] as never);
    vi.mocked(db.claimRequest.count).mockResolvedValue(1);
    vi.mocked(db.creator.findMany).mockResolvedValue([
      { id: "creator-1", slug: "test-creator", displayName: "Test Creator", profileImageUrl: null, isClaimed: false },
    ] as never);

    const { GET } = await import("@/app/api/admin/claims/route");
    const req = new NextRequest("http://localhost:3000/api/admin/claims?page=1&pageSize=20");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe("PENDING");
    expect(body.data[0].user.username).toBe("testuser");
    expect(body.data[0].creator.slug).toBe("test-creator");
    expect(body.meta.total).toBe(1);
  });

  it("filters claims by status", async () => {
    mockAdminAuth();
    vi.mocked(db.claimRequest.findMany).mockResolvedValue([] as never);
    vi.mocked(db.claimRequest.count).mockResolvedValue(0);
    vi.mocked(db.creator.findMany).mockResolvedValue([] as never);

    const { GET } = await import("@/app/api/admin/claims/route");
    const req = new NextRequest("http://localhost:3000/api/admin/claims?status=approved");
    const res = await GET(req);

    expect(res.status).toBe(200);
    // Verify the where clause includes the status filter
    expect(db.claimRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "APPROVED" }),
      })
    );
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { GET } = await import("@/app/api/admin/claims/route");
    const req = new NextRequest("http://localhost:3000/api/admin/claims");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

// ──── Tests: Approve/Reject Claim ────

describe("PATCH /api/admin/claims/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("approves a pending claim", async () => {
    mockAdminAuth();
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue({
      id: "claim-1",
      status: "PENDING",
      userId: "user-1",
      creatorId: "creator-1",
      user: { id: "user-1", claimedCreatorId: null },
    } as never);
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      isClaimed: false,
      displayName: "Test Creator",
    } as never);
    vi.mocked(db.$transaction).mockResolvedValue([] as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      email: "user@example.com",
    } as never);

    const { PATCH } = await import("@/app/api/admin/claims/[id]/route");
    const req = new Request("http://localhost:3000/api/admin/claims/claim-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "APPROVED", reviewNote: "Verified" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("APPROVED");
  });

  it("rejects a pending claim", async () => {
    mockAdminAuth();
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue({
      id: "claim-2",
      status: "PENDING",
      userId: "user-2",
      creatorId: "creator-2",
      user: { id: "user-2", claimedCreatorId: null },
    } as never);
    vi.mocked(db.claimRequest.update).mockResolvedValue({} as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      email: "user2@example.com",
    } as never);
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      displayName: "Another Creator",
    } as never);

    const { PATCH } = await import("@/app/api/admin/claims/[id]/route");
    const req = new Request("http://localhost:3000/api/admin/claims/claim-2", {
      method: "PATCH",
      body: JSON.stringify({ action: "REJECTED", reviewNote: "Insufficient proof" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-2" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("REJECTED");
  });

  it("returns 404 for non-existent claim", async () => {
    mockAdminAuth();
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/admin/claims/[id]/route");
    const req = new Request("http://localhost:3000/api/admin/claims/missing", {
      method: "PATCH",
      body: JSON.stringify({ action: "APPROVED" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("CLAIM_NOT_FOUND");
  });

  it("returns 409 for already-reviewed claim", async () => {
    mockAdminAuth();
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue({
      id: "claim-3",
      status: "APPROVED",
      userId: "user-3",
      creatorId: "creator-3",
      user: { id: "user-3" },
    } as never);

    const { PATCH } = await import("@/app/api/admin/claims/[id]/route");
    const req = new Request("http://localhost:3000/api/admin/claims/claim-3", {
      method: "PATCH",
      body: JSON.stringify({ action: "REJECTED" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-3" }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_REVIEWED");
  });

  it("returns 409 when creator already claimed by another user", async () => {
    mockAdminAuth();
    vi.mocked(db.claimRequest.findUnique).mockResolvedValue({
      id: "claim-4",
      status: "PENDING",
      userId: "user-4",
      creatorId: "creator-4",
      user: { id: "user-4", claimedCreatorId: null },
    } as never);
    vi.mocked(db.creator.findUnique).mockResolvedValue({
      isClaimed: true,
      displayName: "Claimed Creator",
    } as never);

    const { PATCH } = await import("@/app/api/admin/claims/[id]/route");
    const req = new Request("http://localhost:3000/api/admin/claims/claim-4", {
      method: "PATCH",
      body: JSON.stringify({ action: "APPROVED" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-4" }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_CLAIMED");
  });

  it("returns 400 for invalid action", async () => {
    mockAdminAuth();

    const { PATCH } = await import("@/app/api/admin/claims/[id]/route");
    const req = new Request("http://localhost:3000/api/admin/claims/claim-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "INVALID_ACTION" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { PATCH } = await import("@/app/api/admin/claims/[id]/route");
    const req = new Request("http://localhost:3000/api/admin/claims/claim-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "APPROVED" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "claim-1" }) });
    expect(res.status).toBe(401);
  });
});

// ──── Tests: List Reports ────

describe("GET /api/admin/reports", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated reports list", async () => {
    mockAdminAuth();
    vi.mocked(db.commentReport.findMany).mockResolvedValue([
      {
        id: "report-1",
        reason: "SPAM",
        details: "This is spam",
        status: "PENDING_REPORT",
        reporterId: "user-1",
        createdAt: new Date("2025-06-01"),
        comment: {
          id: "comment-1",
          content: "Buy now!!!",
          isHidden: false,
          createdAt: new Date("2025-05-30"),
          user: { id: "user-2", displayName: "Commenter", username: "commenter" },
          tip: { id: "tip-1", stock: { symbol: "RELIANCE" } },
        },
      },
    ] as never);
    vi.mocked(db.commentReport.count).mockResolvedValue(1);
    vi.mocked(db.user.findMany).mockResolvedValue([
      { id: "user-1", displayName: "Reporter", username: "reporter" },
    ] as never);

    const { GET } = await import("@/app/api/admin/reports/route");
    const req = new NextRequest("http://localhost:3000/api/admin/reports?page=1");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].reason).toBe("SPAM");
    expect(body.data[0].comment.stockSymbol).toBe("RELIANCE");
    expect(body.data[0].reporter.username).toBe("reporter");
    expect(body.meta.total).toBe(1);
  });

  it("filters reports by status", async () => {
    mockAdminAuth();
    vi.mocked(db.commentReport.findMany).mockResolvedValue([] as never);
    vi.mocked(db.commentReport.count).mockResolvedValue(0);
    vi.mocked(db.user.findMany).mockResolvedValue([] as never);

    const { GET } = await import("@/app/api/admin/reports/route");
    const req = new NextRequest("http://localhost:3000/api/admin/reports?status=reviewed");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(db.commentReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "REVIEWED" }),
      })
    );
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { GET } = await import("@/app/api/admin/reports/route");
    const req = new NextRequest("http://localhost:3000/api/admin/reports");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});
