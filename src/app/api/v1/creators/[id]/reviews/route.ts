import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { creatorReviewSchema } from "@/lib/validators/review";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: creatorId } = await context.params;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize")) || 20));
  const skip = (page - 1) * pageSize;

  const creator = await db.creator.findUnique({
    where: { id: creatorId },
    select: { id: true },
  });

  if (!creator) {
    return NextResponse.json(
      { success: false, error: { code: "CREATOR_NOT_FOUND", message: "Creator not found" } },
      { status: 404 }
    );
  }

  const [reviews, total, aggregate] = await Promise.all([
    db.creatorReview.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
    }),
    db.creatorReview.count({ where: { creatorId } }),
    db.creatorReview.aggregate({
      where: { creatorId },
      _avg: { rating: true },
    }),
  ]);

  // Check current user's existing review
  const session = await auth();
  let userReview = null;
  if (session?.user?.userId) {
    const existing = await db.creatorReview.findUnique({
      where: { creatorId_userId: { creatorId, userId: session.user.userId } },
      select: { id: true, rating: true, content: true },
    });
    if (existing) userReview = existing;
  }

  return NextResponse.json({
    success: true,
    data: {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        user: r.user,
      })),
      summary: {
        avgRating: aggregate._avg.rating ?? 0,
        totalReviews: total,
      },
      userReview,
    },
    meta: {
      page,
      pageSize,
      total,
      hasMore: skip + pageSize < total,
    },
  });
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { id: creatorId } = await context.params;
  const body: unknown = await request.json();
  const parsed = creatorReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid review", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const creator = await db.creator.findUnique({
    where: { id: creatorId },
    select: { id: true },
  });

  if (!creator) {
    return NextResponse.json(
      { success: false, error: { code: "CREATOR_NOT_FOUND", message: "Creator not found" } },
      { status: 404 }
    );
  }

  // Upsert: create or update the user's review for this creator
  const review = await db.creatorReview.upsert({
    where: {
      creatorId_userId: { creatorId, userId: session.user.userId },
    },
    create: {
      creatorId,
      userId: session.user.userId,
      rating: parsed.data.rating,
      content: parsed.data.content ?? null,
    },
    update: {
      rating: parsed.data.rating,
      content: parsed.data.content ?? null,
    },
    include: {
      user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: review.id,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        user: review.user,
      },
    },
    { status: 201 }
  );
}
