import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, isAuthError } from "@/lib/auth-helpers";
import { reviewClaimSchema } from "@/lib/validators/claim";
import { enqueueNotification } from "@/lib/queue";
import { sendClaimApprovedEmail, sendClaimRejectedEmail } from "@/lib/email";

/**
 * PATCH /api/admin/claims/:id
 * Approve or reject a claim request.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const adminResult = await requireAdmin();
  if (isAuthError(adminResult)) return adminResult;

  const { id: claimId } = await params;

  try {
    const body: unknown = await request.json();
    const parsed = reviewClaimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid review action",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const claim = await db.claimRequest.findUnique({
      where: { id: claimId },
      include: { user: { select: { id: true, claimedCreatorId: true } } },
    });

    if (!claim) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "CLAIM_NOT_FOUND", message: "Claim request not found" },
        },
        { status: 404 }
      );
    }

    if (claim.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_REVIEWED",
            message: `This claim has already been ${claim.status.toLowerCase()}`,
          },
        },
        { status: 409 }
      );
    }

    const { action, reviewNote } = parsed.data;
    const now = new Date();

    if (action === "APPROVED") {
      // Verify creator is still unclaimed
      const creator = await db.creator.findUnique({
        where: { id: claim.creatorId },
        select: { isClaimed: true, displayName: true },
      });

      if (creator?.isClaimed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_CLAIMED",
              message: "This creator profile has already been claimed by another user",
            },
          },
          { status: 409 }
        );
      }

      // Approve: update claim, creator, and user in a transaction
      await db.$transaction([
        db.claimRequest.update({
          where: { id: claimId },
          data: {
            status: "APPROVED",
            reviewNote: reviewNote ?? null,
            reviewedBy: adminResult.adminId,
            reviewedAt: now,
          },
        }),
        db.creator.update({
          where: { id: claim.creatorId },
          data: { isClaimed: true },
        }),
        db.user.update({
          where: { id: claim.userId },
          data: {
            claimedCreatorId: claim.creatorId,
            role: "CREATOR",
          },
        }),
      ]);

      // Send notification + email (fire and forget)
      enqueueNotification({
        type: "CLAIM_APPROVED",
        userId: claim.userId,
        claimId,
      }).catch(() => {});

      const user = await db.user.findUnique({
        where: { id: claim.userId },
        select: { email: true },
      });
      if (user && creator) {
        sendClaimApprovedEmail(user.email, creator.displayName).catch(() => {});
      }
    } else {
      // Reject: just update the claim
      await db.claimRequest.update({
        where: { id: claimId },
        data: {
          status: "REJECTED",
          reviewNote: reviewNote ?? null,
          reviewedBy: adminResult.adminId,
          reviewedAt: now,
        },
      });

      // Send notification + email (fire and forget)
      enqueueNotification({
        type: "CLAIM_REJECTED",
        userId: claim.userId,
        claimId,
      }).catch(() => {});

      const user = await db.user.findUnique({
        where: { id: claim.userId },
        select: { email: true },
      });
      const creatorForReject = await db.creator.findUnique({
        where: { id: claim.creatorId },
        select: { displayName: true },
      });
      if (user && creatorForReject) {
        sendClaimRejectedEmail(user.email, creatorForReject.displayName, reviewNote).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: claimId, status: action, reviewedAt: now.toISOString() },
    });
  } catch (error) {
    console.error("Error reviewing claim:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to review claim" },
      },
      { status: 500 }
    );
  }
}
