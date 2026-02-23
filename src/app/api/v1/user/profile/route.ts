import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validators/user";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          follows: true,
          savedTips: true,
          tipRatings: true,
          comments: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...user,
      followingCount: user._count.follows,
      savedCount: user._count.savedTips,
      ratingsCount: user._count.tipRatings,
      commentsCount: user._count.comments,
      createdAt: user.createdAt.toISOString(),
    },
  });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const body: unknown = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid profile data", details: parsed.error.flatten() },
      },
      { status: 400 }
    );
  }

  const updated = await db.user.update({
    where: { id: session.user.userId },
    data: parsed.data,
    select: { id: true, displayName: true, avatarUrl: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
