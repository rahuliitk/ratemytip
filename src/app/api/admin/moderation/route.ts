import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validators/query";
import { buildPaginationMeta, getPrismaSkipTake } from "@/lib/utils/pagination";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const moderationQuerySchema = paginationSchema.extend({
  creatorId: z.string().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Unauthorized" },
        },
        { status: 401 }
      );
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = moderationQuerySchema.safeParse(searchParams);

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

    const { creatorId, page, pageSize } = parsed.data;
    const { skip, take } = getPrismaSkipTake({ page, pageSize });

    const where: Prisma.ModerationActionWhereInput = {};

    if (creatorId) {
      where.creatorId = creatorId;
    }

    const [total, actions] = await Promise.all([
      db.moderationAction.count({ where }),
      db.moderationAction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          creator: {
            select: {
              id: true,
              slug: true,
              displayName: true,
              profileImageUrl: true,
              tier: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const data = actions.map((action) => ({
      id: action.id,
      creatorId: action.creatorId,
      adminId: action.adminId,
      action: action.action,
      reason: action.reason,
      createdAt: action.createdAt.toISOString(),
      creator: action.creator,
      admin: {
        id: action.admin.id,
        name: action.admin.name,
        email: action.admin.email,
        role: action.admin.role,
      },
    }));

    return NextResponse.json({
      success: true,
      data,
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
