// src/lib/recommendations/types.ts

export interface RecommendedTip {
  tipId: string;
  score: number;
  reason: string;
}

export interface RecommendedCreator {
  creatorId: string;
  score: number;
  reason: string;
}
