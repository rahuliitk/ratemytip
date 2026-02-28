import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) return authResult;

    const { id } = await context.params;

    const job = await db.scrapeJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SCRAPE_JOB_NOT_FOUND",
            message: `Scrape job not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    const data = {
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
    };

    return NextResponse.json({ success: true, data });
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
