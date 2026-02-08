import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const leaderboardQuerySchema = paginationSchema.extend({
  category: z.enum(["all", "intraday", "swing", "positional", "long_term", "options", "crypto"]).default("all"),
  timeRange: z.enum(["30d", "90d", "1y", "all"]).default("all"),
  minTips: z.coerce.number().int().min(0).default(20),
  sortBy: z.enum(["rmt_score", "accuracy", "return", "total_tips"]).default("rmt_score"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const creatorTipsQuerySchema = paginationSchema.extend({
  status: z.enum(["PENDING_REVIEW", "ACTIVE", "TARGET_1_HIT", "TARGET_2_HIT", "TARGET_3_HIT", "ALL_TARGETS_HIT", "STOPLOSS_HIT", "EXPIRED", "REJECTED"]).optional(),
  timeframe: z.enum(["INTRADAY", "SWING", "POSITIONAL", "LONG_TERM"]).optional(),
  assetClass: z.enum(["EQUITY_NSE", "EQUITY_BSE", "INDEX", "FUTURES", "OPTIONS", "CRYPTO", "COMMODITY"]).optional(),
  sortBy: z.enum(["tip_timestamp", "return_pct"]).default("tip_timestamp"),
});

export const tipsQuerySchema = paginationSchema.extend({
  creatorId: z.string().optional(),
  stockSymbol: z.string().optional(),
  status: z.enum(["PENDING_REVIEW", "ACTIVE", "TARGET_1_HIT", "TARGET_2_HIT", "TARGET_3_HIT", "ALL_TARGETS_HIT", "STOPLOSS_HIT", "EXPIRED", "REJECTED"]).optional(),
  direction: z.enum(["BUY", "SELL"]).optional(),
  timeframe: z.enum(["INTRADAY", "SWING", "POSITIONAL", "LONG_TERM"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["all", "creator", "stock", "tip"]).default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const scoreHistoryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(90),
});
