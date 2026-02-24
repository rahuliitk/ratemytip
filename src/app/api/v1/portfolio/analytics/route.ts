// GET /api/v1/portfolio/analytics — Detailed portfolio analytics (PRO+)
import { NextResponse } from "next/server";
import { requireSubscription, isAuthError } from "@/lib/auth-helpers";
import { getPortfolioAnalytics } from "@/lib/portfolio";

export async function GET(): Promise<NextResponse> {
  const result = await requireSubscription("PRO");
  if (isAuthError(result)) return result;

  const analytics = await getPortfolioAnalytics(result.userId);

  return NextResponse.json({ success: true, data: analytics });
}
