import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validators/query";
import { triggerScrapeSchema } from "@/lib/validators/admin";
import { buildPaginationMeta, getPrismaSkipTake } from "@/lib/utils/pagination";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { scrapeTwitterQueue, scrapeYoutubeQueue } from "@/lib/queue/queues";

const scraperQuerySchema = paginationSchema.extend({
  platform: z.enum(["TWITTER", "YOUTUBE", "WEBSITE"]).optional(),
  status: z.enum(["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) return authResult;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = scraperQuerySchema.safeParse(searchParams);

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

    const { platform, status, page, pageSize } = parsed.data;
    const { skip, take } = getPrismaSkipTake({ page, pageSize });

    const where: Prisma.ScrapeJobWhereInput = {};

    if (platform) {
      where.platform = platform;
    }

    if (status) {
      where.status = status;
    }

    const [total, jobs] = await Promise.all([
      db.scrapeJob.count({ where }),
      db.scrapeJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    const data = jobs.map((job) => ({
      id: job.id,
      platform: job.platform,
      jobType: job.jobType,
      status: job.status,
      creatorPlatformId: job.creatorPlatformId,
      postsFound: job.postsFound,
      tipsExtracted: job.tipsExtracted,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      metadata: job.metadata,
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) return authResult;
    const { adminId } = authResult;

    const body: unknown = await request.json();
    const parsed = triggerScrapeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { platform, type, creatorId } = parsed.data;

    // Map the trigger type to ScrapeJobType enum
    const jobTypeMap: Record<string, "FULL_SCRAPE" | "INCREMENTAL" | "SINGLE_CREATOR"> = {
      FULL: "FULL_SCRAPE",
      INCREMENTAL: "INCREMENTAL",
    };

    let jobType = jobTypeMap[type] ?? "FULL_SCRAPE";
    let creatorPlatformId: string | null = null;

    // If a specific creator is targeted, find their platform record
    if (creatorId) {
      jobType = "SINGLE_CREATOR";
      const creatorPlatform = await db.creatorPlatform.findFirst({
        where: {
          creatorId,
          platform,
          isActive: true,
        },
      });

      if (!creatorPlatform) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CREATOR_PLATFORM_NOT_FOUND",
              message: `No active ${platform} account found for creator: ${creatorId}`,
            },
          },
          { status: 404 }
        );
      }

      creatorPlatformId = creatorPlatform.id;
    }

    // Create the scrape job record
    const job = await db.scrapeJob.create({
      data: {
        platform,
        jobType,
        status: "QUEUED",
        creatorPlatformId,
        metadata: {
          triggeredBy: adminId,
          triggerType: "manual",
        },
      },
    });

    // Enqueue a BullMQ job for the appropriate platform queue
    try {
      const queueMap: Record<string, typeof scrapeTwitterQueue | typeof scrapeYoutubeQueue> = {
        TWITTER: scrapeTwitterQueue,
        YOUTUBE: scrapeYoutubeQueue,
      };
      const queue = queueMap[platform];
      if (queue) {
        await queue.add(
          `${jobType}-${job.id}`,
          {
            jobId: job.id,
            platform,
            jobType,
            creatorPlatformId,
          },
          { jobId: job.id }
        );
      }
    } catch {
      // Redis/queue unavailable — DB record is the source of truth
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: job.id,
          platform: job.platform,
          jobType: job.jobType,
          status: job.status,
          createdAt: job.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
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
