/**
 * Position Size Calculator
 *
 * Calculates optimal position size based on risk management principles.
 * Uses the fixed-percentage risk model: never risk more than a set % of
 * total capital on a single trade.
 */

export interface PositionSizeInput {
  readonly totalCapital: number;
  readonly riskPercentage: number; // default 2%
  readonly entryPrice: number;
  readonly stopLoss: number;
  readonly direction: "BUY" | "SELL";
}

export interface PositionSizeResult {
  readonly maxShares: number;
  readonly totalInvestment: number;
  readonly capitalUsedPct: number;
  readonly maxLoss: number;
  readonly riskPerShare: number;
  readonly riskRewardRatio: number | null; // null if no target provided
  readonly warnings: string[];
}

/**
 * Calculates the optimal position size for a given trade setup.
 *
 * @param input - The trade parameters including capital, risk %, entry, and stop loss
 * @param target1 - Optional first target price for risk/reward calculation
 * @returns Position sizing result with shares, investment, and risk metrics
 */
export function calculatePositionSize(
  input: PositionSizeInput,
  target1?: number
): PositionSizeResult {
  const { totalCapital, riskPercentage, entryPrice, stopLoss, direction } = input;
  const warnings: string[] = [];

  // Validate inputs
  if (totalCapital <= 0) {
    return createEmptyResult("Total capital must be greater than zero.");
  }

  if (riskPercentage <= 0 || riskPercentage > 100) {
    return createEmptyResult("Risk percentage must be between 0 and 100.");
  }

  if (entryPrice <= 0) {
    return createEmptyResult("Entry price must be greater than zero.");
  }

  if (stopLoss <= 0) {
    return createEmptyResult("Stop loss must be greater than zero.");
  }

  // Validate stop loss direction relative to entry
  if (direction === "BUY" && stopLoss >= entryPrice) {
    return createEmptyResult(
      "For a BUY trade, stop loss must be below the entry price."
    );
  }

  if (direction === "SELL" && stopLoss <= entryPrice) {
    return createEmptyResult(
      "For a SELL trade, stop loss must be above the entry price."
    );
  }

  // Core calculations
  const riskPerShare = Math.abs(entryPrice - stopLoss);
  const maxRiskAmount = totalCapital * (riskPercentage / 100);
  const maxShares = Math.floor(maxRiskAmount / riskPerShare);
  const totalInvestment = maxShares * entryPrice;
  const capitalUsedPct = (totalInvestment / totalCapital) * 100;
  const maxLoss = maxShares * riskPerShare;

  // Risk/reward ratio (only if target provided)
  let riskRewardRatio: number | null = null;
  if (target1 !== undefined && target1 > 0) {
    const rewardPerShare = Math.abs(target1 - entryPrice);
    riskRewardRatio =
      riskPerShare > 0
        ? Math.round((rewardPerShare / riskPerShare) * 100) / 100
        : null;
  }

  // Warnings
  if (maxShares === 0) {
    warnings.push(
      "Your capital is too small for this trade at the current risk settings. Consider increasing your capital or risk percentage."
    );
  }

  if (capitalUsedPct > 50) {
    warnings.push(
      "This trade uses over 50% of your capital. This is extremely concentrated and risky. Consider reducing your position size."
    );
  } else if (capitalUsedPct > 20) {
    warnings.push(
      "This trade uses over 20% of your capital. Consider diversifying across multiple positions."
    );
  }

  if (riskRewardRatio !== null && riskRewardRatio < 1) {
    warnings.push(
      "The risk/reward ratio is less than 1:1. The potential loss exceeds the potential gain."
    );
  }

  return {
    maxShares,
    totalInvestment,
    capitalUsedPct: Math.round(capitalUsedPct * 100) / 100,
    maxLoss: Math.round(maxLoss * 100) / 100,
    riskPerShare: Math.round(riskPerShare * 100) / 100,
    riskRewardRatio,
    warnings,
  };
}

function createEmptyResult(warning: string): PositionSizeResult {
  return {
    maxShares: 0,
    totalInvestment: 0,
    capitalUsedPct: 0,
    maxLoss: 0,
    riskPerShare: 0,
    riskRewardRatio: null,
    warnings: [warning],
  };
}
