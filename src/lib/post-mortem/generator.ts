// src/lib/post-mortem/generator.ts
// Auto-generates analysis for resolved (completed) tips.

// ──── Types ────

interface PostMortemTip {
  readonly status: string;
  readonly entryPrice: number;
  readonly target1: number;
  readonly stopLoss: number;
  readonly closedPrice: number | null;
  readonly closedAt: string | null;
  readonly tipTimestamp: string;
  readonly direction: "BUY" | "SELL";
  readonly timeframe: string;
  readonly conviction: string;
  readonly stockSymbol?: string;
}

interface PostMortemResult {
  readonly summary: string;
  readonly details: string;
  readonly lesson: string;
  readonly daysHeld: number;
  readonly returnPct: number;
}

// ──── Resolved status set ────

const RESOLVED_STATUSES = new Set([
  "TARGET_1_HIT",
  "TARGET_2_HIT",
  "TARGET_3_HIT",
  "ALL_TARGETS_HIT",
  "STOPLOSS_HIT",
  "EXPIRED",
]);

const TARGET_HIT_STATUSES = new Set([
  "TARGET_1_HIT",
  "TARGET_2_HIT",
  "TARGET_3_HIT",
  "ALL_TARGETS_HIT",
]);

// ──── Helpers ────

function calculateDaysHeld(tipTimestamp: string, closedAt: string | null): number {
  const start = new Date(tipTimestamp);
  const end = closedAt ? new Date(closedAt) : new Date();
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

function calculateReturnPct(
  entryPrice: number,
  exitPrice: number,
  direction: "BUY" | "SELL"
): number {
  if (entryPrice === 0) return 0;
  if (direction === "BUY") {
    return ((exitPrice - entryPrice) / entryPrice) * 100;
  }
  // For SELL (short) direction, profit when price drops
  return ((entryPrice - exitPrice) / entryPrice) * 100;
}

function formatConviction(conviction: string): string {
  switch (conviction.toUpperCase()) {
    case "HIGH":
      return "HIGH";
    case "MEDIUM":
      return "MED";
    case "LOW":
      return "LOW";
    default:
      return "MED";
  }
}

// ──── Generator ────

export function generatePostMortem(tip: PostMortemTip): PostMortemResult | null {
  if (!RESOLVED_STATUSES.has(tip.status)) {
    return null;
  }

  const stock = tip.stockSymbol ?? "The stock";
  const daysHeld = calculateDaysHeld(tip.tipTimestamp, tip.closedAt);

  // Determine exit price based on status
  let exitPrice: number;
  if (TARGET_HIT_STATUSES.has(tip.status)) {
    exitPrice = tip.target1;
  } else if (tip.status === "STOPLOSS_HIT") {
    exitPrice = tip.stopLoss;
  } else {
    // EXPIRED: use closedPrice or entryPrice as fallback
    exitPrice = tip.closedPrice ?? tip.entryPrice;
  }

  const returnPct = calculateReturnPct(tip.entryPrice, exitPrice, tip.direction);

  let summary: string;
  let details: string;
  let lesson: string;

  if (TARGET_HIT_STATUSES.has(tip.status)) {
    // TARGET HIT
    const gainPct = Math.abs(returnPct).toFixed(1);
    summary = `This tip succeeded. ${stock} moved from \u20B9${tip.entryPrice.toLocaleString("en-IN")} to \u20B9${tip.target1.toLocaleString("en-IN")}, a gain of ${gainPct}% in ${daysHeld} days. The creator's conviction was ${formatConviction(tip.conviction)}.`;

    const profitPerShare = Math.abs(tip.target1 - tip.entryPrice);
    details = `Entry: \u20B9${tip.entryPrice.toLocaleString("en-IN")} | Target: \u20B9${tip.target1.toLocaleString("en-IN")} | Profit per share: \u20B9${profitPerShare.toFixed(2)} | Days held: ${daysHeld}`;

    // Educational takeaway for target hit
    if (tip.timeframe.toUpperCase() === "SWING") {
      lesson = `Swing trades can work well for part-time traders. This tip took ${daysHeld} days to reach target.`;
    } else if (tip.timeframe.toUpperCase() === "INTRADAY") {
      lesson = `This intraday tip reached target within the same session. Quick execution and discipline were key.`;
    } else if (tip.timeframe.toUpperCase() === "POSITIONAL") {
      lesson = `Positional trades require patience. This tip needed ${daysHeld} days to play out, rewarding those who held their position.`;
    } else {
      lesson = `Long-term conviction paid off. This trade took ${daysHeld} days to reach the target price.`;
    }
  } else if (tip.status === "STOPLOSS_HIT") {
    // STOPLOSS HIT
    const lossPct = Math.abs(returnPct).toFixed(1);
    const maxLossPerShare = Math.abs(tip.entryPrice - tip.stopLoss);

    summary = `This tip hit stop loss. ${stock} dropped from \u20B9${tip.entryPrice.toLocaleString("en-IN")} to \u20B9${tip.stopLoss.toLocaleString("en-IN")}, a loss of ${lossPct}%. The maximum loss per share was \u20B9${maxLossPerShare.toFixed(2)}.`;

    details = `Entry: \u20B9${tip.entryPrice.toLocaleString("en-IN")} | Stop Loss: \u20B9${tip.stopLoss.toLocaleString("en-IN")} | Loss per share: \u20B9${maxLossPerShare.toFixed(2)} | Days held: ${daysHeld}`;

    // Educational takeaway for SL hit
    if (tip.timeframe.toUpperCase() === "INTRADAY") {
      lesson = `Intraday tips are high-risk. Consider only following intraday tips from creators with >65% accuracy.`;
    } else if (tip.timeframe.toUpperCase() === "SWING") {
      lesson = `Stop losses are essential for swing trades. This SL limited the loss to ${lossPct}% instead of a potentially larger drawdown.`;
    } else {
      lesson = `Having a stop loss protected against further downside. The loss was capped at ${lossPct}% of the entry price.`;
    }
  } else {
    // EXPIRED
    const closePrice = tip.closedPrice ?? tip.entryPrice;
    const changePct = Math.abs(returnPct).toFixed(1);
    const upOrDown = returnPct >= 0 ? "UP" : "DOWN";

    summary = `This tip expired without hitting target or stop loss. ${stock} was at \u20B9${closePrice.toLocaleString("en-IN")} when the tip expired, ${upOrDown} ${changePct}% from entry.`;

    details = `Entry: \u20B9${tip.entryPrice.toLocaleString("en-IN")} | Close: \u20B9${closePrice.toLocaleString("en-IN")} | Change: ${upOrDown} ${changePct}% | Days held: ${daysHeld}`;

    lesson = `Not all tips will hit their target within the timeframe. Having a stop loss limits your downside.`;
  }

  return {
    summary,
    details,
    lesson,
    daysHeld,
    returnPct: Math.round(returnPct * 10) / 10,
  };
}

export type { PostMortemTip, PostMortemResult };
