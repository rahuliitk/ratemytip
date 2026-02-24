// src/types/tip.ts
// Types for Tip entities, matching the Prisma schema.

import type { CreatorSummary } from "./creator";
import type { StockSummary } from "./stock";

// ──── Enum mirrors (match Prisma enums exactly) ────

type TipDirection = "BUY" | "SELL";

type AssetClass =
  | "EQUITY"
  | "INDEX"
  | "FUTURES"
  | "OPTIONS"
  | "CRYPTO"
  | "COMMODITY"
  | "FOREX";

type TipTimeframe = "INTRADAY" | "SWING" | "POSITIONAL" | "LONG_TERM";

type Conviction = "LOW" | "MEDIUM" | "HIGH";

type TipStatus =
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "TARGET_1_HIT"
  | "TARGET_2_HIT"
  | "TARGET_3_HIT"
  | "ALL_TARGETS_HIT"
  | "STOPLOSS_HIT"
  | "EXPIRED"
  | "REJECTED";

type ReviewStatus =
  | "PENDING"
  | "AUTO_APPROVED"
  | "MANUALLY_APPROVED"
  | "REJECTED"
  | "NEEDS_EDIT";

// ──── Amendment record (logged change on a tip) ────

interface TipAmendmentData {
  readonly id: string;
  readonly field: string;
  readonly oldValue: string;
  readonly newValue: string;
  readonly reason: string | null;
  readonly amendedAt: string;
}

// ──── Tip summary (used in lists, feeds, search results) ────

interface TipSummary {
  readonly id: string;
  readonly creatorId: string;
  readonly stockId: string;
  readonly stockSymbol: string;
  readonly stockName: string;
  readonly direction: TipDirection;
  readonly assetClass: AssetClass;
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2: number | null;
  readonly target3: number | null;
  readonly stopLoss: number;
  readonly timeframe: TipTimeframe;
  readonly conviction: Conviction;
  readonly status: TipStatus;
  readonly tipTimestamp: string;
  readonly expiresAt: string;
  readonly returnPct: number | null;
  readonly sourceUrl: string | null;
}

// ──── Full tip detail (individual tip page) ────

interface TipDetail {
  readonly id: string;
  readonly creatorId: string;
  readonly stockId: string;
  readonly rawPostId: string | null;

  // Immutable tip data
  readonly direction: TipDirection;
  readonly assetClass: AssetClass;
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2: number | null;
  readonly target3: number | null;
  readonly stopLoss: number;
  readonly timeframe: TipTimeframe;
  readonly conviction: Conviction;
  readonly rationale: string | null;
  readonly sourceUrl: string | null;

  // Integrity
  readonly contentHash: string;
  readonly tipTimestamp: string;
  readonly priceAtTip: number | null;

  // Mutable status
  readonly status: TipStatus;
  readonly statusUpdatedAt: string | null;
  readonly target1HitAt: string | null;
  readonly target2HitAt: string | null;
  readonly target3HitAt: string | null;
  readonly stopLossHitAt: string | null;
  readonly expiresAt: string;
  readonly closedPrice: number | null;
  readonly closedAt: string | null;

  // Computed performance
  readonly returnPct: number | null;
  readonly riskRewardRatio: number | null;
  readonly maxDrawdownPct: number | null;

  // Review
  readonly reviewStatus: ReviewStatus;
  readonly reviewedAt: string | null;
  readonly reviewNote: string | null;
  readonly parseConfidence: number | null;

  // Timestamps
  readonly createdAt: string;
  readonly updatedAt: string;

  // Resolved relations
  readonly creator: CreatorSummary;
  readonly stock: StockSummary;
  readonly amendments: readonly TipAmendmentData[];

  // Live context
  readonly currentPrice: number | null;
}

// ──── Tip with creator info (used in public browse/feed views) ────

interface TipWithCreator {
  readonly id: string;
  readonly direction: TipDirection;
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2: number | null;
  readonly stopLoss: number;
  readonly timeframe: TipTimeframe;
  readonly status: TipStatus;
  readonly returnPct: number | null;
  readonly tipTimestamp: string;
  readonly stockSymbol: string;
  readonly stockName: string;
  readonly creator: {
    readonly id: string;
    readonly slug: string;
    readonly displayName: string;
    readonly profileImageUrl: string | null;
    readonly tier: string;
    readonly isVerified: boolean;
    readonly rmtScore: number | null;
  };
}

// ──── Completed tip (used internally by the scoring engine) ────

interface CompletedTip {
  readonly id: string;
  readonly direction: TipDirection;
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2: number | null;
  readonly target3: number | null;
  readonly stopLoss: number;
  readonly timeframe: TipTimeframe;
  readonly status: TipStatus;
  readonly tipTimestamp: string;
  readonly closedAt: string;
  readonly closedPrice: number | null;
  readonly returnPct: number | null;
  readonly riskRewardRatio: number | null;
}

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
  TipWithCreator,
  CompletedTip,
};
