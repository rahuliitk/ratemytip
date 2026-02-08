// src/lib/scoring/volume-factor.ts
//
// Volume Factor Score Calculator (Weight: 10% of RMT Score)
//
// Rewards creators with more rated tips, reflecting higher
// statistical significance of their score. Uses a logarithmic
// scale so early tips contribute more than later ones (diminishing returns).
//
// Score mapping:
//   20 tips   -> ~39.4
//   50 tips   -> ~51.5
//   100 tips  -> ~60.6
//   500 tips  -> ~81.8
//   1000 tips -> ~90.9
//   2000 tips -> 100

import { SCORING } from "@/lib/constants";
import type { VolumeFactorInput, VolumeFactorOutput } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Calculates the volume factor score based on the total number of scored tips.
 *
 * Uses a logarithmic scale:
 *   volume_factor = log10(totalScoredTips) / log10(MAX_EXPECTED_TIPS)
 *
 * This produces a score that grows quickly for the first few hundred tips
 * and flattens out as the tip count approaches MAX_EXPECTED_TIPS (2000).
 *
 * @param input - Total number of scored (completed) tips for the creator
 * @returns Volume factor and normalized score (0-100)
 */
export function calculateVolumeFactor(input: VolumeFactorInput): VolumeFactorOutput {
  const { totalScoredTips } = input;

  // No tips or negative input: score is 0
  if (totalScoredTips <= 0) {
    return {
      volumeFactor: 0,
      volumeFactorScore: 0,
    };
  }

  // Special case: 1 tip would produce log10(1) = 0
  // Use max(tips, 1) to avoid log10(0) = -Infinity
  const logTips = Math.log10(totalScoredTips);
  const logMax = Math.log10(SCORING.MAX_EXPECTED_TIPS);

  const volumeFactor = logTips / logMax;
  const volumeFactorScore = clamp(volumeFactor * 100, 0, 100);

  return {
    volumeFactor,
    volumeFactorScore,
  };
}
