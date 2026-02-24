import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { NOTIFICATION, PAGINATION } from "@/lib/constants";

/**
 * GET /api/v1/user/notifications
 * Get paginated notifications for the authenticated user.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userResult = await requireUser();
  if (isAuthError(userResult)) return userResult;

  const { searchParams } = request.nextUrl;
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    NOTIFICATION.MAX_PER_PAGE,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? String(PAGINATION.DEFAULT_PAGE_SIZE), 10))
  );

  const where = {
    userId: userResult.userId,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.notification.count({ where }),
    db.notification.count({
      where: { userId: userResult.userId, isRead: false },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      actionUrl: n.actionUrl,
      isRead: n.isRead,
      readAt: n.readAt?.toISOString() ?? null,
      metadata: n.metadata,
      createdAt: n.createdAt.toISOString(),
    })),
    meta: {
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
      unreadCount,
    },
  });
}

/**
 * PATCH /api/v1/user/notifications
 * Mark notifications as read.
 * Body: { ids: string[] } or { markAllRead: true }
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const userResult = await requireUser();
  if (isAuthError(userResult)) return userResult;

  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
        },
        { status: 400 }
      );
    }

    const now = new Date();

    if ("markAllRead" in body && (body as { markAllRead: boolean }).markAllRead) {
      await db.notification.updateMany({
        where: { userId: userResult.userId, isRead: false },
        data: { isRead: true, readAt: now },
      });

      return NextResponse.json({ success: true, data: { markedAll: true } });
    }

    if ("ids" in body && Array.isArray((body as { ids: unknown }).ids)) {
      const ids = (body as { ids: string[] }).ids;

      if (ids.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "No notification IDs provided" },
          },
          { status: 400 }
        );
      }

      await db.notification.updateMany({
        where: {
          id: { in: ids },
          userId: userResult.userId,
          isRead: false,
        },
        data: { isRead: true, readAt: now },
      });

      return NextResponse.json({ success: true, data: { markedIds: ids } });
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Provide either 'ids' or 'markAllRead'" },
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to update notifications" },
      },
      { status: 500 }
    );
  }
}
