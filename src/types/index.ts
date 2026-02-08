// src/types/index.ts
// Central re-export for all application types.

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
} from "./api";

export type {
  CreatorTier,
  Platform,
  CreatorPlatformInfo,
  CreatorSummary,
  CreatorStats,
  CreatorDetail,
  LeaderboardScoreSummary,
  LeaderboardEntry,
} from "./creator";

export type {
  TipDirection,
  AssetClass,
  TipTimeframe,
  Conviction,
  TipStatus,
  ReviewStatus,
  TipAmendmentData,
  TipSummary,
  TipDetail,
  CompletedTip,
} from "./tip";

export type {
  CreatorScoreData,
  ScoreSnapshotData,
  AccuracyInput,
  AccuracyOutput,
  RiskAdjustedInput,
  RiskAdjustedOutput,
  ConsistencyInput,
  ConsistencyOutput,
  VolumeFactorInput,
  VolumeFactorOutput,
  CompositeScoreInput,
  CompositeScoreOutput,
} from "./score";

export type {
  Exchange,
  MarketCap,
  StockPriceData,
  StockSummary,
  StockConsensus,
  StockDetail,
} from "./stock";
