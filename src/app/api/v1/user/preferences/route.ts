// GET/POST /api/v1/user/preferences — User preference CRUD
import { NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { userPreferenceSchema } from "@/lib/validators/preference";
import { redis } from "@/lib/redis";

export async function GET(): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;

  const prefs = await db.userPreference.findUnique({
    where: { userId: result.userId },
  });

  return NextResponse.json({
    success: true,
    data: prefs ?? {
      preferredTimeframes: [],
      preferredAssetClasses: [],
      riskTolerance: "MODERATE",
      minCreatorScore: null,
      preferredSectors: [],
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;

  const body: unknown = await request.json();
  const parsed = userPreferenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const prefs = await db.userPreference.upsert({
    where: { userId: result.userId },
    create: { userId: result.userId, ...parsed.data },
    update: parsed.data,
  });

  // Invalidate cached recommendations for this user
  try {
    await redis.del(`reco:tips:${result.userId}`);
    await redis.del(`reco:creators:${result.userId}`);
  } catch {
    // Redis may be unavailable in dev
  }

  return NextResponse.json({ success: true, data: prefs });
}
