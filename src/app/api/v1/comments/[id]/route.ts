import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCommentSchema } from "@/lib/validators/comment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
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

  const { id } = await context.params;
  const body: unknown = await request.json();
  const parsed = updateCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid data", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const comment = await db.comment.findUnique({
    where: { id },
    select: { userId: true, isDeleted: true },
  });

  if (!comment) {
    return NextResponse.json(
      { success: false, error: { code: "COMMENT_NOT_FOUND", message: "Comment not found" } },
      { status: 404 }
    );
  }

  if (comment.userId !== session.user.userId) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You can only edit your own comments" } },
      { status: 403 }
    );
  }

  if (comment.isDeleted) {
    return NextResponse.json(
      { success: false, error: { code: "COMMENT_DELETED", message: "Cannot edit a deleted comment" } },
      { status: 400 }
    );
  }

  const updated = await db.comment.update({
    where: { id },
    data: { content: parsed.data.content },
    select: { id: true, content: true, updatedAt: true },
  });

  return NextResponse.json({ success: true, data: updated });
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

  const { id } = await context.params;

  const comment = await db.comment.findUnique({
    where: { id },
    select: { userId: true, tipId: true, isDeleted: true },
  });

  if (!comment || comment.isDeleted) {
    return NextResponse.json(
      { success: false, error: { code: "COMMENT_NOT_FOUND", message: "Comment not found" } },
      { status: 404 }
    );
  }

  if (comment.userId !== session.user.userId) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You can only delete your own comments" } },
      { status: 403 }
    );
  }

  // Soft-delete to preserve thread structure
  await db.$transaction([
    db.comment.update({ where: { id }, data: { isDeleted: true, content: "[deleted]" } }),
    db.tip.update({ where: { id: comment.tipId }, data: { commentCount: { decrement: 1 } } }),
  ]);

  return NextResponse.json({ success: true, data: { deleted: true } });
}
