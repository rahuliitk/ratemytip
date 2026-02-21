// src/lib/parser/normalizer.ts

/**
 * Stock name normalization for Indian equities.
 *
 * Maps common aliases, abbreviations, and full company names to their
 * canonical NSE symbols. This is the primary lookup used after regex
 * extraction to resolve ambiguous stock references.
 *
 * When no exact match is found, a fuzzy match against the database
 * (using pg_trgm) should be attempted as a fallback.
 */

/**
 * Static alias map covering the most commonly traded NSE stocks and their
 * popular aliases used by Indian finfluencers.
 *
 * Format: "ALIAS" -> "CANONICAL_NSE_SYMBOL"
 */
const STOCK_ALIASES: Readonly<Record<string, string>> = {
  // ──── Reliance Industries ────
  RELIANCE: "RELIANCE",
  RIL: "RELIANCE",
  "RELIANCE INDUSTRIES": "RELIANCE",

  // ──── Tata Consultancy Services ────
  TCS: "TCS",
  "TATA CONSULTANCY": "TCS",
  "TATA CONSULTANCY SERVICES": "TCS",

  // ──── Infosys ────
  INFY: "INFY",
  INFOSYS: "INFY",

  // ──── HDFC Bank ────
  HDFCBANK: "HDFCBANK",
  "HDFC BANK": "HDFCBANK",
  HDFC: "HDFCBANK",

  // ──── ICICI Bank ────
  ICICIBANK: "ICICIBANK",
  "ICICI BANK": "ICICIBANK",
  ICICI: "ICICIBANK",

  // ──── State Bank of India ────
  SBIN: "SBIN",
  SBI: "SBIN",
  "STATE BANK": "SBIN",
  "STATE BANK OF INDIA": "SBIN",

  // ──── Hindustan Unilever ────
  HINDUNILVR: "HINDUNILVR",
  HUL: "HINDUNILVR",
  "HINDUSTAN UNILEVER": "HINDUNILVR",

  // ──── ITC ────
  ITC: "ITC",

  // ──── Bharti Airtel ────
  BHARTIARTL: "BHARTIARTL",
  AIRTEL: "BHARTIARTL",
  "BHARTI AIRTEL": "BHARTIARTL",

  // ──── Kotak Mahindra Bank ────
  KOTAKBANK: "KOTAKBANK",
  KOTAK: "KOTAKBANK",
  "KOTAK MAHINDRA": "KOTAKBANK",
  "KOTAK MAHINDRA BANK": "KOTAKBANK",

  // ──── Axis Bank ────
  AXISBANK: "AXISBANK",
  "AXIS BANK": "AXISBANK",
  AXIS: "AXISBANK",

  // ──── Larsen & Toubro ────
  LT: "LT",
  "L&T": "LT",
  "LARSEN AND TOUBRO": "LT",
  "LARSEN & TOUBRO": "LT",

  // ──── Bajaj Finance ────
  BAJFINANCE: "BAJFINANCE",
  "BAJAJ FINANCE": "BAJFINANCE",

  // ──── Bajaj Finserv ────
  BAJFINSV: "BAJFINSV",
  "BAJAJ FINSERV": "BAJFINSV",

  // ──── Asian Paints ────
  ASIANPAINT: "ASIANPAINT",
  "ASIAN PAINTS": "ASIANPAINT",

  // ──── Maruti Suzuki ────
  MARUTI: "MARUTI",
  "MARUTI SUZUKI": "MARUTI",

  // ──── Tata Motors ────
  TATAMOTORS: "TATAMOTORS",
  "TATA MOTORS": "TATAMOTORS",
  TATAMTRS: "TATAMOTORS",

  // ──── Tata Steel ────
  TATASTEEL: "TATASTEEL",
  "TATA STEEL": "TATASTEEL",

  // ──── Sun Pharma ────
  SUNPHARMA: "SUNPHARMA",
  "SUN PHARMA": "SUNPHARMA",
  "SUN PHARMACEUTICAL": "SUNPHARMA",

  // ──── Wipro ────
  WIPRO: "WIPRO",

  // ──── HCL Technologies ────
  HCLTECH: "HCLTECH",
  HCL: "HCLTECH",
  "HCL TECH": "HCLTECH",
  "HCL TECHNOLOGIES": "HCLTECH",

  // ──── Tech Mahindra ────
  TECHM: "TECHM",
  "TECH MAHINDRA": "TECHM",

  // ──── Power Grid ────
  POWERGRID: "POWERGRID",
  "POWER GRID": "POWERGRID",

  // ──── NTPC ────
  NTPC: "NTPC",

  // ──── Titan ────
  TITAN: "TITAN",

  // ──── Adani Enterprises ────
  ADANIENT: "ADANIENT",
  "ADANI ENTERPRISES": "ADANIENT",
  "ADANI ENT": "ADANIENT",

  // ──── Adani Ports ────
  ADANIPORTS: "ADANIPORTS",
  "ADANI PORTS": "ADANIPORTS",

  // ──── Mahindra & Mahindra ────
  "M&M": "M&M",
  MM: "M&M",
  MAHINDRA: "M&M",
  "MAHINDRA & MAHINDRA": "M&M",

  // ──── IndusInd Bank ────
  INDUSINDBK: "INDUSINDBK",
  "INDUSIND BANK": "INDUSINDBK",
  INDUSIND: "INDUSINDBK",

  // ──── JSW Steel ────
  JSWSTEEL: "JSWSTEEL",
  "JSW STEEL": "JSWSTEEL",

  // ──── Cipla ────
  CIPLA: "CIPLA",

  // ──── Dr Reddy's ────
  DRREDDY: "DRREDDY",
  "DR REDDY": "DRREDDY",
  "DR REDDYS": "DRREDDY",

  // ──── Divis Labs ────
  DIVISLAB: "DIVISLAB",
  "DIVIS LAB": "DIVISLAB",
  "DIVIS LABS": "DIVISLAB",

  // ──── Nestle India ────
  NESTLEIND: "NESTLEIND",
  NESTLE: "NESTLEIND",
  "NESTLE INDIA": "NESTLEIND",

  // ──── Coal India ────
  COALINDIA: "COALINDIA",
  "COAL INDIA": "COALINDIA",

  // ──── Tata Consumer ────
  TATACONSUM: "TATACONSUM",
  "TATA CONSUMER": "TATACONSUM",

  // ──── Britannia ────
  BRITANNIA: "BRITANNIA",

  // ──── UltraTech Cement ────
  ULTRACEMCO: "ULTRACEMCO",
  ULTRATECH: "ULTRACEMCO",
  "ULTRATECH CEMENT": "ULTRACEMCO",

  // ──── Grasim ────
  GRASIM: "GRASIM",

  // ──── Hindalco ────
  HINDALCO: "HINDALCO",

  // ──── Indices ────
  "NIFTY 50": "NIFTY 50",
  NIFTY: "NIFTY 50",
  NIFTY50: "NIFTY 50",

  "NIFTY BANK": "NIFTY BANK",
  BANKNIFTY: "NIFTY BANK",
  "BANK NIFTY": "NIFTY BANK",

  "NIFTY IT": "NIFTY IT",
  NIFTYIT: "NIFTY IT",

  "NIFTY PHARMA": "NIFTY PHARMA",
  NIFTYPHARMA: "NIFTY PHARMA",

  "NIFTY MIDCAP 50": "NIFTY MIDCAP 50",

  SENSEX: "SENSEX",
};

