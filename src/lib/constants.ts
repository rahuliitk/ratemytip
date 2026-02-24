// src/lib/constants.ts

// ──── Scoring ────
export const SCORING = {
  WEIGHTS: {
    ACCURACY: 0.40,
    RISK_ADJUSTED_RETURN: 0.30,
    CONSISTENCY: 0.20,
    VOLUME_FACTOR: 0.10,
  },
  MIN_TIPS_FOR_RATING: 20,
  MIN_TIPS_FOR_DISPLAY: 5,
  SCORE_MAX: 100,
  SCORE_MIN: 0,
  ROLLING_WINDOWS: {
    SHORT: 30,
    MEDIUM: 90,
    LONG: 365,
  },
  RECENCY_DECAY_HALFLIFE_DAYS: 90,
  CONFIDENCE_Z_SCORE: 1.96,
  /** Maximum expected tips for volume factor normalization (Diamond tier threshold) */
  MAX_EXPECTED_TIPS: 2000,
  /** Normalization range for risk-adjusted return: avg_rr of -2 maps to 0, +5 maps to 100 */
  RISK_ADJUSTED_FLOOR: -2,
  RISK_ADJUSTED_CEILING: 5,
} as const;

// ──── Tip Status ────
export const TIP_STATUS = {
  PENDING_REVIEW: "PENDING_REVIEW",
  ACTIVE: "ACTIVE",
  TARGET_1_HIT: "TARGET_1_HIT",
  TARGET_2_HIT: "TARGET_2_HIT",
  TARGET_3_HIT: "TARGET_3_HIT",
  ALL_TARGETS_HIT: "ALL_TARGETS_HIT",
  STOPLOSS_HIT: "STOPLOSS_HIT",
  EXPIRED: "EXPIRED",
  REJECTED: "REJECTED",
} as const;

/** Statuses that count as a "target hit" (tip was successful) */
export const TARGET_HIT_STATUSES = [
  TIP_STATUS.TARGET_1_HIT,
  TIP_STATUS.TARGET_2_HIT,
  TIP_STATUS.TARGET_3_HIT,
  TIP_STATUS.ALL_TARGETS_HIT,
] as const;

/** Statuses that indicate a tip is completed (resolved one way or another) */
export const COMPLETED_TIP_STATUSES = [
  TIP_STATUS.TARGET_1_HIT,
  TIP_STATUS.TARGET_2_HIT,
  TIP_STATUS.TARGET_3_HIT,
  TIP_STATUS.ALL_TARGETS_HIT,
  TIP_STATUS.STOPLOSS_HIT,
  TIP_STATUS.EXPIRED,
] as const;

// ──── Tip Direction ────
export const TIP_DIRECTION = {
  BUY: "BUY",
  SELL: "SELL",
} as const;

// ──── Tip Timeframe ────
export const TIP_TIMEFRAME = {
  INTRADAY: "INTRADAY",
  SWING: "SWING",
  POSITIONAL: "POSITIONAL",
  LONG_TERM: "LONG_TERM",
} as const;

// Timeframe expiry in days
export const TIMEFRAME_EXPIRY_DAYS: Record<string, number> = {
  INTRADAY: 1,
  SWING: 14,
  POSITIONAL: 90,
  LONG_TERM: 365,
};

// ──── Asset Classes ────
export const ASSET_CLASS = {
  EQUITY: "EQUITY",
  INDEX: "INDEX",
  FUTURES: "FUTURES",
  OPTIONS: "OPTIONS",
  CRYPTO: "CRYPTO",
  COMMODITY: "COMMODITY",
  FOREX: "FOREX",
} as const;

// ──── Creator Tiers ────
export const CREATOR_TIER = {
  UNRATED: "UNRATED",
  BRONZE: "BRONZE",
  SILVER: "SILVER",
  GOLD: "GOLD",
  PLATINUM: "PLATINUM",
  DIAMOND: "DIAMOND",
} as const;

// ──── Pagination ────
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  LEADERBOARD_PAGE_SIZE: 50,
} as const;

// ──── Cache TTLs (in seconds) ────
export const CACHE_TTL = {
  LEADERBOARD: 300,
  CREATOR_PROFILE: 600,
  STOCK_PAGE: 300,
  SEARCH_RESULTS: 60,
  MARKET_PRICE: 30,
  CREATOR_SCORE: 3600,
} as const;

// ──── Scraper ────
export const SCRAPER = {
  TWITTER_BATCH_SIZE: 100,
  YOUTUBE_BATCH_SIZE: 50,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  SCRAPE_INTERVAL_HOURS: 24,
} as const;

// ──── NLP Parser ────
export const PARSER = {
  HIGH_CONFIDENCE_THRESHOLD: 0.85,
  LOW_CONFIDENCE_THRESHOLD: 0.40,
} as const;

// ──── MoneyControl ────
export const MONEYCONTROL = {
  BASE_URL: "https://www.moneycontrol.com/markets/stock-ideas/",
  DEFAULT_STOP_LOSS_PCT: 0.05,
  DEFAULT_TIMEFRAME: "POSITIONAL" as const,
  MAX_PAGES: 10,
  SCRAPE_DELAY_MS: 3000,
} as const;

