import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { followSchema } from "@/lib/validators/follow";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const body: unknown = await request.json();
  const parsed = followSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid data", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const { creatorId } = parsed.data;

  // Check creator exists
  const creator = await db.creator.findUnique({ where: { id: creatorId }, select: { id: true } });
  if (!creator) {
    return NextResponse.json(
      { success: false, error: { code: "CREATOR_NOT_FOUND", message: "Creator not found" } },
      { status: 404 }
    );
  }

  // Check if already following
  const existing = await db.follow.findUnique({
    where: { userId_creatorId: { userId: session.user.userId, creatorId } },
  });

  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: "ALREADY_FOLLOWING", message: "Already following this creator" } },
      { status: 409 }
    );
  }

  await db.$transaction([
    db.follow.create({ data: { userId: session.user.userId, creatorId } }),
    db.creator.update({ where: { id: creatorId }, data: { internalFollows: { increment: 1 } } }),
  ]);

  return NextResponse.json({ success: true, data: { following: true } }, { status: 201 });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { creatorId } = await request.json() as { creatorId: string };

  const existing = await db.follow.findUnique({
    where: { userId_creatorId: { userId: session.user.userId, creatorId } },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOLLOWING", message: "Not following this creator" } },
      { status: 404 }
    );
  }

  await db.$transaction([
    db.follow.delete({ where: { id: existing.id } }),
    db.creator.update({ where: { id: creatorId }, data: { internalFollows: { decrement: 1 } } }),
  ]);

  return NextResponse.json({ success: true, data: { following: false } });
}
