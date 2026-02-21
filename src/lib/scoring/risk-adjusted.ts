// src/lib/scoring/risk-adjusted.ts
//
// Risk-Adjusted Return Score Calculator (Weight: 30% of RMT Score)
//
// Measures the quality of returns relative to risk taken on each tip.
// Uses the risk-reward ratio (actual return / risk taken) as the
// primary metric, then normalizes to a 0-100 score.
//
// Multi-target tips use weighted averages for return calculation.

import { TARGET_HIT_STATUSES, TIP_STATUS, SCORING } from "@/lib/constants";
import type {
  RiskAdjustedInput,
  RiskAdjustedOutput,
  TipReturnDetail,
  CompletedTip,
  TipStatusType,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isTargetHit(status: TipStatusType): boolean {
  return (TARGET_HIT_STATUSES as readonly string[]).includes(status);
}

/**
 * Calculates the effective return percentage for a single tip based on
 * its direction, status, and which targets were reached.
 *
 * For BUY tips:
 *   - Target hit: return based on closed price vs entry
 *   - Stop-loss hit: negative return = -(entry - stopLoss) / entry * 100
 *   - Expired: return based on closed price vs entry
 *
 * For SELL tips: logic is reversed (profit when price drops).
 *
 * Multi-target weighting:
 *   - 1 target only: 100% weight on target1
 *   - 2 targets: 50%/50% split
 *   - 3 targets: 33%/33%/34% split
 */
function calculateTipReturn(tip: CompletedTip): TipReturnDetail {
  const { entryPrice, stopLoss, direction, status, closedPrice } = tip;
  const isBuy = direction === "BUY";

  // Calculate risk percentage (always positive, represents max planned loss)
  const riskPct = isBuy
    ? ((entryPrice - stopLoss) / entryPrice) * 100
    : ((stopLoss - entryPrice) / entryPrice) * 100;

  // Guard against zero risk (would cause division by zero)
  const safeRiskPct = riskPct === 0 ? 0.01 : riskPct;

  let returnPct: number;
  let riskRewardRatio: number;

  if (status === TIP_STATUS.STOPLOSS_HIT) {
    // Full risk realized as a loss
    returnPct = isBuy
      ? -((entryPrice - stopLoss) / entryPrice) * 100
      : -((stopLoss - entryPrice) / entryPrice) * 100;
    riskRewardRatio = -1;
  } else if (isTargetHit(status)) {
    // Target was hit - calculate return from closed price
    returnPct = calculateTargetReturn(tip);
    riskRewardRatio = returnPct / safeRiskPct;
  } else {
    // Expired without hitting target or stoploss
    // Use closed price to determine actual return
    const price = closedPrice ?? entryPrice;
    returnPct = isBuy
      ? ((price - entryPrice) / entryPrice) * 100
      : ((entryPrice - price) / entryPrice) * 100;
    riskRewardRatio = returnPct / safeRiskPct;
  }

  return {
    tipId: tip.id,
    returnPct,
    riskPct: safeRiskPct,
    riskRewardRatio,
  };
}

/**
 * Calculates weighted return for a tip that hit targets.
 * Uses closed price and multi-target weighting based on how many targets were defined.
 */
function calculateTargetReturn(tip: CompletedTip): number {
  const { entryPrice, target1, target2, target3, direction, closedPrice, status } = tip;
  const isBuy = direction === "BUY";

  // Use closed price if available, otherwise fall back to target price
  const effectivePrice = closedPrice ?? target1;

  // If only target1 is defined (no multi-target)
  if (target2 === null && target3 === null) {
    return isBuy
      ? ((effectivePrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - effectivePrice) / entryPrice) * 100;
  }

  // Multi-target return: weighted average based on which targets were hit
  const t1Return = isBuy
    ? ((target1 - entryPrice) / entryPrice) * 100
    : ((entryPrice - target1) / entryPrice) * 100;

  // Two targets defined
  if (target2 !== null && target3 === null) {
    const t2Return = isBuy
      ? ((target2 - entryPrice) / entryPrice) * 100
      : ((entryPrice - target2) / entryPrice) * 100;

    // Only target 1 hit
    if (status === TIP_STATUS.TARGET_1_HIT) {
      return t1Return;
    }
    // Target 2 or all targets hit
    return 0.5 * t1Return + 0.5 * t2Return;
  }

  // Three targets defined
  if (target2 !== null && target3 !== null) {
    const t2Return = isBuy
      ? ((target2 - entryPrice) / entryPrice) * 100
      : ((entryPrice - target2) / entryPrice) * 100;
    const t3Return = isBuy
      ? ((target3 - entryPrice) / entryPrice) * 100
      : ((entryPrice - target3) / entryPrice) * 100;

    if (status === TIP_STATUS.TARGET_1_HIT) {
      return t1Return;
    }
    if (status === TIP_STATUS.TARGET_2_HIT) {
      return 0.5 * t1Return + 0.5 * t2Return;
    }
    // TARGET_3_HIT or ALL_TARGETS_HIT
    return 0.33 * t1Return + 0.33 * t2Return + 0.34 * t3Return;
  }

  // Fallback: simple return from closed price
  return isBuy
    ? ((effectivePrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - effectivePrice) / entryPrice) * 100;
}

/**
 * Calculates the risk-adjusted return score for a set of completed tips.
 *
 * Computes per-tip return and risk-reward ratios, then averages them.
 * The average risk-reward ratio is normalized to a 0-100 score using
 * a linear mapping:
 *   avg_rr = -2 --> score = 0
 *   avg_rr = +5 --> score = 100
 *
 * @param input - Completed tips to evaluate
 * @returns Risk-adjusted metrics and normalized score
 */
export function calculateRiskAdjustedReturn(input: RiskAdjustedInput): RiskAdjustedOutput {
  const { tips } = input;

  if (tips.length === 0) {
    return {
      avgReturnPct: 0,
      avgRiskRewardRatio: 0,
      riskAdjustedScore: 0,
      bestTipReturnPct: null,
      worstTipReturnPct: null,
      tipDetails: [],
    };
  }

  const tipDetails: TipReturnDetail[] = [];
  let totalReturnPct = 0;
  let totalRiskReward = 0;
  let bestReturn = -Infinity;
  let worstReturn = Infinity;

  for (const tip of tips) {
    const detail = calculateTipReturn(tip);
    tipDetails.push(detail);

    totalReturnPct += detail.returnPct;
    totalRiskReward += detail.riskRewardRatio;

    if (detail.returnPct > bestReturn) {
      bestReturn = detail.returnPct;
    }
    if (detail.returnPct < worstReturn) {
      worstReturn = detail.returnPct;
    }
  }

  const avgReturnPct = totalReturnPct / tips.length;
  const avgRiskRewardRatio = totalRiskReward / tips.length;

  // Normalize to 0-100 using the floor/ceiling from constants
  // avg_rr = RISK_ADJUSTED_FLOOR (-2) -> 0
  // avg_rr = RISK_ADJUSTED_CEILING (+5) -> 100
  const range = SCORING.RISK_ADJUSTED_CEILING - SCORING.RISK_ADJUSTED_FLOOR;
  const normalizedScore = clamp(
    ((avgRiskRewardRatio - SCORING.RISK_ADJUSTED_FLOOR) / range) * 100,
    0,
    100,
  );

  return {
    avgReturnPct,
    avgRiskRewardRatio,
    riskAdjustedScore: normalizedScore,
    bestTipReturnPct: bestReturn === -Infinity ? null : bestReturn,
    worstTipReturnPct: worstReturn === Infinity ? null : worstReturn,
    tipDetails,
  };
}
