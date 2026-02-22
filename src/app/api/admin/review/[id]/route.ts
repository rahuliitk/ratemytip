import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { reviewTipSchema } from "@/lib/validators/admin";
import { calculateTipContentHash } from "@/lib/utils/crypto";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const authResult = await requireAdmin();
    if (isAuthError(authResult)) return authResult;
    const { adminId } = authResult;

    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = reviewTipSchema.safeParse(body);

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

    const { action, note, edits } = parsed.data;

    // Verify the tip exists and is pending review
    const tip = await db.tip.findUnique({
      where: { id },
      include: { stock: { select: { symbol: true } } },
    });

    if (!tip) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TIP_NOT_FOUND",
            message: `Tip not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    if (tip.reviewStatus !== "PENDING" && tip.reviewStatus !== "NEEDS_EDIT") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TIP_ALREADY_REVIEWED",
            message: `Tip has already been reviewed with status: ${tip.reviewStatus}`,
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === "approve") {
      // Approve the tip: set reviewStatus to MANUALLY_APPROVED, status to ACTIVE
      const updatedTip = await db.$transaction(async (tx) => {
        const updated = await tx.tip.update({
          where: { id },
          data: {
            reviewStatus: "MANUALLY_APPROVED",
            status: "ACTIVE",
            reviewedAt: now,
            reviewNote: note ?? null,
          },
        });

        await tx.reviewAction.create({
          data: {
            tipId: id,
            adminId,
            action: "APPROVED",
            note: note ?? null,
          },
        });

        return updated;
      });

      return NextResponse.json({ success: true, data: { id: updatedTip.id, reviewStatus: updatedTip.reviewStatus, status: updatedTip.status } });
    }

    if (action === "reject") {
      // Reject the tip
      const updatedTip = await db.$transaction(async (tx) => {
        const updated = await tx.tip.update({
          where: { id },
          data: {
            reviewStatus: "REJECTED",
            status: "REJECTED",
            reviewedAt: now,
            reviewNote: note ?? null,
          },
        });

        await tx.reviewAction.create({
          data: {
            tipId: id,
            adminId,
            action: "REJECTED",
            note: note ?? null,
          },
        });

        return updated;
      });

      return NextResponse.json({ success: true, data: { id: updatedTip.id, reviewStatus: updatedTip.reviewStatus, status: updatedTip.status } });
    }

    if (action === "edit_and_approve") {
      if (!edits) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Edits are required for edit_and_approve action",
            },
          },
          { status: 400 }
        );
      }

      const updatedTip = await db.$transaction(async (tx) => {
        // Log amendments for each edited field
        const editableFields = [
          "entryPrice",
          "target1",
          "target2",
          "target3",
          "stopLoss",
          "timeframe",
          "stockId",
        ] as const;

        for (const field of editableFields) {
          const newValue = edits[field];
          if (newValue !== undefined) {
            const oldValue = tip[field];
            await tx.tipAmendment.create({
              data: {
                tipId: id,
                field,
                oldValue: String(oldValue ?? "null"),
                newValue: String(newValue),
                reason: note ?? "Edited during review",
              },
            });
          }
        }

        // Build update data from edits
        const updateData: Record<string, unknown> = {
          reviewStatus: "MANUALLY_APPROVED",
          status: "ACTIVE",
          reviewedAt: now,
          reviewNote: note ?? null,
        };

        if (edits.entryPrice !== undefined) updateData.entryPrice = edits.entryPrice;
        if (edits.target1 !== undefined) updateData.target1 = edits.target1;
        if (edits.target2 !== undefined) updateData.target2 = edits.target2;
        if (edits.target3 !== undefined) updateData.target3 = edits.target3;
        if (edits.stopLoss !== undefined) updateData.stopLoss = edits.stopLoss;
        if (edits.timeframe !== undefined) updateData.timeframe = edits.timeframe;
        if (edits.stockId !== undefined) updateData.stockId = edits.stockId;

        // Recalculate content hash after edits
        const mergedTip = {
          creatorId: tip.creatorId,
          stockSymbol: edits.stockId ? "UPDATED" : tip.stock.symbol,
          direction: tip.direction,
          entryPrice: edits.entryPrice ?? tip.entryPrice,
          target1: edits.target1 ?? tip.target1,
          target2: edits.target2 ?? tip.target2 ?? null,
          target3: edits.target3 ?? tip.target3 ?? null,
          stopLoss: edits.stopLoss ?? tip.stopLoss,
          timeframe: edits.timeframe ?? tip.timeframe,
          tipTimestamp: tip.tipTimestamp,
        };

        // If stockId was updated, fetch the new stock symbol for the hash
        if (edits.stockId) {
          const newStock = await tx.stock.findUnique({
            where: { id: edits.stockId },
            select: { symbol: true },
          });
          if (newStock) {
            mergedTip.stockSymbol = newStock.symbol;
          }
        }

        updateData.contentHash = calculateTipContentHash(mergedTip);

        const updated = await tx.tip.update({
          where: { id },
          data: updateData,
        });

        await tx.reviewAction.create({
          data: {
            tipId: id,
            adminId,
            action: "EDITED_AND_APPROVED",
            note: note ?? null,
          },
        });

        return updated;
      });

      return NextResponse.json({ success: true, data: { id: updatedTip.id, reviewStatus: updatedTip.reviewStatus, status: updatedTip.status } });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_ACTION",
          message: `Unknown review action: ${action}`,
        },
      },
      { status: 400 }
    );
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
