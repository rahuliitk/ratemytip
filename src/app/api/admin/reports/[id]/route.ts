import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";

/**
 * PATCH /api/admin/reports/:id
 * Update report status and optionally hide the comment.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const adminResult = await requireAdmin();
  if (isAuthError(adminResult)) return adminResult;

  const { id: reportId } = await params;

  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action as string | undefined;

    if (!action || !["DISMISS", "HIDE_COMMENT", "REVIEWED"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "action must be one of: DISMISS, HIDE_COMMENT, REVIEWED",
          },
        },
        { status: 400 }
      );
    }

    const report = await db.commentReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "REPORT_NOT_FOUND", message: "Report not found" },
        },
        { status: 404 }
      );
    }

    if (action === "DISMISS") {
      await db.commentReport.update({
        where: { id: reportId },
        data: { status: "DISMISSED" },
      });
    } else if (action === "HIDE_COMMENT") {
      await db.$transaction([
        db.commentReport.update({
          where: { id: reportId },
          data: { status: "ACTIONED" },
        }),
        db.comment.update({
          where: { id: report.commentId },
          data: { isHidden: true },
        }),
      ]);
    } else {
      // REVIEWED — mark as reviewed without further action
      await db.commentReport.update({
        where: { id: reportId },
        data: { status: "REVIEWED" },
      });
    }

    return NextResponse.json({
      success: true,
      data: { id: reportId, status: action === "DISMISS" ? "DISMISSED" : action === "HIDE_COMMENT" ? "ACTIONED" : "REVIEWED" },
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to update report" },
      },
      { status: 500 }
    );
  }
}
