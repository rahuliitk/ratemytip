// tests/integration/api/notifications.test.ts
//
// Integration tests for notification API endpoints:
//   GET   /api/v1/user/notifications       (paginated list)
//   PATCH /api/v1/user/notifications       (mark read)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth-helpers", () => ({
  requireUser: vi.fn(),
  isAuthError: vi.fn((result: unknown) => result instanceof NextResponse),
}));

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

// ──── Helpers ────

function mockUserAuth(userId = "user-1"): void {
  vi.mocked(requireUser).mockResolvedValue({
    session: { user: { userId, username: "testuser" } } as never,
    userId,
    username: "testuser",
  });
}

function mockUnauthenticated(): void {
  vi.mocked(requireUser).mockResolvedValue(
    NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    )
  );
}

// ──── Tests: GET Notifications ────

describe("GET /api/v1/user/notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated notifications", async () => {
    mockUserAuth();
    const mockNotifications = [
      {
        id: "n-1",
        type: "NEW_TIP_FROM_FOLLOWED",
        title: "New tip from Creator",
        body: "Creator posted a new BUY tip for RELIANCE",
        actionUrl: "/tip/tip-1",
        isRead: false,
        readAt: null,
        metadata: null,
        createdAt: new Date("2025-06-01T10:00:00Z"),
      },
      {
        id: "n-2",
        type: "COMMENT_REPLY",
        title: "New reply to your comment",
        body: "Someone replied to your comment",
        actionUrl: "/tip/tip-2",
        isRead: true,
        readAt: new Date("2025-06-01T11:00:00Z"),
        metadata: null,
        createdAt: new Date("2025-06-01T09:00:00Z"),
      },
    ];

    vi.mocked(db.notification.findMany).mockResolvedValue(mockNotifications as never);
    vi.mocked(db.notification.count)
      .mockResolvedValueOnce(2)  // total
      .mockResolvedValueOnce(1); // unreadCount

    const { GET } = await import("@/app/api/v1/user/notifications/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/notifications?page=1&pageSize=10");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe("n-1");
    expect(body.meta.total).toBe(2);
    expect(body.meta.unreadCount).toBe(1);
  });

  it("filters unread-only notifications", async () => {
    mockUserAuth();
    vi.mocked(db.notification.findMany).mockResolvedValue([]);
    vi.mocked(db.notification.count)
      .mockResolvedValueOnce(0)  // total with filter
      .mockResolvedValueOnce(0); // unreadCount

    const { GET } = await import("@/app/api/v1/user/notifications/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/notifications?unreadOnly=true");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Verify the where clause included isRead: false
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isRead: false }),
      })
    );
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { GET } = await import("@/app/api/v1/user/notifications/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/notifications");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

// ──── Tests: PATCH Mark As Read ────

describe("PATCH /api/v1/user/notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks specific notifications as read by IDs", async () => {
    mockUserAuth();
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 2 } as never);

    const { PATCH } = await import("@/app/api/v1/user/notifications/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/notifications", {
      method: "PATCH",
      body: JSON.stringify({ ids: ["n-1", "n-2"] }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.markedIds).toEqual(["n-1", "n-2"]);

    // Verify it only updated notifications belonging to the user
    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["n-1", "n-2"] },
          userId: "user-1",
          isRead: false,
        }),
      })
    );
  });

  it("marks all notifications as read", async () => {
    mockUserAuth();
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 5 } as never);

    const { PATCH } = await import("@/app/api/v1/user/notifications/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/notifications", {
      method: "PATCH",
      body: JSON.stringify({ markAllRead: true }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.markedAll).toBe(true);

    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          isRead: false,
        }),
      })
    );
  });

  it("returns 400 for empty IDs array", async () => {
    mockUserAuth();

    const { PATCH } = await import("@/app/api/v1/user/notifications/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/notifications", {
      method: "PATCH",
      body: JSON.stringify({ ids: [] }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when neither ids nor markAllRead provided", async () => {
    mockUserAuth();

    const { PATCH } = await import("@/app/api/v1/user/notifications/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/notifications", {
      method: "PATCH",
      body: JSON.stringify({ something: "else" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 for unauthenticated request", async () => {
    mockUnauthenticated();

    const { PATCH } = await import("@/app/api/v1/user/notifications/route");
    const req = new NextRequest("http://localhost:3000/api/v1/user/notifications", {
      method: "PATCH",
      body: JSON.stringify({ markAllRead: true }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });
});
