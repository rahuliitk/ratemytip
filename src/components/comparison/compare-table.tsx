import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompareTableProps {
  readonly creatorIds: string[];
}

interface ComparedCreator {
  id: string;
  slug: string;
  displayName: string;
  profileImageUrl: string | null;
  tier: string;
  totalTips: number;
  specializations: string[];
  rmtScore: number | null;
  confidenceInterval: number | null;
  accuracyRate: number | null;
  avgReturnPct: number | null;
  avgStopLossDistance: number | null;
  preferredTimeframe: string | null;
}

interface ComparisonRow {
  label: string;
  values: (string | React.ReactElement)[];
  highlight?: "higher_better" | "lower_better";
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getCreatorsForComparison(
  ids: string[]
): Promise<ComparedCreator[]> {
  const creators = await db.creator.findMany({
    where: { id: { in: ids }, isActive: true },
    include: {
      currentScore: true,
      tips: {
        where: {
          status: { not: "REJECTED" },
          reviewStatus: { in: ["AUTO_APPROVED", "MANUALLY_APPROVED"] },
        },
        select: {
          timeframe: true,
          entryPrice: true,
          stopLoss: true,
          direction: true,
        },
      },
    },
  });

  // Preserve the order requested by the caller
  const creatorMap = new Map(creators.map((c) => [c.id, c]));

  return ids
    .map((id) => creatorMap.get(id))
    .filter((c): c is NonNullable<typeof c> => c != null)
    .map((creator) => {
      // Determine preferred timeframe from most common tip timeframe
      const timeframeCounts: Record<string, number> = {};
      for (const tip of creator.tips) {
        timeframeCounts[tip.timeframe] =
          (timeframeCounts[tip.timeframe] ?? 0) + 1;
      }
      let preferredTimeframe: string | null = null;
      let maxCount = 0;
      for (const [tf, count] of Object.entries(timeframeCounts)) {
        if (count > maxCount) {
          maxCount = count;
          preferredTimeframe = tf;
        }
      }

      // Calculate average stop loss distance as % from entry
      let avgStopLossDistance: number | null = null;
      const validTips = creator.tips.filter(
        (t) => t.entryPrice > 0 && t.stopLoss > 0
      );
      if (validTips.length > 0) {
        const total = validTips.reduce((sum, t) => {
          const distance =
            t.direction === "BUY"
              ? ((t.entryPrice - t.stopLoss) / t.entryPrice) * 100
              : ((t.stopLoss - t.entryPrice) / t.entryPrice) * 100;
          return sum + Math.abs(distance);
        }, 0);
        avgStopLossDistance = total / validTips.length;
      }

      return {
        id: creator.id,
        slug: creator.slug,
        displayName: creator.displayName,
        profileImageUrl: creator.profileImageUrl,
        tier: creator.tier,
        totalTips: creator.totalTips,
        specializations: creator.specializations,
        rmtScore: creator.currentScore?.rmtScore ?? null,
        confidenceInterval: creator.currentScore?.confidenceInterval ?? null,
        accuracyRate: creator.currentScore?.accuracyRate ?? null,
        avgReturnPct: creator.currentScore?.avgReturnPct ?? null,
        avgStopLossDistance,
        preferredTimeframe,
      };
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeframe(tf: string | null): string {
  if (!tf) return "\u2014";
  switch (tf) {
    case "INTRADAY":
      return "Intraday";
    case "SWING":
      return "Swing";
    case "POSITIONAL":
      return "Positional";
    case "LONG_TERM":
      return "Long Term";
    default:
      return tf;
  }
}

function getTierColor(tier: string): string {
  switch (tier) {
    case "DIAMOND":
      return "bg-violet-100 text-violet-700";
    case "PLATINUM":
      return "bg-slate-100 text-slate-700";
    case "GOLD":
      return "bg-amber-100 text-amber-700";
    case "SILVER":
      return "bg-gray-100 text-gray-600";
    case "BRONZE":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-bg-alt text-muted";
  }
}

/**
 * Given numeric values for a row, return the index of the "best" one.
 * Returns -1 if fewer than 2 valid values exist.
 */
function getBestIndex(
  values: (number | null)[],
  mode: "higher_better" | "lower_better"
): number {
  const valid = values
    .map((v, i) => (v != null ? { v, i } : null))
    .filter((x): x is { v: number; i: number } => x != null);
  if (valid.length < 2) return -1;
  if (mode === "higher_better") {
    return valid.reduce((best, cur) => (cur.v > best.v ? cur : best)).i;
  }
  return valid.reduce((best, cur) => (cur.v < best.v ? cur : best)).i;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export async function CompareTable({
  creatorIds,
}: CompareTableProps): Promise<React.ReactElement> {
  const creators = await getCreatorsForComparison(creatorIds);

  if (creators.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-bg-alt/30 py-12 text-center">
        <p className="text-sm text-muted">
          Could not load enough creators to compare. Please try different
          selections.
        </p>
      </div>
    );
  }

  // Build comparison rows
  const rmtValues = creators.map((c) => c.rmtScore);
  const accValues = creators.map((c) => c.accuracyRate);
  const returnValues = creators.map((c) => c.avgReturnPct);
  const tipsValues = creators.map((c) => c.totalTips);
  const slValues = creators.map((c) => c.avgStopLossDistance);

  const bestRmt = getBestIndex(rmtValues, "higher_better");
  const bestAcc = getBestIndex(accValues, "higher_better");
  const bestReturn = getBestIndex(returnValues, "higher_better");
  const bestTips = getBestIndex(tipsValues, "higher_better");
  const bestSl = getBestIndex(slValues, "lower_better");

  const rows: ComparisonRow[] = [
    {
      label: "RMT Score",
      values: creators.map((c, i) => (
        <span
          key={c.id}
          className={cn(
            "tabular-nums font-semibold",
            i === bestRmt ? "text-success" : "text-text"
          )}
        >
          {c.rmtScore != null ? c.rmtScore.toFixed(1) : "Pending"}
          {c.confidenceInterval != null && c.rmtScore != null && (
            <span className="ml-1 text-xs font-normal text-muted">
              &plusmn;{c.confidenceInterval.toFixed(1)}
            </span>
          )}
        </span>
      )),
    },
    {
      label: "Accuracy Rate",
      values: creators.map((c, i) => (
        <span
          key={c.id}
          className={cn(
            "tabular-nums font-medium",
            i === bestAcc ? "text-success" : "text-text"
          )}
        >
          {c.accuracyRate != null
            ? `${(c.accuracyRate * 100).toFixed(1)}%`
            : "\u2014"}
        </span>
      )),
    },
    {
      label: "Avg Return",
      values: creators.map((c, i) => (
        <span
          key={c.id}
          className={cn(
            "tabular-nums font-medium",
            i === bestReturn ? "text-success" : "text-text"
          )}
        >
          {c.avgReturnPct != null
            ? `${c.avgReturnPct >= 0 ? "+" : ""}${c.avgReturnPct.toFixed(2)}%`
            : "\u2014"}
        </span>
      )),
    },
    {
      label: "Total Tips",
      values: creators.map((c, i) => (
        <span
          key={c.id}
          className={cn(
            "tabular-nums font-medium",
            i === bestTips ? "text-success" : "text-text"
          )}
        >
          {c.totalTips}
        </span>
      )),
    },
    {
      label: "Tier",
      values: creators.map((c) => (
        <Badge key={c.id} className={cn("text-xs", getTierColor(c.tier))}>
          {c.tier}
        </Badge>
      )),
    },
    {
      label: "Preferred Timeframe",
      values: creators.map((c) => (
        <span key={c.id} className="text-sm text-text">
          {formatTimeframe(c.preferredTimeframe)}
        </span>
      )),
    },
    {
      label: "Avg Stop Loss Distance",
      values: creators.map((c, i) => (
        <span
          key={c.id}
          className={cn(
            "tabular-nums font-medium",
            i === bestSl ? "text-success" : "text-text"
          )}
        >
          {c.avgStopLossDistance != null
            ? `${c.avgStopLossDistance.toFixed(2)}%`
            : "\u2014"}
        </span>
      )),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-surface shadow-sm">
      <table className="w-full min-w-[600px]">
        {/* Header row — creator names + avatars */}
        <thead>
          <tr className="border-b border-border/60">
            <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted">
              Metric
            </th>
            {creators.map((creator) => (
              <th key={creator.id} className="px-4 py-4 text-center">
                <Link
                  href={`/creator/${creator.slug}`}
                  className="inline-flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
                >
                  {creator.profileImageUrl ? (
                    <Image
                      src={creator.profileImageUrl}
                      alt={creator.displayName}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-border/40"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle text-sm font-bold text-accent ring-1 ring-border/40">
                      {creator.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-text">
                    {creator.displayName}
                  </span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>

        {/* Comparison rows */}
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.label}
              className={cn(
                "border-b border-border/30 transition-colors hover:bg-bg-alt/30",
                idx % 2 === 0 ? "bg-surface" : "bg-bg-alt/10"
              )}
            >
              <td className="px-4 py-3 text-sm font-medium text-muted">
                {row.label}
              </td>
              {row.values.map((val, i) => (
                <td
                  key={creators[i]?.id ?? i}
                  className="px-4 py-3 text-center text-sm"
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
