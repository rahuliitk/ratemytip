import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scoreHistoryQuerySchema } from "@/lib/validators/query";
import { subDays } from "date-fns";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = scoreHistoryQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { days } = parsed.data;

    // Resolve creator by id or slug
    const isCuid = /^c[a-z0-9]{24,}$/i.test(id);
    const creator = await db.creator.findFirst({
      where: isCuid ? { id } : { slug: id },
      select: { id: true },
    });

    if (!creator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CREATOR_NOT_FOUND",
            message: `Creator not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    const startDate = subDays(new Date(), days);
    const snapshots = await db.scoreSnapshot.findMany({
      where: {
        creatorId: creator.id,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    const data = snapshots.map((snap) => ({
      id: snap.id,
      creatorId: snap.creatorId,
      date: snap.date.toISOString(),
      rmtScore: snap.rmtScore,
      accuracyRate: snap.accuracyRate,
      totalScoredTips: snap.totalScoredTips,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
