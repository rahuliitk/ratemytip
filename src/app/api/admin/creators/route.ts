import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validators/query";
import { updateCreatorSchema } from "@/lib/validators/creator";
import { buildPaginationMeta, getPrismaSkipTake } from "@/lib/utils/pagination";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const adminCreatorsQuerySchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  tier: z
    .enum(["UNRATED", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"])
    .optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) return authResult;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = adminCreatorsQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { search, isActive, tier, page, pageSize } = parsed.data;
    const { skip, take } = getPrismaSkipTake({ page, pageSize });

    const where: Prisma.CreatorWhereInput = {};

    if (search) {
      where.displayName = { contains: search, mode: "insensitive" };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (tier) {
      where.tier = tier;
    }

    const [total, creators] = await Promise.all([
      db.creator.count({ where }),
      db.creator.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          platforms: {
            select: {
              id: true,
              platform: true,
              platformHandle: true,
              platformUrl: true,
              followerCount: true,
              isActive: true,
              lastScrapedAt: true,
            },
          },
          currentScore: {
            select: {
              rmtScore: true,
              accuracyRate: true,
              totalScoredTips: true,
            },
          },
          _count: {
            select: {
              moderationActions: true,
            },
          },
        },
      }),
    ]);

    const data = creators.map((creator) => ({
      id: creator.id,
      slug: creator.slug,
      displayName: creator.displayName,
      bio: creator.bio,
      profileImageUrl: creator.profileImageUrl,
      isVerified: creator.isVerified,
      isClaimed: creator.isClaimed,
      isActive: creator.isActive,
      tier: creator.tier,
      specializations: creator.specializations,
      totalTips: creator.totalTips,
      activeTips: creator.activeTips,
      completedTips: creator.completedTips,
      followerCount: creator.followerCount,
      createdAt: creator.createdAt.toISOString(),
      updatedAt: creator.updatedAt.toISOString(),
      platforms: creator.platforms.map((p) => ({
        ...p,
        lastScrapedAt: p.lastScrapedAt?.toISOString() ?? null,
      })),
      score: creator.currentScore
        ? {
            rmtScore: creator.currentScore.rmtScore,
            accuracyRate: creator.currentScore.accuracyRate,
            totalScoredTips: creator.currentScore.totalScoredTips,
          }
        : null,
      moderationActionCount: creator._count.moderationActions,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: buildPaginationMeta(page, pageSize, total),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) return authResult;

    const body: unknown = await request.json();

    // Expect { id: string, ...updateFields }
    const idSchema = z.object({ id: z.string().cuid() });
    const idParsed = idSchema.safeParse(body);

    if (!idParsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Creator id is required",
            details: idParsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const updateParsed = updateCreatorSchema.safeParse(body);
    if (!updateParsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update data",
            details: updateParsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { id } = idParsed.data;
    const updateData = updateParsed.data;

    const creator = await db.creator.findUnique({ where: { id } });
    if (!creator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CREATOR_NOT_FOUND",
            message: `Creator not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    const updated = await db.creator.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        slug: updated.slug,
        displayName: updated.displayName,
        bio: updated.bio,
        isActive: updated.isActive,
        specializations: updated.specializations,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
