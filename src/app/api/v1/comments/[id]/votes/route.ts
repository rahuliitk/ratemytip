import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { voteSchema } from "@/lib/validators/comment";

interface RouteContext {
  params: Promise<{ id: string }>;
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

  const { id: commentId } = await context.params;
  const body: unknown = await request.json();
  const parsed = voteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid vote", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const comment = await db.comment.findUnique({ where: { id: commentId }, select: { id: true } });
  if (!comment) {
    return NextResponse.json(
      { success: false, error: { code: "COMMENT_NOT_FOUND", message: "Comment not found" } },
      { status: 404 }
    );
  }

  const existing = await db.commentVote.findUnique({
    where: { commentId_userId: { commentId, userId: session.user.userId } },
  });

  if (existing) {
    if (existing.voteType === parsed.data.voteType) {
      // Same vote type — remove the vote
      const field = existing.voteType === "UPVOTE" ? "upvotes" : "downvotes";
      await db.$transaction([
        db.commentVote.delete({ where: { id: existing.id } }),
        db.comment.update({ where: { id: commentId }, data: { [field]: { decrement: 1 } } }),
      ]);
      return NextResponse.json({ success: true, data: { voteType: null } });
    } else {
      // Switch vote — decrement old, increment new
      const oldField = existing.voteType === "UPVOTE" ? "upvotes" : "downvotes";
      const newField = parsed.data.voteType === "UPVOTE" ? "upvotes" : "downvotes";
      await db.$transaction([
        db.commentVote.update({ where: { id: existing.id }, data: { voteType: parsed.data.voteType } }),
        db.comment.update({
          where: { id: commentId },
          data: { [oldField]: { decrement: 1 }, [newField]: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ success: true, data: { voteType: parsed.data.voteType } });
    }
  }

  // New vote
  const field = parsed.data.voteType === "UPVOTE" ? "upvotes" : "downvotes";
  await db.$transaction([
    db.commentVote.create({ data: { commentId, userId: session.user.userId, voteType: parsed.data.voteType } }),
    db.comment.update({ where: { id: commentId }, data: { [field]: { increment: 1 } } }),
  ]);

  return NextResponse.json({ success: true, data: { voteType: parsed.data.voteType } }, { status: 201 });
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

  const { id: commentId } = await context.params;

  const existing = await db.commentVote.findUnique({
    where: { commentId_userId: { commentId, userId: session.user.userId } },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NO_VOTE", message: "No vote to remove" } },
      { status: 404 }
    );
  }

  const field = existing.voteType === "UPVOTE" ? "upvotes" : "downvotes";
  await db.$transaction([
    db.commentVote.delete({ where: { id: existing.id } }),
    db.comment.update({ where: { id: commentId }, data: { [field]: { decrement: 1 } } }),
  ]);

  return NextResponse.json({ success: true, data: { voteType: null } });
}
