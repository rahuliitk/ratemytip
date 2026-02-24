import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/reports
 * List comment reports with optional status filter.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const adminResult = await requireAdmin();
  if (isAuthError(adminResult)) return adminResult;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status")?.toUpperCase();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  try {
    const validStatuses = ["PENDING_REPORT", "REVIEWED", "ACTIONED", "DISMISSED"];
    const where = status && validStatuses.includes(status)
      ? { status: status as "PENDING_REPORT" | "REVIEWED" | "ACTIONED" | "DISMISSED" }
      : {};

    const [reports, total] = await Promise.all([
      db.commentReport.findMany({
        where,
        include: {
          comment: {
            select: {
              id: true,
              content: true,
              isHidden: true,
              createdAt: true,
              user: { select: { id: true, displayName: true, username: true } },
              tip: { select: { id: true, stock: { select: { symbol: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.commentReport.count({ where }),
    ]);

    // Fetch reporter info
    const reporterIds = [...new Set(reports.map((r) => r.reporterId))];
    const reporters = await db.user.findMany({
      where: { id: { in: reporterIds } },
      select: { id: true, displayName: true, username: true },
    });
    const reporterMap = new Map(reporters.map((r) => [r.id, r]));

    const data = reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      reporter: reporterMap.get(report.reporterId) ?? null,
      comment: {
        id: report.comment.id,
        content: report.comment.content,
        isHidden: report.comment.isHidden,
        createdAt: report.comment.createdAt.toISOString(),
        author: report.comment.user,
        tipId: report.comment.tip.id,
        stockSymbol: report.comment.tip.stock.symbol,
      },
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { page, pageSize, total, hasMore: page * pageSize < total },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch reports" },
      },
      { status: 500 }
    );
  }
}
