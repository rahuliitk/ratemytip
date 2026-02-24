// POST /api/v1/portfolio/entries — Add a tip to portfolio
import { NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { addPortfolioEntrySchema } from "@/lib/validators/portfolio";
import { SUBSCRIPTION_FEATURES } from "@/lib/constants";
import type { SubscriptionTier } from "@prisma/client";

export async function POST(request: Request): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;

  const body: unknown = await request.json();
  const parsed = addPortfolioEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  // Get or create portfolio
  let portfolio = await db.portfolio.findFirst({ where: { userId: result.userId } });
  if (!portfolio) {
    portfolio = await db.portfolio.create({
      data: { userId: result.userId, name: "My Portfolio" },
    });
  }

  // Check tier limits
  const user = await db.user.findUniqueOrThrow({
    where: { id: result.userId },
    select: { subscriptionTier: true },
  });
  const features = SUBSCRIPTION_FEATURES[user.subscriptionTier as SubscriptionTier] ?? SUBSCRIPTION_FEATURES.FREE;
  const currentCount = await db.portfolioEntry.count({
    where: { portfolioId: portfolio.id, status: "OPEN" },
  });
  if (currentCount >= features.maxPortfolioEntries) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PORTFOLIO_LIMIT_REACHED",
          message: `Your ${user.subscriptionTier} plan allows ${features.maxPortfolioEntries} open positions. Upgrade to add more.`,
        },
      },
      { status: 402 }
    );
  }

  // Verify tip exists and is active
  const tip = await db.tip.findUnique({
    where: { id: parsed.data.tipId },
    select: { entryPrice: true, status: true },
  });
  if (!tip) {
    return NextResponse.json(
      { success: false, error: { code: "TIP_NOT_FOUND", message: "Tip not found" } },
      { status: 404 }
    );
  }

  // Check for duplicate
  const existing = await db.portfolioEntry.findUnique({
    where: { portfolioId_tipId: { portfolioId: portfolio.id, tipId: parsed.data.tipId } },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: "DUPLICATE_ENTRY", message: "This tip is already in your portfolio" } },
      { status: 409 }
    );
  }

  const entry = await db.portfolioEntry.create({
    data: {
      portfolioId: portfolio.id,
      tipId: parsed.data.tipId,
      entryPrice: tip.entryPrice,
      quantity: parsed.data.quantity,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json({ success: true, data: entry }, { status: 201 });
}