/**
 * Normalize a raw stock name / symbol to its canonical NSE symbol.
 *
 * Lookup order:
 * 1. Exact match in alias map (case-insensitive)
 * 2. Return the cleaned uppercase input as-is (assume it is already a valid symbol)
 *
 * For fuzzy matching against the database (pg_trgm), use the separate
 * `fuzzyMatchStock` function which requires a database connection.
 *
 * @param input - Raw stock name or symbol extracted from text
 * @returns Canonical NSE symbol or the cleaned input if no alias found
 */
export function normalizeStockName(input: string): string {
  const cleaned = input
    .toUpperCase()
    .replace(/[#$@]/g, "")
    .trim();

  // Check alias map
  const canonical = STOCK_ALIASES[cleaned];
  if (canonical) {
    return canonical;
  }

  // If no alias found, return the cleaned input
  // (assumes caller will verify against the stocks table)
  return cleaned;
}

/**
 * Check if a string looks like a valid NSE-style stock symbol.
 *
 * Valid symbols are 2-20 uppercase alpha characters, possibly with
 * an ampersand (for M&M) or digits at the end.
 */
export function isValidSymbolFormat(symbol: string): boolean {
  return /^[A-Z]{2,20}(?:&[A-Z]+)?(?:\d+)?$/.test(symbol);
}

/**
 * Get the full alias map. Used when loading additional aliases from the
 * database at application startup.
 */
export function getStaticAliases(): Readonly<Record<string, string>> {
  return STOCK_ALIASES;
}
