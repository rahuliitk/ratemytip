import Link from "next/link";
import { db } from "@/lib/db";
import { ScoreBadge } from "@/components/shared/score-badge";

interface ConflictingTipsPanelProps {
  readonly stockId: string;
}

async function getConflictingTips(stockId: string) {
  const activeTips = await db.tip.findMany({
    where: {
      stockId,
      status: "ACTIVE",
    },
    include: {
      creator: {
        include: {
          currentScore: true,
        },
      },
    },
    orderBy: { tipTimestamp: "desc" },
  });

  const buyTips = activeTips.filter((t) => t.direction === "BUY");
  const sellTips = activeTips.filter((t) => t.direction === "SELL");

  // Deduplicate creators per side and pick their best score info
  const buyCreatorMap = new Map<
    string,
    { displayName: string; slug: string; rmtScore: number | null; totalTips: number }
  >();
  for (const tip of buyTips) {
    if (!buyCreatorMap.has(tip.creatorId)) {
      buyCreatorMap.set(tip.creatorId, {
        displayName: tip.creator.displayName,
        slug: tip.creator.slug,
        rmtScore: tip.creator.currentScore?.rmtScore ?? null,
        totalTips: tip.creator.totalTips,
      });
    }
  }

  const sellCreatorMap = new Map<
    string,
    { displayName: string; slug: string; rmtScore: number | null; totalTips: number }
  >();
  for (const tip of sellTips) {
    if (!sellCreatorMap.has(tip.creatorId)) {
      sellCreatorMap.set(tip.creatorId, {
        displayName: tip.creator.displayName,
        slug: tip.creator.slug,
        rmtScore: tip.creator.currentScore?.rmtScore ?? null,
        totalTips: tip.creator.totalTips,
      });
    }
  }

  // Sort by RMT score (or totalTips as fallback), descending
  const sortByScore = (
    a: { rmtScore: number | null; totalTips: number },
    b: { rmtScore: number | null; totalTips: number }
  ) => {
    const aVal = a.rmtScore ?? a.totalTips * 0.01;
    const bVal = b.rmtScore ?? b.totalTips * 0.01;
    return bVal - aVal;
  };

  const buyCreators = Array.from(buyCreatorMap.values()).sort(sortByScore).slice(0, 5);
  const sellCreators = Array.from(sellCreatorMap.values()).sort(sortByScore).slice(0, 5);

  return {
    buyCount: buyCreatorMap.size,
    sellCount: sellCreatorMap.size,
    buyCreators,
    sellCreators,
    totalActive: activeTips.length,
  };
}

export async function ConflictingTipsPanel({
  stockId,
}: ConflictingTipsPanelProps): Promise<React.ReactElement> {
  const data = await getConflictingTips(stockId);

  if (data.totalActive === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-text">Conflicting Tips</h3>
        <p className="mt-2 text-xs text-muted">No active tips for this stock</p>
      </div>
    );
  }

  const hasConflict = data.buyCount > 0 && data.sellCount > 0;
  const total = data.buyCount + data.sellCount;
  const buyPct = total > 0 ? (data.buyCount / total) * 100 : 0;
  const sellPct = total > 0 ? (data.sellCount / total) * 100 : 0;

  // Determine unanimous direction
  const unanimousDirection = data.buyCount > 0 && data.sellCount === 0
    ? "BUY"
    : data.sellCount > 0 && data.buyCount === 0
      ? "SELL"
      : null;

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-text">Conflicting Tips</h3>

      {/* Summary line */}
      <p className="mt-2 text-sm text-muted">
        {hasConflict ? (
          <>
            <span className="font-semibold text-emerald-600">{data.buyCount} creator{data.buyCount !== 1 ? "s" : ""}</span>
            {" say "}
            <span className="font-semibold text-emerald-600">BUY</span>
            {", "}
            <span className="font-semibold text-red-600">{data.sellCount} creator{data.sellCount !== 1 ? "s" : ""}</span>
            {" say "}
            <span className="font-semibold text-red-600">SELL</span>
          </>
        ) : (
          <>
            All {total} active tip{total !== 1 ? "s" : ""} agree:{" "}
            <span
              className={
                unanimousDirection === "BUY"
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-red-600"
              }
            >
              {unanimousDirection}
            </span>
          </>
        )}
      </p>

      {/* Visual bar */}
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-bg-alt">
        {data.buyCount > 0 && (
          <div
            className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${buyPct}%` }}
          />
        )}
        {data.sellCount > 0 && (
          <div
            className="bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
            style={{ width: `${sellPct}%` }}
          />
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-xs font-medium tabular-nums text-muted">
        <span className="text-emerald-600">{buyPct.toFixed(0)}% BUY</span>
        <span className="text-red-600">{sellPct.toFixed(0)}% SELL</span>
      </div>

      {/* Creator lists */}
      {hasConflict && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* BUY side */}
          <div>
            <p className="text-xs font-semibold text-emerald-600">Bullish Creators</p>
            <div className="mt-1.5 space-y-1">
              {data.buyCreators.map((creator) => (
                <Link
                  key={creator.slug}
                  href={`/creator/${creator.slug}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-bg-alt"
                >
                  <span className="truncate text-xs font-medium text-text">
                    {creator.displayName}
                  </span>
                  {creator.rmtScore !== null ? (
                    <ScoreBadge score={creator.rmtScore} size="sm" />
                  ) : (
                    <span className="text-[10px] tabular-nums text-muted">
                      {creator.totalTips} tips
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* SELL side */}
          <div>
            <p className="text-xs font-semibold text-red-600">Bearish Creators</p>
            <div className="mt-1.5 space-y-1">
              {data.sellCreators.map((creator) => (
                <Link
                  key={creator.slug}
                  href={`/creator/${creator.slug}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-bg-alt"
                >
                  <span className="truncate text-xs font-medium text-text">
                    {creator.displayName}
                  </span>
                  {creator.rmtScore !== null ? (
                    <ScoreBadge score={creator.rmtScore} size="sm" />
                  ) : (
                    <span className="text-[10px] tabular-nums text-muted">
                      {creator.totalTips} tips
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conflict advisory */}
      {hasConflict && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            When expert opinions conflict, the safest move for beginners is to stay out or wait for clarity.
          </p>
        </div>
      )}
    </div>
  );
}
