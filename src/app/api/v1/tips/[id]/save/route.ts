import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
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

  // Check tip exists
  const tip = await db.tip.findUnique({ where: { id: tipId }, select: { id: true } });
  if (!tip) {
    return NextResponse.json(
      { success: false, error: { code: "TIP_NOT_FOUND", message: "Tip not found" } },
      { status: 404 }
    );
  }

  const existing = await db.savedTip.findUnique({
    where: { tipId_userId: { tipId, userId: session.user.userId } },
  });

  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: "ALREADY_SAVED", message: "Tip already saved" } },
      { status: 409 }
    );
  }

  await db.$transaction([
    db.savedTip.create({ data: { tipId, userId: session.user.userId } }),
    db.tip.update({ where: { id: tipId }, data: { saveCount: { increment: 1 } } }),
  ]);

  return NextResponse.json({ success: true, data: { saved: true } }, { status: 201 });
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

  const existing = await db.savedTip.findUnique({
    where: { tipId_userId: { tipId, userId: session.user.userId } },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_SAVED", message: "Tip not saved" } },
      { status: 404 }
    );
  }

  await db.$transaction([
    db.savedTip.delete({ where: { id: existing.id } }),
    db.tip.update({ where: { id: tipId }, data: { saveCount: { decrement: 1 } } }),
  ]);

  return NextResponse.json({ success: true, data: { saved: false } });
}
