import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { createClaimRequestSchema } from "@/lib/validators/claim";

/**
 * POST /api/v1/creators/:id/claim
 * Submit a claim request for an unclaimed creator profile.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userResult = await requireUser();
  if (isAuthError(userResult)) return userResult;

  const { id: creatorId } = await params;

  try {
    const body: unknown = await request.json();
    const parsed = createClaimRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid claim request",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check creator exists and is unclaimed
    const creator = await db.creator.findUnique({
      where: { id: creatorId },
      select: { id: true, isClaimed: true, isActive: true, displayName: true },
    });

    if (!creator || !creator.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "CREATOR_NOT_FOUND", message: "Creator not found" },
        },
        { status: 404 }
      );
    }

    if (creator.isClaimed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_CLAIMED",
            message: "This creator profile has already been claimed",
          },
        },
        { status: 409 }
      );
    }

    // Check if user already has a pending claim for this creator
    const existingClaim = await db.claimRequest.findUnique({
      where: {
        userId_creatorId: {
          userId: userResult.userId,
          creatorId,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_CLAIM",
            message: `You already have a ${existingClaim.status.toLowerCase()} claim for this creator`,
          },
        },
        { status: 409 }
      );
    }

    // Check if user already claimed another creator
    const user = await db.user.findUnique({
      where: { id: userResult.userId },
      select: { claimedCreatorId: true },
    });

    if (user?.claimedCreatorId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_CREATOR",
            message: "You have already claimed a creator profile",
          },
        },
        { status: 409 }
      );
    }

    const claim = await db.claimRequest.create({
      data: {
        userId: userResult.userId,
        creatorId,
        proofUrl: parsed.data.proofUrl,
        verificationNote: parsed.data.verificationNote ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: claim.id,
          status: claim.status,
          createdAt: claim.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating claim request:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create claim request" },
      },
      { status: 500 }
    );
  }
}
