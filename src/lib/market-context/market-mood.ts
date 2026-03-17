import { MARKET_HOURS } from "@/lib/constants";

// ──── Types ────

export type MarketMood = "BULLISH" | "NEUTRAL" | "BEARISH";
export type VixLevel = "LOW" | "MODERATE" | "HIGH" | "EXTREME";

export interface MarketContext {
  readonly niftyLevel: number;
  readonly niftyChange: number;
  readonly niftyChangePct: number;
  readonly vixLevel: number;
  readonly vixCategory: VixLevel;
  readonly marketMood: MarketMood;
  readonly isMarketOpen: boolean;
  readonly lastUpdated: string;
}

// ──── VIX Classification ────
// <13 = LOW, 13-18 = MODERATE, 18-25 = HIGH, >25 = EXTREME

const VIX_THRESHOLDS = [
  { max: 13, category: "LOW" as const },
  { max: 18, category: "MODERATE" as const },
  { max: 25, category: "HIGH" as const },
] as const;

export function classifyVix(vix: number): VixLevel {
  for (const { max, category } of VIX_THRESHOLDS) {
    if (vix < max) {
      return category;
    }
  }
  return "EXTREME";
}

// ──── Market Mood Classification ────
// Combines NIFTY change % and VIX level to determine overall mood.
//   - NIFTY positive AND VIX LOW → BULLISH
//   - NIFTY negative AND VIX HIGH or EXTREME → BEARISH
//   - Everything else → NEUTRAL

export function classifyMarketMood(
  niftyChangePct: number,
  vixLevel: number,
): MarketMood {
  const vixCategory = classifyVix(vixLevel);

  if (niftyChangePct > 0 && vixCategory === "LOW") {
    return "BULLISH";
  }

  if (
    niftyChangePct < 0 &&
    (vixCategory === "HIGH" || vixCategory === "EXTREME")
  ) {
    return "BEARISH";
  }

  return "NEUTRAL";
}

// ──── Market Hours Check ────
// NSE market hours: 9:15 AM – 3:30 PM IST, Monday–Friday

export function isMarketOpen(): boolean {
  const now = new Date();

  // Convert to IST by creating a formatter and parsing the components
  const istFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_HOURS.TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = istFormatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  // Check if it's a weekday (Mon-Fri)
  const weekends = ["Sat", "Sun"];
  if (weekends.includes(weekday)) {
    return false;
  }

  const currentMinutes = hour * 60 + minute;
  const openMinutes =
    MARKET_HOURS.NSE_OPEN.hour * 60 + MARKET_HOURS.NSE_OPEN.minute;
  const closeMinutes =
    MARKET_HOURS.NSE_CLOSE.hour * 60 + MARKET_HOURS.NSE_CLOSE.minute;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}
