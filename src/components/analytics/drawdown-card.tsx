import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils/format";

interface DrawdownCardProps {
  readonly creatorId: string;
}

const COMPLETED_STATUSES = [
  "TARGET_1_HIT",
  "TARGET_2_HIT",
  "TARGET_3_HIT",
  "ALL_TARGETS_HIT",
  "STOPLOSS_HIT",
  "EXPIRED",
] as const;

function isLosingTip(tip: {
  status: string;
  returnPct: number | null;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  closedPrice: number | null;
}): boolean {
  if (tip.status === "STOPLOSS_HIT") return true;
  if (tip.status === "EXPIRED") {
    // Expired tips are losses if returnPct is negative or if closedPrice is worse than entry
    if (tip.returnPct !== null) return tip.returnPct < 0;
    if (tip.closedPrice !== null) {
      if (tip.direction === "BUY") return tip.closedPrice < tip.entryPrice;
      return tip.closedPrice > tip.entryPrice;
    }
    return true; // Default: expired with no data = loss
  }
  return false;
}

function calculateReturnPct(tip: {
  direction: string;
  entryPrice: number;
  returnPct: number | null;
  closedPrice: number | null;
  stopLoss: number;
  target1: number;
  status: string;
}): number {
  // Use stored returnPct if available
  if (tip.returnPct !== null) return tip.returnPct;

  // Calculate from closedPrice
  if (tip.closedPrice !== null) {
    if (tip.direction === "BUY") {
      return ((tip.closedPrice - tip.entryPrice) / tip.entryPrice) * 100;
    }
    return ((tip.entryPrice - tip.closedPrice) / tip.entryPrice) * 100;
  }

  // Estimate from status
  if (tip.status === "STOPLOSS_HIT") {
    if (tip.direction === "BUY") {
      return ((tip.stopLoss - tip.entryPrice) / tip.entryPrice) * 100;
    }
    return ((tip.entryPrice - tip.stopLoss) / tip.entryPrice) * 100;
  }

  if (
    tip.status === "TARGET_1_HIT" ||
    tip.status === "TARGET_2_HIT" ||
    tip.status === "TARGET_3_HIT" ||
    tip.status === "ALL_TARGETS_HIT"
  ) {
    if (tip.direction === "BUY") {
      return ((tip.target1 - tip.entryPrice) / tip.entryPrice) * 100;
    }
    return ((tip.entryPrice - tip.target1) / tip.entryPrice) * 100;
  }

  return 0;
}

