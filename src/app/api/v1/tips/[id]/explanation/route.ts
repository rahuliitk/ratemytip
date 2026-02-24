import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator, isAuthError } from "@/lib/auth-helpers";
import { createExplanationSchema } from "@/lib/validators/explanation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/tips/:id/explanation
 * Fetch the explanation for a tip (public).
 */
export async function GET(
  _request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: tipId } = await params;

  try {
    const explanation = await db.tipExplanation.findUnique({
      where: { tipId },
    });

    if (!explanation) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "No explanation found for this tip" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: explanation.id,
        tipId: explanation.tipId,
        content: explanation.content,
        imageUrls: explanation.imageUrls,
        version: explanation.version,
        createdAt: explanation.createdAt.toISOString(),
        updatedAt: explanation.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching explanation:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch explanation" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/tips/:id/explanation
 * Create an explanation (creator only, must own the tip).
 */
export async function POST(
  request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  const { id: tipId } = await params;

  try {
    const body: unknown = await request.json();
    const parsed = createExplanationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid explanation", details: parsed.error.flatten() },
        },
        { status: 400 }
      );
    }

    // Verify the tip belongs to this creator
    const tip = await db.tip.findUnique({
      where: { id: tipId },
      select: { id: true, creatorId: true },
    });

    if (!tip || tip.creatorId !== creatorResult.creatorId) {
      return NextResponse.json(
        { success: false, error: { code: "TIP_NOT_FOUND", message: "Tip not found or not owned by you" } },
        { status: 404 }
      );
    }

    // Check if explanation already exists
    const existing = await db.tipExplanation.findUnique({
      where: { tipId },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_EXISTS", message: "Explanation already exists. Use PATCH to update." } },
        { status: 409 }
      );
    }

    const explanation = await db.tipExplanation.create({
      data: {
        tipId,
        creatorId: creatorResult.creatorId,
        content: parsed.data.content,
        imageUrls: parsed.data.imageUrls,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: explanation.id,
          tipId: explanation.tipId,
          createdAt: explanation.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating explanation:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create explanation" } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/tips/:id/explanation
 * Update an existing explanation (creator only).
 */
export async function PATCH(
  request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  const { id: tipId } = await params;

  try {
    const body: unknown = await request.json();
    const parsed = createExplanationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid explanation", details: parsed.error.flatten() },
        },
        { status: 400 }
      );
    }

    const explanation = await db.tipExplanation.findUnique({
      where: { tipId },
      select: { id: true, creatorId: true, version: true },
    });

    if (!explanation) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "No explanation found. Use POST to create." } },
        { status: 404 }
      );
    }

    if (explanation.creatorId !== creatorResult.creatorId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "You do not own this explanation" } },
        { status: 403 }
      );
    }

    const updated = await db.tipExplanation.update({
      where: { tipId },
      data: {
        content: parsed.data.content,
        imageUrls: parsed.data.imageUrls,
        version: explanation.version + 1,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        version: updated.version,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating explanation:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update explanation" } },
      { status: 500 }
    );
  }
}
