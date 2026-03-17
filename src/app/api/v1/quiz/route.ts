import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const quizSchema = z.object({
  capital: z.enum(["under_25k", "25k_1l", "1l_5l", "5l_plus"]),
  availability: z.enum(["full_time", "partial", "no_job"]),
  risk: z.enum(["conservative", "moderate", "aggressive"]),
  holdingPeriod: z.enum(["same_day", "few_days", "few_weeks", "months"]),
  sectors: z.array(z.string()).min(1),
  experience: z.enum(["never", "lt_6m", "6m_plus", "2y_plus"]),
});

type QuizInput = z.infer<typeof quizSchema>;

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

/** Map holding period to preferred TipTimeframe values. */
function getPreferredTimeframes(holdingPeriod: string): string[] {
  switch (holdingPeriod) {
    case "same_day":
      return ["INTRADAY"];
    case "few_days":
      return ["SWING"];
    case "few_weeks":
      return ["SWING", "POSITIONAL"];
    case "months":
      return ["POSITIONAL", "LONG_TERM"];
    default:
      return [];
  }
}

/** Map quiz answers to creator specialization keywords for filtering. */
function getPreferredSpecializations(input: QuizInput): string[] {
  const specs: string[] = [];

  // Holding period
  const timeframes = getPreferredTimeframes(input.holdingPeriod);
  specs.push(...timeframes);

  // Capital size preferences
  if (input.capital === "under_25k" || input.capital === "25k_1l") {
    specs.push("SMALL_CAP", "MICRO_CAP");
  } else if (input.capital === "5l_plus") {
    specs.push("LARGE_CAP");
  }

  // Availability — only full-time watchers can comfortably follow intraday
  if (input.availability === "full_time") {
    specs.push("INTRADAY");
  }

  // Risk
  if (input.risk === "aggressive") {
    specs.push("OPTIONS", "FUTURES");
  }

  // Sectors
  for (const sector of input.sectors) {
    if (sector !== "no_preference") {
      specs.push(sector.toUpperCase());
    }
  }

  return [...new Set(specs)];
}

/**
 * Generate a human-readable explanation for why a creator was matched.
 */
function buildExplanation(
  input: QuizInput,
  creator: {
    specializations: string[];
    currentScore: { accuracyRate: number; rmtScore: number } | null;
    totalTips: number;
  },
  matchedSpecs: string[]
): string {
  const parts: string[] = [];

  if (matchedSpecs.length > 0) {
    parts.push(`Matches your interest in ${matchedSpecs.join(", ").toLowerCase()}.`);
  }

  if (input.risk === "conservative" && creator.currentScore) {
    const accPct = (creator.currentScore.accuracyRate * 100).toFixed(0);
    parts.push(`${accPct}% accuracy suits a conservative approach.`);
  }

  if (
    input.holdingPeriod === "same_day" &&
    creator.specializations.some((s) => s === "INTRADAY")
  ) {
    parts.push("Specializes in same-day intraday tips.");
  }

  if (
    input.holdingPeriod === "few_days" &&
    creator.specializations.some((s) => s === "SWING")
  ) {
    parts.push("Known for swing trade setups.");
  }

  if (creator.totalTips >= 200) {
    parts.push("Established track record with 200+ tips.");
  }

  if (parts.length === 0) {
    parts.push("Well-rounded creator with a solid overall track record.");
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = quizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid quiz answers",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const preferredSpecs = getPreferredSpecializations(input);

    // -----------------------------------------------------------------------
    // Build a query that prefers creators whose specializations overlap with
    // the user's derived preferences. We fetch a broader set, then sort in
    // application code so we can score by overlap + quality metrics.
    // -----------------------------------------------------------------------

    const where: Prisma.CreatorWhereInput = {
      isActive: true,
      totalTips: { gte: 5 },
    };

    // For conservative users, only show creators with good accuracy
    if (input.risk === "conservative") {
      where.currentScore = {
        accuracyRate: { gte: 0.55 },
      };
    }

    const creators = await db.creator.findMany({
      where,
      include: {
        currentScore: true,
      },
      orderBy: { totalTips: "desc" },
      take: 50, // fetch broad set, narrow below
    });

    // Score each creator by specialization overlap + quality
    const scored = creators.map((creator) => {
      const overlapping = preferredSpecs.filter((spec) =>
        creator.specializations.some(
          (cs) => cs.toUpperCase() === spec.toUpperCase()
        )
      );
      const overlapScore = overlapping.length;

      // Bonus for higher accuracy when user is conservative
      let qualityBonus = 0;
      if (creator.currentScore) {
        qualityBonus += creator.currentScore.rmtScore / 100; // 0-1
        if (input.risk === "conservative") {
          qualityBonus += creator.currentScore.accuracyRate * 0.5;
        }
      }

      // Bonus for volume
      const volumeBonus = Math.min(creator.totalTips / 500, 1) * 0.3;

      const totalScore = overlapScore * 2 + qualityBonus + volumeBonus;

      return {
        creator,
        overlapping,
        totalScore,
      };
    });

    // Sort descending by total score and pick top 5
    scored.sort((a, b) => b.totalScore - a.totalScore);
    const top5 = scored.slice(0, 5);

    const matchedCreators = top5.map(({ creator, overlapping }) => ({
      id: creator.id,
      slug: creator.slug,
      displayName: creator.displayName,
      profileImageUrl: creator.profileImageUrl,
      tier: creator.tier,
      totalTips: creator.totalTips,
      specializations: creator.specializations,
      rmtScore: creator.currentScore?.rmtScore ?? null,
      accuracyRate: creator.currentScore?.accuracyRate ?? null,
      explanation: buildExplanation(input, creator, overlapping),
    }));

    // Build summary text
    const timeframeLabel =
      input.holdingPeriod === "same_day"
        ? "intraday"
        : input.holdingPeriod === "few_days"
          ? "swing"
          : input.holdingPeriod === "few_weeks"
            ? "short-term positional"
            : "long-term positional";
    const summary = `We found creators who match your ${input.risk} risk profile and ${timeframeLabel} trading style.`;

    return NextResponse.json({
      success: true,
      data: {
        creators: matchedCreators,
        summary,
      },
    });
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