async function getDrawdownData(creatorId: string) {
  const completedTips = await db.tip.findMany({
    where: {
      creatorId,
      status: { in: [...COMPLETED_STATUSES] },
    },
    orderBy: { tipTimestamp: "asc" },
    select: {
      id: true,
      direction: true,
      entryPrice: true,
      target1: true,
      stopLoss: true,
      closedPrice: true,
      status: true,
      returnPct: true,
      tipTimestamp: true,
      closedAt: true,
    },
  });

  if (completedTips.length === 0) {
    return null;
  }

  // Calculate longest losing streak
  let currentStreak = 0;
  let longestLosingStreak = 0;

  for (const tip of completedTips) {
    if (isLosingTip(tip)) {
      currentStreak++;
      longestLosingStreak = Math.max(longestLosingStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Simulate equity curve with 1,00,000 starting capital
  const STARTING_CAPITAL = 100000;
  let equity = STARTING_CAPITAL;
  let peak = STARTING_CAPITAL;
  let maxDrawdownPct = 0;
  let maxDrawdownTrough = STARTING_CAPITAL;
  let drawdownStartIndex = 0;
  let drawdownEndIndex = 0;
  let worstDrawdownConsecutiveLosses = 0;

  // Track the worst drawdown segment
  let currentDrawdownStart = 0;
  let inDrawdown = false;

  const equityCurve: number[] = [STARTING_CAPITAL];

  for (let i = 0; i < completedTips.length; i++) {
    const tip = completedTips[i]!;
    const returnPct = calculateReturnPct(tip);

    // Apply return to equity (assume each tip uses full equity)
    equity = equity * (1 + returnPct / 100);
    equityCurve.push(equity);

    if (equity > peak) {
      peak = equity;
      inDrawdown = false;
    }

    if (equity < peak) {
      const drawdownPct = ((peak - equity) / peak) * 100;

      if (!inDrawdown) {
        currentDrawdownStart = i;
        inDrawdown = true;
      }

      if (drawdownPct > maxDrawdownPct) {
        maxDrawdownPct = drawdownPct;
        maxDrawdownTrough = equity;
        drawdownStartIndex = currentDrawdownStart;
        drawdownEndIndex = i;
      }
    }
  }

  // Count consecutive losses during max drawdown period
  let consecutiveLosses = 0;
  let maxConsecutiveInDrawdown = 0;
  for (let i = drawdownStartIndex; i <= drawdownEndIndex; i++) {
    const tip = completedTips[i];
    if (tip && isLosingTip(tip)) {
      consecutiveLosses++;
      maxConsecutiveInDrawdown = Math.max(maxConsecutiveInDrawdown, consecutiveLosses);
    } else {
      consecutiveLosses = 0;
    }
  }
  worstDrawdownConsecutiveLosses = drawdownEndIndex - drawdownStartIndex + 1;

  // Calculate recovery time: how many tips from trough to regain peak
  let recoveryTips = 0;
  let recovered = false;
  const troughEquity = maxDrawdownTrough;
  let postTroughEquity = troughEquity;

  for (let i = drawdownEndIndex + 1; i < completedTips.length; i++) {
    const tip = completedTips[i]!;
    const returnPct = calculateReturnPct(tip);
    postTroughEquity = postTroughEquity * (1 + returnPct / 100);
    recoveryTips++;
    if (postTroughEquity >= peak) {
      recovered = true;
      break;
    }
  }

  // Calculate recovery in days if we have date data
  let recoveryDays: number | null = null;
  if (recovered && completedTips[drawdownEndIndex]) {
    const troughDate = completedTips[drawdownEndIndex]!.closedAt ?? completedTips[drawdownEndIndex]!.tipTimestamp;
    const recoveryIndex = drawdownEndIndex + recoveryTips;
    if (completedTips[recoveryIndex]) {
      const recoveryDate = completedTips[recoveryIndex]!.closedAt ?? completedTips[recoveryIndex]!.tipTimestamp;
      recoveryDays = Math.ceil(
        (recoveryDate.getTime() - troughDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }

  return {
    totalCompletedTips: completedTips.length,
    longestLosingStreak,
    maxDrawdownPct,
    maxDrawdownTrough,
    worstDrawdownConsecutiveLosses,
    recoveryTips: recovered ? recoveryTips : null,
    recoveryDays,
    recovered,
    startingCapital: STARTING_CAPITAL,
  };
}

export async function DrawdownCard({
  creatorId,
}: DrawdownCardProps): Promise<React.ReactElement> {
  const data = await getDrawdownData(creatorId);

  if (!data || data.totalCompletedTips < 5) {
    return (
      <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-text">Max Drawdown Analysis</h3>
        <p className="mt-2 text-xs text-muted">
          Not enough completed tips to calculate drawdown (minimum 5 required).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-text">Max Drawdown Analysis</h3>
      <p className="mt-1 text-xs text-muted">
        Based on {data.totalCompletedTips} completed tips
      </p>

      <div className="mt-4 space-y-4">
        {/* Worst drawdown */}
        <div className="rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/20">
          <p className="text-xs font-medium text-red-700 dark:text-red-400">Worst Drawdown</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-red-600 dark:text-red-400">
            -{data.maxDrawdownPct.toFixed(1)}%
          </p>
          <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
            over {data.worstDrawdownConsecutiveLosses} consecutive tip{data.worstDrawdownConsecutiveLosses !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Longest losing streak */}
        <div className="flex items-center justify-between rounded-lg bg-bg-alt px-4 py-3">
          <div>
            <p className="text-xs font-medium text-muted">Longest Losing Streak</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-text">
              {data.longestLosingStreak} tip{data.longestLosingStreak !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(data.longestLosingStreak, 10) }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-1.5 rounded-sm bg-red-400 dark:bg-red-500"
              />
            ))}
            {data.longestLosingStreak > 10 && (
              <span className="ml-1 text-xs text-muted">+{data.longestLosingStreak - 10}</span>
            )}
          </div>
        </div>

        {/* Recovery info */}
        {data.recovered ? (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-950/20">
            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Recovery</p>
              <p className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {data.recoveryTips} tip{data.recoveryTips !== 1 ? "s" : ""}
                {data.recoveryDays !== null && ` (~${data.recoveryDays} day${data.recoveryDays !== 1 ? "s" : ""})`}
              </p>
            </div>
            <div className="text-emerald-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Recovery</p>
            <p className="mt-0.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
              Not yet recovered from worst drawdown
            </p>
          </div>
        )}

        {/* Scenario text */}
        <div className="rounded-lg border border-border/60 px-4 py-3">
          <p className="text-xs leading-relaxed text-muted">
            If you started following this creator at their worst moment with{" "}
            <span className="font-semibold text-text">{formatPrice(data.startingCapital)}</span>,
            your portfolio would have dropped to{" "}
            <span className="font-semibold text-red-600 dark:text-red-400">
              {formatPrice(data.maxDrawdownTrough)}
            </span>
            {data.recovered
              ? " before recovering."
              : " and has not yet recovered to its peak."}
          </p>
        </div>
      </div>
    </div>
  );
}
