// src/types/creator.ts
// Types for Creator entities, matching the Prisma schema.

import type { CreatorScoreData } from "./score";
import type { TipSummary } from "./tip";
import type { ScoreSnapshotData } from "./score";

// ──── Enum mirrors (match Prisma enums exactly) ────

type CreatorTier = "UNRATED" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

type Platform = "TWITTER" | "YOUTUBE" | "TELEGRAM" | "WEBSITE";

// ──── Platform sub-type ────

interface CreatorPlatformInfo {
  readonly id: string;
  readonly platform: Platform;
  readonly platformHandle: string;
  readonly platformUrl: string;
  readonly followerCount: number;
}

// ──── Creator summary (used in lists, leaderboard rows, search results) ────

interface CreatorSummary {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly profileImageUrl: string | null;
  readonly tier: CreatorTier;
  readonly isVerified: boolean;
  readonly totalTips: number;
  readonly specializations: readonly string[];
}

// ──── Creator stats block (displayed on profile page) ────

interface CreatorStats {
  readonly totalTips: number;
  readonly activeTips: number;
  readonly completedTips: number;
  readonly winStreak: number;
  readonly lossStreak: number;
}

// ──── Full creator detail (profile page) ────

interface CreatorDetail {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly bio: string | null;
  readonly profileImageUrl: string | null;
  readonly isVerified: boolean;
  readonly isClaimed: boolean;
  readonly isActive: boolean;
  readonly tier: CreatorTier;
  readonly specializations: readonly string[];
  readonly followerCount: number;
  readonly firstTipAt: string | null;
  readonly lastTipAt: string | null;
  readonly createdAt: string;
  readonly platforms: readonly CreatorPlatformInfo[];
  readonly score: CreatorScoreData | null;
  readonly stats: CreatorStats;
  readonly recentTips: readonly TipSummary[];
  readonly scoreHistory: readonly ScoreSnapshotData[];
}

// ──── Leaderboard entry (one row on the leaderboard table) ────

interface LeaderboardScoreSummary {
  readonly rmtScore: number;
  readonly accuracyRate: number;
  readonly avgReturnPct: number;
  readonly confidenceInterval: number;
}

interface LeaderboardEntry {
  readonly rank: number;
  readonly creator: CreatorSummary;
  readonly score: LeaderboardScoreSummary;
  readonly totalTips: number;
  readonly tier: CreatorTier;
}

export type {
  CreatorTier,
  Platform,
  CreatorPlatformInfo,
  CreatorSummary,
  CreatorStats,
  CreatorDetail,
  LeaderboardScoreSummary,
  LeaderboardEntry,
};
