import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";
import { reportsQuerySchema } from "@/lib/validators/admin";

/**
 * GET /api/admin/reports
 * List comment reports with optional status filter.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const adminResult = await requireAdmin();
  if (isAuthError(adminResult)) return adminResult;

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = reportsQuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid query parameters", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const { status, page, pageSize } = parsed.data;

  try {
    const where = status ? { status } : {};

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
