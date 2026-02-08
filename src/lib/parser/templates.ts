// src/lib/parser/templates.ts

/**
 * Regex patterns for extracting structured tip data from Indian finfluencer posts.
 *
 * Common formats:
 *
 * Format 1 — Tabular:
 *   BUY RELIANCE
 *   Entry: 2400-2420
 *   Target 1: 2500
 *   Target 2: 2600
 *   SL: 2350
 *   Timeframe: Swing
 *
 * Format 2 — Inline:
 *   RELIANCE Buy above 2420 TGT 2500/2600 SL 2350
 *
 * Format 3 — Hashtag-heavy:
 *   #RELIANCE Buy CMP 2415 target-2500 target-2600 SL-2350 #StockTips #NSE
 *
 * Format 4 — Hinglish:
 *   RELIANCE kharidein 2400 ke paas, target 2500, stoploss 2350
 */

/** Matches uppercase words that could be NSE stock symbols (2-20 chars) */
export const STOCK_SYMBOL_PATTERN = /\b([A-Z]{2,20})\b/g;

/** Matches price values with optional rupee symbol, comma grouping, and decimals */
export const PRICE_PATTERN = /₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)/g;

/** Matches target prices preceded by common target keywords or emoji */
export const TARGET_PATTERN =
  /(?:target|tgt|🎯)\s*(?:\d\s*)?[:\-=]?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)/gi;

/** Matches stop-loss prices preceded by common SL keywords or emoji */
export const STOP_LOSS_PATTERN =
  /(?:stop\s*loss|stoploss|sl|⛔)\s*[:\-=]?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)/gi;

/** Matches entry prices preceded by entry/buy/cmp keywords */
export const ENTRY_PATTERN =
  /(?:entry|buy\s*(?:above|below|near|around|at|@)?|sell\s*(?:below|above|near|around|at|@)?|cmp)\s*[:\-=]?\s*₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)/gi;

/** Matches entry price ranges like "2400-2420" and returns both ends */
export const ENTRY_RANGE_PATTERN =
  /(?:entry|buy\s*(?:above|below|near|around|at|@)?|cmp)\s*[:\-=]?\s*₹?\s*(\d{1,6}(?:\.\d{1,2})?)\s*[-–]\s*₹?\s*(\d{1,6}(?:\.\d{1,2})?)/gi;

/** Matches BUY/SELL direction keywords (English + Hinglish) */
export const DIRECTION_PATTERN =
  /\b(buy|sell|long|short|bullish|bearish|kharidein|bechein)\b/gi;

/** Matches timeframe keywords */
export const TIMEFRAME_PATTERN =
  /\b(intraday|swing|positional|long\s*term|short\s*term|btst|stbt)\b/gi;

/** Financial keywords used to pre-filter posts that might contain tips */
export const FINANCIAL_KEYWORDS = [
  "buy",
  "sell",
  "target",
  "tgt",
  "sl",
  "stop loss",
  "stoploss",
  "entry",
  "cmp",
  "nifty",
  "banknifty",
  "sensex",
  "bullish",
  "bearish",
  "breakout",
  "breakdown",
  "long",
  "short",
  "call",
  "put",
  "kharidein",
  "bechein",
  "profit",
  "loss",
  "₹",
  "rs",
  "rs.",
  "inr",
] as const;

/**
 * Non-stock uppercase words that are commonly present in financial tweets
 * but should not be mistaken for stock symbols.
 */
export const SYMBOL_BLACKLIST = new Set<string>([
  "BUY",
  "SELL",
  "LONG",
  "SHORT",
  "CALL",
  "PUT",
  "CMP",
  "SL",
  "TGT",
  "TARGET",
  "ENTRY",
  "NSE",
  "BSE",
  "MCX",
  "NIFTY",
  "SENSEX",
  "BANKNIFTY",
  "BTST",
  "STBT",
  "PE",
  "CE",
  "ITM",
  "OTM",
  "ATM",
  "EQ",
  "FUT",
  "OPT",
  "INTRADAY",
  "SWING",
  "POSITIONAL",
  "IPO",
  "AGM",
  "EPS",
  "ROE",
  "ROA",
  "EBITDA",
  "GDP",
  "RBI",
  "SEBI",
  "FII",
  "DII",
  "IMF",
  "USA",
  "USD",
  "INR",
  "THE",
  "AND",
  "FOR",
  "NOT",
  "ALL",
  "HAS",
  "WAS",
  "ARE",
  "BUT",
  "CAN",
]);

/**
 * Normalizes a direction string to BUY or SELL.
 * Returns null if the direction cannot be determined.
 */
export function normalizeDirection(raw: string): "BUY" | "SELL" | null {
  const lower = raw.toLowerCase().trim();
  if (["buy", "long", "bullish", "kharidein"].includes(lower)) {
    return "BUY";
  }
  if (["sell", "short", "bearish", "bechein"].includes(lower)) {
    return "SELL";
  }
  return null;
}

/**
 * Normalizes a timeframe string to one of the canonical timeframe values.
 * Returns null if the timeframe cannot be determined.
 */
export function normalizeTimeframe(
  raw: string
): "INTRADAY" | "SWING" | "POSITIONAL" | "LONG_TERM" | null {
  const lower = raw.toLowerCase().replace(/\s+/g, "").trim();
  if (["intraday"].includes(lower)) {
    return "INTRADAY";
  }
  if (["swing", "btst", "stbt", "shortterm"].includes(lower)) {
    return "SWING";
  }
  if (["positional"].includes(lower)) {
    return "POSITIONAL";
  }
  if (["longterm"].includes(lower)) {
    return "LONG_TERM";
  }
  return null;
}

/**
 * Parse a price string that may contain commas (Indian number format: 1,23,456.78)
 * into a floating-point number. Returns NaN if parsing fails.
 */
export function parsePrice(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  return parseFloat(cleaned);
}

/**
 * Test whether a piece of text contains any financial keywords,
 * suggesting it might contain a stock tip.
 */
export function containsFinancialKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return FINANCIAL_KEYWORDS.some((keyword) => lower.includes(keyword));
}
