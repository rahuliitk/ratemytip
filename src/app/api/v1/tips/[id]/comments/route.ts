import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCommentSchema } from "@/lib/validators/comment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: tipId } = await context.params;
  const sortBy = request.nextUrl.searchParams.get("sort") ?? "newest";

  const orderBy = sortBy === "top"
    ? { upvotes: "desc" as const }
    : { createdAt: "desc" as const };

  // Fetch top-level comments
  const comments = await db.comment.findMany({
    where: { tipId, parentId: null, isHidden: false },
    orderBy,
    take: 50,
    include: {
      user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      replies: {
        where: { isHidden: false },
        orderBy: { createdAt: "asc" },
        take: 10,
        include: {
          user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        },
      },
    },
  });

  // Check current user's votes
  const session = await auth();
  let userVotes: Record<string, string> = {};
  if (session?.user?.userId) {
    const allCommentIds = comments.flatMap((c) => [c.id, ...c.replies.map((r) => r.id)]);
    const votes = await db.commentVote.findMany({
      where: { userId: session.user.userId, commentId: { in: allCommentIds } },
    });
    userVotes = Object.fromEntries(votes.map((v) => [v.commentId, v.voteType]));
  }

  const formatComment = (c: typeof comments[0]) => ({
    id: c.id,
    content: c.isDeleted ? "[deleted]" : c.content,
    isDeleted: c.isDeleted,
    upvotes: c.upvotes,
    downvotes: c.downvotes,
    isPinned: c.isPinned,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    user: c.user,
    userVote: userVotes[c.id] ?? null,
  });

  return NextResponse.json({
    success: true,
    data: comments.map((c) => ({
      ...formatComment(c),
      replies: c.replies.map((r) => ({
        ...formatComment(r as typeof comments[0]),
        replies: [],
      })),
    })),
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

  const { id: tipId } = await context.params;
  const body: unknown = await request.json();
  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid comment", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  // Verify tip exists
  const tip = await db.tip.findUnique({ where: { id: tipId }, select: { id: true } });
  if (!tip) {
    return NextResponse.json(
      { success: false, error: { code: "TIP_NOT_FOUND", message: "Tip not found" } },
      { status: 404 }
    );
  }

  // Verify parent comment exists if provided
  if (parsed.data.parentId) {
    const parent = await db.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { tipId: true },
    });
    if (!parent || parent.tipId !== tipId) {
      return NextResponse.json(
        { success: false, error: { code: "PARENT_NOT_FOUND", message: "Parent comment not found" } },
        { status: 404 }
      );
    }
  }

  const [comment] = await db.$transaction([
    db.comment.create({
      data: {
        tipId,
        userId: session.user.userId,
        content: parsed.data.content,
        parentId: parsed.data.parentId ?? null,
      },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
    }),
    db.tip.update({ where: { id: tipId }, data: { commentCount: { increment: 1 } } }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        isDeleted: false,
        upvotes: 0,
        downvotes: 0,
        isPinned: false,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: comment.user,
        userVote: null,
        replies: [],
      },
    },
    { status: 201 }
  );
}
