import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validators/query";
import { buildPaginationMeta, getPrismaSkipTake } from "@/lib/utils/pagination";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const creatorsQuerySchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
  tier: z
    .enum(["UNRATED", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"])
    .optional(),
  specialization: z.string().max(50).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = creatorsQuerySchema.safeParse(searchParams);

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

    const { search, tier, specialization, page, pageSize } = parsed.data;
    const { skip, take } = getPrismaSkipTake({ page, pageSize });

    const where: Prisma.CreatorWhereInput = { isActive: true };

    if (search) {
      where.displayName = { contains: search, mode: "insensitive" };
    }

    if (tier) {
      where.tier = tier;
    }

    if (specialization) {
      where.specializations = { has: specialization };
    }

    const [total, creators] = await Promise.all([
      db.creator.count({ where }),
      db.creator.findMany({
        where,
        orderBy: { totalTips: "desc" },
        skip,
        take,
        select: {
          id: true,
          slug: true,
          displayName: true,
          profileImageUrl: true,
          tier: true,
          isVerified: true,
          totalTips: true,
          specializations: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: creators,
      meta: buildPaginationMeta(page, pageSize, total),
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
