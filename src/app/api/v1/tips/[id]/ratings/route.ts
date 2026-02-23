import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tipRatingSchema } from "@/lib/validators/rating";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ success: true, data: { rating: null } });
  }

  const { id: tipId } = await context.params;

  const existing = await db.tipRating.findUnique({
    where: { tipId_userId: { tipId, userId: session.user.userId } },
    select: { rating: true },
  });

  return NextResponse.json({ success: true, data: { rating: existing?.rating ?? null } });
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

  const { id: tipId } = await context.params;
  const body: unknown = await request.json();
  const parsed = tipRatingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid rating", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  // Check tip exists
  const tip = await db.tip.findUnique({ where: { id: tipId }, select: { id: true } });
  if (!tip) {
    return NextResponse.json(
      { success: false, error: { code: "TIP_NOT_FOUND", message: "Tip not found" } },
      { status: 404 }
    );
  }

  // Upsert the rating
  const existing = await db.tipRating.findUnique({
    where: { tipId_userId: { tipId, userId: session.user.userId } },
  });

  if (existing) {
    await db.tipRating.update({
      where: { id: existing.id },
      data: { rating: parsed.data.rating },
    });
  } else {
    await db.$transaction([
      db.tipRating.create({ data: { tipId, userId: session.user.userId, rating: parsed.data.rating } }),
      db.tip.update({ where: { id: tipId }, data: { ratingCount: { increment: 1 } } }),
    ]);
  }

  // Recalculate average rating
  const agg = await db.tipRating.aggregate({
    where: { tipId },
    _avg: { rating: true },
  });
  await db.tip.update({
    where: { id: tipId },
    data: { avgRating: agg._avg.rating ?? 0 },
  });

  return NextResponse.json({ success: true, data: { rating: parsed.data.rating } });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { id: tipId } = await context.params;

  const existing = await db.tipRating.findUnique({
    where: { tipId_userId: { tipId, userId: session.user.userId } },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_RATED", message: "No rating to remove" } },
      { status: 404 }
    );
  }

  await db.$transaction([
    db.tipRating.delete({ where: { id: existing.id } }),
    db.tip.update({ where: { id: tipId }, data: { ratingCount: { decrement: 1 } } }),
  ]);

  // Recalculate average
  const agg = await db.tipRating.aggregate({ where: { tipId }, _avg: { rating: true } });
  await db.tip.update({ where: { id: tipId }, data: { avgRating: agg._avg.rating ?? 0 } });

  return NextResponse.json({ success: true, data: { rating: null } });
}
