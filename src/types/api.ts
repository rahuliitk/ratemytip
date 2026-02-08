// src/types/api.ts
// API response envelope types used by all endpoints.

/** Successful API response wrapper */
interface ApiResponseMeta {
  readonly page?: number;
  readonly pageSize?: number;
  readonly total?: number;
  readonly hasMore?: boolean;
  readonly cursor?: string;
}

interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: ApiResponseMeta;
}

/** Error detail returned in failed API responses */
interface ApiErrorDetail {
  /** Machine-readable error code, e.g. "CREATOR_NOT_FOUND" */
  readonly code: string;
  /** Human-readable description of the error */
  readonly message: string;
  /** Optional additional context about the error */
  readonly details?: unknown;
}

interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorDetail;
}

/** Discriminated union covering both success and error responses */
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Pagination query parameters accepted by list endpoints */
interface PaginationParams {
  readonly page?: number;
  readonly pageSize?: number;
}

/** Sort direction for list endpoints */
type SortOrder = "asc" | "desc";

/** Leaderboard-specific query parameters */
interface LeaderboardParams extends PaginationParams {
  readonly category?: "all" | "intraday" | "swing" | "positional" | "long_term" | "options" | "crypto";
  readonly timeRange?: "30d" | "90d" | "1y" | "all";
  readonly minTips?: number;
  readonly sortBy?: "rmt_score" | "accuracy" | "return" | "total_tips";
  readonly sortOrder?: SortOrder;
}

/** Search query parameters */
interface SearchParams {
  readonly q: string;
  readonly type?: "all" | "creator" | "stock" | "tip";
  readonly limit?: number;
}

/** Combined search results returned by the search endpoint */
interface SearchResults {
  readonly creators: readonly import("./creator").CreatorSummary[];
  readonly stocks: readonly import("./stock").StockSummary[];
  readonly tips: readonly import("./tip").TipSummary[];
}

export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponseMeta,
  ApiErrorDetail,
  PaginationParams,
  SortOrder,
  LeaderboardParams,
  SearchParams,
  SearchResults,
};
