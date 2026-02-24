import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator, isAuthError } from "@/lib/auth-helpers";
import { updateDirectTipSchema } from "@/lib/validators/direct-tip";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/creator-dashboard/tips/:id
 * Get a single tip detail (must belong to the authenticated creator).
 */
export async function GET(
  _request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  const { id: tipId } = await params;

  try {
    const tip = await db.tip.findUnique({
      where: { id: tipId },
      include: {
        stock: { select: { symbol: true, name: true } },
        amendments: { orderBy: { amendedAt: "desc" } },
        explanation: true,
      },
    });

    if (!tip || tip.creatorId !== creatorResult.creatorId) {
      return NextResponse.json(
        { success: false, error: { code: "TIP_NOT_FOUND", message: "Tip not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tip });
  } catch (error) {
    console.error("Error fetching tip:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch tip" } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/creator-dashboard/tips/:id
 * Update limited fields of a pending tip (rationale, conviction, sourceUrl only).
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
    const parsed = updateDirectTipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update data",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const tip = await db.tip.findUnique({
      where: { id: tipId },
      select: { id: true, creatorId: true, status: true, rationale: true, conviction: true, sourceUrl: true },
    });

    if (!tip || tip.creatorId !== creatorResult.creatorId) {
      return NextResponse.json(
        { success: false, error: { code: "TIP_NOT_FOUND", message: "Tip not found" } },
        { status: 404 }
      );
    }

    if (tip.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TIP_NOT_EDITABLE",
            message: "Only pending tips can be edited",
          },
        },
        { status: 409 }
      );
    }

    // Build update data and amendments
    const updates: Record<string, unknown> = {};
    const amendments: Array<{ field: string; oldValue: string; newValue: string; reason: string }> = [];

    if (parsed.data.rationale !== undefined && parsed.data.rationale !== tip.rationale) {
      amendments.push({
        field: "rationale",
        oldValue: tip.rationale ?? "",
        newValue: parsed.data.rationale ?? "",
        reason: "Creator edit",
      });
      updates.rationale = parsed.data.rationale ?? null;
    }

    if (parsed.data.conviction !== undefined && parsed.data.conviction !== tip.conviction) {
      amendments.push({
        field: "conviction",
        oldValue: tip.conviction,
        newValue: parsed.data.conviction,
        reason: "Creator edit",
      });
      updates.conviction = parsed.data.conviction;
    }

    if (parsed.data.sourceUrl !== undefined && parsed.data.sourceUrl !== tip.sourceUrl) {
      amendments.push({
        field: "sourceUrl",
        oldValue: tip.sourceUrl ?? "",
        newValue: parsed.data.sourceUrl ?? "",
        reason: "Creator edit",
      });
      updates.sourceUrl = parsed.data.sourceUrl ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, data: { id: tipId, message: "No changes" } });
    }

    await db.$transaction([
      db.tip.update({ where: { id: tipId }, data: updates }),
      ...amendments.map((a) =>
        db.tipAmendment.create({
          data: { tipId, ...a },
        })
      ),
    ]);

    return NextResponse.json({ success: true, data: { id: tipId, updated: Object.keys(updates) } });
  } catch (error) {
    console.error("Error updating tip:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update tip" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/creator-dashboard/tips/:id
 * Delete a pending tip (only before approval).
 */
export async function DELETE(
  _request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  const { id: tipId } = await params;

  try {
    const tip = await db.tip.findUnique({
      where: { id: tipId },
      select: { id: true, creatorId: true, status: true },
    });

    if (!tip || tip.creatorId !== creatorResult.creatorId) {
      return NextResponse.json(
        { success: false, error: { code: "TIP_NOT_FOUND", message: "Tip not found" } },
        { status: 404 }
      );
    }

    if (tip.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TIP_NOT_DELETABLE",
            message: "Only pending tips can be deleted",
          },
        },
        { status: 409 }
      );
    }

    await db.tip.delete({ where: { id: tipId } });

    return NextResponse.json({ success: true, data: { id: tipId, deleted: true } });
  } catch (error) {
    console.error("Error deleting tip:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete tip" } },
      { status: 500 }
    );
  }
}
