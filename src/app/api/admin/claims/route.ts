import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/claims
 * List all claim requests with optional status filter.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const adminResult = await requireAdmin();
  if (isAuthError(adminResult)) return adminResult;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status")?.toUpperCase();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  try {
    const where = status && ["PENDING", "APPROVED", "REJECTED"].includes(status)
      ? { status: status as "PENDING" | "APPROVED" | "REJECTED" }
      : {};

    const [claims, total] = await Promise.all([
      db.claimRequest.findMany({
        where,
        include: {
          user: {
            select: { id: true, displayName: true, username: true, email: true, avatarUrl: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.claimRequest.count({ where }),
    ]);

    // Fetch creator info for each claim
    const creatorIds = [...new Set(claims.map((c) => c.creatorId))];
    const creators = await db.creator.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, slug: true, displayName: true, profileImageUrl: true, isClaimed: true },
    });
    const creatorMap = new Map(creators.map((c) => [c.id, c]));

    const data = claims.map((claim) => ({
      id: claim.id,
      status: claim.status,
      proofUrl: claim.proofUrl,
      verificationNote: claim.verificationNote,
      reviewNote: claim.reviewNote,
      createdAt: claim.createdAt.toISOString(),
      reviewedAt: claim.reviewedAt?.toISOString() ?? null,
      user: claim.user,
      creator: creatorMap.get(claim.creatorId) ?? null,
      reviewer: claim.reviewer,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { page, pageSize, total, hasMore: page * pageSize < total },
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch claims" },
      },
      { status: 500 }
    );
  }
}