// ──── Finnhub ────
export const FINNHUB = {
  BASE_URL: "https://finnhub.io/api/v1",
  DEFAULT_STOP_LOSS_PCT: 0.08,
  DEFAULT_TIMEFRAME: "LONG_TERM" as const,
  SYMBOLS_PER_BATCH: 30,
  CONFIDENCE: 0.90,
} as const;

// ──── StockTwits ────
export const STOCKTWITS = {
  BASE_URL: "https://api.stocktwits.com/api/2",
  MIN_FOLLOWERS_FOR_TRACKING: 1000,
} as const;

// ──── Telegram ────
export const TELEGRAM = {
  API_BASE: "https://api.telegram.org/bot",
  MAX_REQUESTS_PER_SECOND: 30,
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
} as const;

// ──── Yahoo Finance Analyst ────
export const YAHOO_ANALYST = {
  CONFIDENCE: 0.88,
  DEFAULT_STOP_LOSS_PCT: 0.08,
  DEFAULT_TIMEFRAME: "LONG_TERM" as const,
  SYMBOLS_PER_BATCH: 10,
} as const;

// ──── Market Hours (per exchange, UTC) ────
export const EXCHANGE_MARKET_HOURS: Record<string, { openUTC: { hour: number; minute: number }; closeUTC: { hour: number; minute: number }; timezone: string; weekdays: boolean }> = {
  // Americas
  NYSE:     { openUTC: { hour: 14, minute: 30 }, closeUTC: { hour: 21, minute: 0 },  timezone: "America/New_York", weekdays: true },
  NASDAQ:   { openUTC: { hour: 14, minute: 30 }, closeUTC: { hour: 21, minute: 0 },  timezone: "America/New_York", weekdays: true },
  TSX:      { openUTC: { hour: 14, minute: 30 }, closeUTC: { hour: 21, minute: 0 },  timezone: "America/Toronto",  weekdays: true },
  // Europe
  LSE:      { openUTC: { hour: 8,  minute: 0 },  closeUTC: { hour: 16, minute: 30 }, timezone: "Europe/London",    weekdays: true },
  XETRA:    { openUTC: { hour: 8,  minute: 0 },  closeUTC: { hour: 16, minute: 30 }, timezone: "Europe/Berlin",    weekdays: true },
  EURONEXT: { openUTC: { hour: 8,  minute: 0 },  closeUTC: { hour: 16, minute: 30 }, timezone: "Europe/Paris",     weekdays: true },
  // Asia-Pacific
  NSE:      { openUTC: { hour: 3,  minute: 45 }, closeUTC: { hour: 10, minute: 0 },  timezone: "Asia/Kolkata",     weekdays: true },
  BSE:      { openUTC: { hour: 3,  minute: 45 }, closeUTC: { hour: 10, minute: 0 },  timezone: "Asia/Kolkata",     weekdays: true },
  TSE:      { openUTC: { hour: 0,  minute: 0 },  closeUTC: { hour: 6,  minute: 0 },  timezone: "Asia/Tokyo",       weekdays: true },
  HKEX:     { openUTC: { hour: 1,  minute: 30 }, closeUTC: { hour: 8,  minute: 0 },  timezone: "Asia/Hong_Kong",   weekdays: true },
  ASX:      { openUTC: { hour: 0,  minute: 0 },  closeUTC: { hour: 6,  minute: 0 },  timezone: "Australia/Sydney", weekdays: true },
  KRX:      { openUTC: { hour: 0,  minute: 0 },  closeUTC: { hour: 6,  minute: 30 }, timezone: "Asia/Seoul",       weekdays: true },
  SGX:      { openUTC: { hour: 1,  minute: 0 },  closeUTC: { hour: 9,  minute: 0 },  timezone: "Asia/Singapore",   weekdays: true },
  // Other
  MCX:      { openUTC: { hour: 3,  minute: 45 }, closeUTC: { hour: 18, minute: 0 },  timezone: "Asia/Kolkata",     weekdays: true },
  // Crypto trades 24/7
  CRYPTO:   { openUTC: { hour: 0,  minute: 0 },  closeUTC: { hour: 23, minute: 59 }, timezone: "UTC",              weekdays: false },
  INDEX:    { openUTC: { hour: 0,  minute: 0 },  closeUTC: { hour: 23, minute: 59 }, timezone: "UTC",              weekdays: true },
};

// ──── Notifications ────
export const NOTIFICATION = {
  MAX_PER_PAGE: 50,
  POLLING_INTERVAL_MS: 30_000, // 30 seconds
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
} as const;

// Legacy compat — default market hours used when exchange is unknown
export const MARKET_HOURS = {
  NSE_OPEN: { hour: 9, minute: 15 },
  NSE_CLOSE: { hour: 15, minute: 30 },
  TIMEZONE: "Asia/Kolkata",
} as const;
