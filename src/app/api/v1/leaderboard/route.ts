import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leaderboardQuerySchema } from "@/lib/validators/query";
import { buildPaginationMeta, getPrismaSkipTake } from "@/lib/utils/pagination";
import { PAGINATION, CACHE_TTL } from "@/lib/constants";
import { cached } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimited = await rateLimit(request);
    if (rateLimited) return rateLimited;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = leaderboardQuerySchema.safeParse(searchParams);

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

    const { category, timeRange, minTips, sortBy, sortOrder, page, pageSize } =
      parsed.data;

    const effectivePageSize = pageSize ?? PAGINATION.LEADERBOARD_PAGE_SIZE;
    const cacheKey = `leaderboard:${category}:${timeRange}:${sortBy}:${sortOrder}:${minTips}:${page}:${effectivePageSize}`;

    const result = await cached(cacheKey, CACHE_TTL.LEADERBOARD, async () => {
      const paginationParams = { page, pageSize: effectivePageSize };
      const { skip, take } = getPrismaSkipTake(paginationParams);

      // Build where clause for creators
      const creatorWhere: Prisma.CreatorWhereInput = {
        isActive: true,
        totalTips: { gte: minTips },
        currentScore: { isNot: null },
      };

      // Filter by category (maps to specializations or tip timeframe focus)
      if (category !== "all") {
        const categoryMap: Record<string, string> = {
          intraday: "INTRADAY",
          swing: "SWING",
          positional: "POSITIONAL",
          long_term: "LONG_TERM",
          options: "OPTIONS",
          crypto: "CRYPTO",
        };
        const specialization = categoryMap[category];
        if (specialization) {
          creatorWhere.specializations = { has: specialization };
        }
      }

      // Determine sort field on the score relation
      const sortFieldMap: Record<string, string> = {
        rmt_score: "rmtScore",
        accuracy: "accuracyRate",
        return: "avgReturnPct",
        total_tips: "totalScoredTips",
      };
      const scoreSortField = sortFieldMap[sortBy] ?? "rmtScore";

      // Build the orderBy — sorting is on the related CreatorScore
      const orderBy: Prisma.CreatorOrderByWithRelationInput =
        sortBy === "total_tips"
          ? { totalTips: sortOrder }
          : { currentScore: { [scoreSortField]: sortOrder } };

      // Count total matching creators
      const total = await db.creator.count({ where: creatorWhere });

      // Fetch creators with scores
      const creators = await db.creator.findMany({
        where: creatorWhere,
        orderBy,
        skip,
        take,
        include: {
          currentScore: true,
        },
      });

      // Build leaderboard entries with rank
      const entries = creators.map((creator, index) => {
        const score = creator.currentScore;
        return {
          rank: skip + index + 1,
          creator: {
            id: creator.id,
            slug: creator.slug,
            displayName: creator.displayName,
            profileImageUrl: creator.profileImageUrl,
            tier: creator.tier,
            isVerified: creator.isVerified,
            totalTips: creator.totalTips,
            specializations: creator.specializations,
          },
          score: score
            ? {
                rmtScore: score.rmtScore,
                accuracyRate: score.accuracyRate,
                avgReturnPct: score.avgReturnPct,
                confidenceInterval: score.confidenceInterval,
              }
            : {
                rmtScore: 0,
                accuracyRate: 0,
                avgReturnPct: 0,
                confidenceInterval: 0,
              },
          totalTips: creator.totalTips,
          tier: creator.tier,
        };
      });

      return {
        entries,
        meta: buildPaginationMeta(page, effectivePageSize, total),
      };
    });

    return NextResponse.json({
      success: true,
      data: result.entries,
      meta: result.meta,
    });
  } catch (error) {
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
