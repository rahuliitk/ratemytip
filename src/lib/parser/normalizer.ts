// src/lib/parser/normalizer.ts

/**
 * Stock name normalization for global equities, indices, and crypto.
 *
 * Maps common aliases, abbreviations, and full company names to their
 * canonical symbols. This is the primary lookup used after regex
 * extraction to resolve ambiguous stock references.
 *
 * When no exact match is found, a fuzzy match against the database
 * (using pg_trgm) should be attempted as a fallback.
 */

/**
 * Static alias map covering commonly traded stocks across global exchanges,
 * popular crypto tokens, and their aliases used by financial influencers.
 *
 * Format: "ALIAS" -> "CANONICAL_SYMBOL"
 */
const STOCK_ALIASES: Readonly<Record<string, string>> = {
  // ═══════════════════════════════════════
  // US STOCKS (NYSE / NASDAQ)
  // ═══════════════════════════════════════

  // ──── Apple ────
  AAPL: "AAPL",
  APPLE: "AAPL",

  // ──── Microsoft ────
  MSFT: "MSFT",
  MICROSOFT: "MSFT",

  // ──── Alphabet / Google ────
  GOOGL: "GOOGL",
  GOOG: "GOOGL",
  GOOGLE: "GOOGL",
  ALPHABET: "GOOGL",

  // ──── Amazon ────
  AMZN: "AMZN",
  AMAZON: "AMZN",

  // ──── Meta / Facebook ────
  META: "META",
  FACEBOOK: "META",
  FB: "META",

  // ──── Tesla ────
  TSLA: "TSLA",
  TESLA: "TSLA",

  // ──── NVIDIA ────
  NVDA: "NVDA",
  NVIDIA: "NVDA",

  // ──── AMD ────
  AMD: "AMD",

  // ──── Netflix ────
  NFLX: "NFLX",
  NETFLIX: "NFLX",

  // ──── Berkshire Hathaway ────
  "BRK.B": "BRK.B",
  BERKSHIRE: "BRK.B",

  // ──── JPMorgan ────
  JPM: "JPM",
  JPMORGAN: "JPM",

  // ──── Visa ────
  V: "V",
  VISA: "V",

  // ──── Mastercard ────
  MA: "MA",
  MASTERCARD: "MA",

  // ──── Walmart ────
  WMT: "WMT",
  WALMART: "WMT",

  // ──── Disney ────
  DIS: "DIS",
  DISNEY: "DIS",

  // ──── Palantir ────
  PLTR: "PLTR",
  PALANTIR: "PLTR",

  // ──── Coinbase ────
  COIN: "COIN",
  COINBASE: "COIN",

  // ═══════════════════════════════════════
  // INDIAN STOCKS (NSE / BSE)
  // ═══════════════════════════════════════

  RELIANCE: "RELIANCE",
  RIL: "RELIANCE",
  "RELIANCE INDUSTRIES": "RELIANCE",

  TCS: "TCS",
  "TATA CONSULTANCY": "TCS",
  "TATA CONSULTANCY SERVICES": "TCS",

  INFY: "INFY",
  INFOSYS: "INFY",

  HDFCBANK: "HDFCBANK",
  "HDFC BANK": "HDFCBANK",
  HDFC: "HDFCBANK",

  ICICIBANK: "ICICIBANK",
  "ICICI BANK": "ICICIBANK",
  ICICI: "ICICIBANK",

  SBIN: "SBIN",
  SBI: "SBIN",
  "STATE BANK": "SBIN",
  "STATE BANK OF INDIA": "SBIN",

  HINDUNILVR: "HINDUNILVR",
  HUL: "HINDUNILVR",
  "HINDUSTAN UNILEVER": "HINDUNILVR",

  ITC: "ITC",

  BHARTIARTL: "BHARTIARTL",
  AIRTEL: "BHARTIARTL",
  "BHARTI AIRTEL": "BHARTIARTL",

  KOTAKBANK: "KOTAKBANK",
  KOTAK: "KOTAKBANK",
  "KOTAK MAHINDRA": "KOTAKBANK",
  "KOTAK MAHINDRA BANK": "KOTAKBANK",

  AXISBANK: "AXISBANK",
  "AXIS BANK": "AXISBANK",
  AXIS: "AXISBANK",

  LT: "LT",
  "L&T": "LT",
  "LARSEN AND TOUBRO": "LT",
  "LARSEN & TOUBRO": "LT",

  BAJFINANCE: "BAJFINANCE",
  "BAJAJ FINANCE": "BAJFINANCE",

  BAJFINSV: "BAJFINSV",
  "BAJAJ FINSERV": "BAJFINSV",

  ASIANPAINT: "ASIANPAINT",
  "ASIAN PAINTS": "ASIANPAINT",

  MARUTI: "MARUTI",
  "MARUTI SUZUKI": "MARUTI",

  TATAMOTORS: "TATAMOTORS",
  "TATA MOTORS": "TATAMOTORS",
  TATAMTRS: "TATAMOTORS",

  TATASTEEL: "TATASTEEL",
  "TATA STEEL": "TATASTEEL",

  SUNPHARMA: "SUNPHARMA",
  "SUN PHARMA": "SUNPHARMA",
  "SUN PHARMACEUTICAL": "SUNPHARMA",

  WIPRO: "WIPRO",

  HCLTECH: "HCLTECH",
  HCL: "HCLTECH",
  "HCL TECH": "HCLTECH",
  "HCL TECHNOLOGIES": "HCLTECH",

  TECHM: "TECHM",
  "TECH MAHINDRA": "TECHM",

  POWERGRID: "POWERGRID",
  "POWER GRID": "POWERGRID",

  NTPC: "NTPC",
  TITAN: "TITAN",

  ADANIENT: "ADANIENT",
  "ADANI ENTERPRISES": "ADANIENT",
  "ADANI ENT": "ADANIENT",

  ADANIPORTS: "ADANIPORTS",
  "ADANI PORTS": "ADANIPORTS",

  "M&M": "M&M",
  MM: "M&M",
  MAHINDRA: "M&M",
  "MAHINDRA & MAHINDRA": "M&M",

  INDUSINDBK: "INDUSINDBK",
  "INDUSIND BANK": "INDUSINDBK",
  INDUSIND: "INDUSINDBK",

  JSWSTEEL: "JSWSTEEL",
  "JSW STEEL": "JSWSTEEL",

  CIPLA: "CIPLA",
  DRREDDY: "DRREDDY",
  "DR REDDY": "DRREDDY",
  "DR REDDYS": "DRREDDY",
  DIVISLAB: "DIVISLAB",
  "DIVIS LAB": "DIVISLAB",
  "DIVIS LABS": "DIVISLAB",
  NESTLEIND: "NESTLEIND",
  NESTLE: "NESTLEIND",
  "NESTLE INDIA": "NESTLEIND",
  COALINDIA: "COALINDIA",
  "COAL INDIA": "COALINDIA",
  TATACONSUM: "TATACONSUM",
  "TATA CONSUMER": "TATACONSUM",
  BRITANNIA: "BRITANNIA",
  ULTRACEMCO: "ULTRACEMCO",
  ULTRATECH: "ULTRACEMCO",
  "ULTRATECH CEMENT": "ULTRACEMCO",
  GRASIM: "GRASIM",
  HINDALCO: "HINDALCO",

  // ═══════════════════════════════════════
  // GLOBAL INDICES
  // ═══════════════════════════════════════

  // US
  "S&P 500": "SPX",
  SPX: "SPX",
  SPY: "SPX",
  "DOW JONES": "DJI",
  DJI: "DJI",
  DJIA: "DJI",
  "NASDAQ COMPOSITE": "IXIC",
  IXIC: "IXIC",
  QQQ: "QQQ",
  VIX: "VIX",

  // India
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

  // Europe
  FTSE: "FTSE 100",
  "FTSE 100": "FTSE 100",
  DAX: "DAX",
  CAC: "CAC 40",
  "CAC 40": "CAC 40",

  // Asia
  "NIKKEI 225": "NIKKEI 225",
  NIKKEI: "NIKKEI 225",
  "HANG SENG": "HSI",
  HSI: "HSI",

  // ═══════════════════════════════════════
  // CRYPTO
  // ═══════════════════════════════════════

  BITCOIN: "BTC",
  "BTC/USDT": "BTC",
  "BTC/USD": "BTC",
  BTCUSDT: "BTC",
  BTCUSD: "BTC",

  ETHEREUM: "ETH",
  "ETH/USDT": "ETH",
  "ETH/USD": "ETH",
  ETHUSDT: "ETH",
  ETHUSD: "ETH",

  SOLANA: "SOL",
  SOL: "SOL",
  "SOL/USDT": "SOL",

  XRP: "XRP",
  RIPPLE: "XRP",

  CARDANO: "ADA",
  ADA: "ADA",

  DOGECOIN: "DOGE",
  DOGE: "DOGE",

  POLYGON: "MATIC",
  MATIC: "MATIC",

  AVALANCHE: "AVAX",
  AVAX: "AVAX",

  CHAINLINK: "LINK",
  LINK: "LINK",

  POLKADOT: "DOT",
  DOT: "DOT",

  LITECOIN: "LTC",
  LTC: "LTC",

  UNISWAP: "UNI",
  UNI: "UNI",

  PEPE: "PEPE",
  SHIB: "SHIB",
  "SHIBA INU": "SHIB",
};

/**
 * Normalize a raw stock name / symbol to its canonical symbol.
 *
 * Lookup order:
 * 1. Exact match in alias map (case-insensitive)
 * 2. Return the cleaned uppercase input as-is (assume it is already a valid symbol)
 *
 * For fuzzy matching against the database (pg_trgm), use the separate
 * `fuzzyMatchStock` function which requires a database connection.
 *
 * @param input - Raw stock name or symbol extracted from text
 * @returns Canonical symbol or the cleaned input if no alias found
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
 * Check if a string looks like a valid stock symbol.
 *
 * Valid symbols are 1-20 uppercase alpha characters, possibly with
 * an ampersand (for M&M), dots (for BRK.B), or digits at the end.
 */
export function isValidSymbolFormat(symbol: string): boolean {
  return /^[A-Z]{1,20}(?:[&.][A-Z]+)?(?:\d+)?$/.test(symbol);
}

/**
 * Get the full alias map. Used when loading additional aliases from the
 * database at application startup.
 */
export function getStaticAliases(): Readonly<Record<string, string>> {
  return STOCK_ALIASES;
}
