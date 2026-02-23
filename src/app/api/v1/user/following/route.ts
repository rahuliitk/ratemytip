import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0");

  const follows = await db.follow.findMany({
    where: { userId: session.user.userId },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: Math.min(limit, 100),
    include: {
      creator: {
        select: {
          id: true,
          slug: true,
          displayName: true,
          profileImageUrl: true,
          tier: true,
          totalTips: true,
          currentScore: { select: { rmtScore: true } },
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: follows.map((f) => ({
      id: f.id,
      createdAt: f.createdAt.toISOString(),
      creator: f.creator,
    })),
  });
}
