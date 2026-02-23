import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportSchema } from "@/lib/validators/comment";

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
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid report", details: parsed.error.flatten() } },
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

  await db.commentReport.create({
    data: {
      commentId,
      reporterId: session.user.userId,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
    },
  });

  return NextResponse.json({ success: true, data: { reported: true } }, { status: 201 });
}
