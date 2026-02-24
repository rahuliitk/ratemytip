import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator, isAuthError } from "@/lib/auth-helpers";
import { z } from "zod";

const updateProfileSchema = z.object({
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  specializations: z
    .array(z.string().max(30))
    .max(10, "Maximum 10 specializations")
    .optional(),
  profileImageUrl: z.string().url("Must be a valid URL").nullable().optional(),
});

/**
 * GET /api/v1/creator-dashboard/profile
 * Returns the creator's profile data for editing.
 */
export async function GET(): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  try {
    const creator = await db.creator.findUnique({
      where: { id: creatorResult.creatorId },
      include: { platforms: true },
    });

    if (!creator) {
      return NextResponse.json(
        { success: false, error: { code: "CREATOR_NOT_FOUND", message: "Creator not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: creator.id,
        slug: creator.slug,
        displayName: creator.displayName,
        bio: creator.bio,
        profileImageUrl: creator.profileImageUrl,
        specializations: creator.specializations,
        tier: creator.tier,
        platforms: creator.platforms.map((p) => ({
          id: p.id,
          platform: p.platform,
          platformHandle: p.platformHandle,
          platformUrl: p.platformUrl,
          followerCount: p.followerCount,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch profile" } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/creator-dashboard/profile
 * Update the creator's profile (bio, specializations, avatar).
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  try {
    const body: unknown = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid profile data",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio ?? null;
    if (parsed.data.specializations !== undefined) updates.specializations = parsed.data.specializations;
    if (parsed.data.profileImageUrl !== undefined) updates.profileImageUrl = parsed.data.profileImageUrl;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, data: { message: "No changes" } });
    }

    const updated = await db.creator.update({
      where: { id: creatorResult.creatorId },
      data: updates,
      select: { id: true, bio: true, specializations: true, profileImageUrl: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update profile" } },
      { status: 500 }
    );
  }
}
