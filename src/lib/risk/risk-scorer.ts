/**
 * Risk Level Scorer
 *
 * Assesses the risk level of a stock tip based on multiple factors:
 * - Stop loss distance from entry (weight: 40%)
 * - Trading timeframe (weight: 35%)
 * - Market capitalization (weight: 25%)
 *
 * Produces a composite risk score (0-100) mapped to a risk level.
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface TipRiskAssessment {
  readonly riskLevel: RiskLevel;
  readonly riskScore: number; // 0-100 (higher = riskier)
  readonly factors: readonly RiskFactor[];
}

export interface RiskFactor {
  readonly name: string;
  readonly score: number; // 0-100
  readonly description: string;
}

export type Timeframe = "LONG_TERM" | "POSITIONAL" | "SWING" | "INTRADAY";

export type MarketCapCategory = "LARGE" | "MID" | "SMALL" | "MICRO";

export interface TipRiskInput {
  readonly entryPrice: number;
  readonly stopLoss: number;
  readonly direction: "BUY" | "SELL";
  readonly timeframe: Timeframe;
  readonly marketCap?: MarketCapCategory;
}

// Factor weights
const WEIGHT_SL_DISTANCE = 0.4;
const WEIGHT_TIMEFRAME = 0.35;
const WEIGHT_MARKET_CAP = 0.25;

/**
 * Scores the stop-loss distance as a percentage from entry.
 *
 * <2%       = LOW risk     (score 15)
 * 2% - 5%  = MEDIUM risk  (score 40)
 * 5% - 10% = HIGH risk    (score 70)
 * >10%     = VERY_HIGH    (score 90)
 */
function scoreSLDistance(entryPrice: number, stopLoss: number, direction: "BUY" | "SELL"): RiskFactor {
  const slDistancePct = (Math.abs(entryPrice - stopLoss) / entryPrice) * 100;

  let score: number;
  let description: string;

  if (slDistancePct < 2) {
    score = 15;
    description = `Stop loss is ${slDistancePct.toFixed(1)}% from entry (tight). Low risk.`;
  } else if (slDistancePct < 5) {
    score = 40;
    description = `Stop loss is ${slDistancePct.toFixed(1)}% from entry (moderate). Medium risk.`;
  } else if (slDistancePct < 10) {
    score = 70;
    description = `Stop loss is ${slDistancePct.toFixed(1)}% from entry (wide). High risk.`;
  } else {
    score = 90;
    description = `Stop loss is ${slDistancePct.toFixed(1)}% from entry (very wide). Very high risk.`;
  }

  return {
    name: "Stop Loss Distance",
    score,
    description,
  };
}

/**
 * Scores risk based on trading timeframe.
 *
 * LONG_TERM / POSITIONAL = LOW risk  (score 20)
 * SWING                  = MEDIUM    (score 50)
 * INTRADAY               = HIGH      (score 80)
 */
function scoreTimeframe(timeframe: Timeframe): RiskFactor {
  const timeframeScores: Record<Timeframe, { score: number; description: string }> = {
    LONG_TERM: {
      score: 20,
      description: "Long-term trades have more time for recovery. Low risk.",
    },
    POSITIONAL: {
      score: 25,
      description: "Positional trades have a comfortable time horizon. Low risk.",
    },
    SWING: {
      score: 50,
      description: "Swing trades have a moderate time horizon. Medium risk.",
    },
    INTRADAY: {
      score: 80,
      description: "Intraday trades require quick decisions and carry higher risk.",
    },
  };

  const entry = timeframeScores[timeframe];

  return {
    name: "Timeframe",
    score: entry.score,
    description: entry.description,
  };
}

/**
 * Scores risk based on market capitalization.
 *
 * LARGE = LOW risk   (score 15)
 * MID   = MEDIUM     (score 40)
 * SMALL = HIGH       (score 70)
 * MICRO = VERY_HIGH  (score 90)
 */
function scoreMarketCap(marketCap: MarketCapCategory): RiskFactor {
  const capScores: Record<MarketCapCategory, { score: number; description: string }> = {
    LARGE: {
      score: 15,
      description: "Large-cap stocks are well-established with lower volatility. Low risk.",
    },
    MID: {
      score: 40,
      description: "Mid-cap stocks have moderate liquidity and volatility. Medium risk.",
    },
    SMALL: {
      score: 70,
      description: "Small-cap stocks can be volatile with lower liquidity. High risk.",
    },
    MICRO: {
      score: 90,
      description: "Micro-cap stocks are highly volatile and illiquid. Very high risk.",
    },
  };

  const entry = capScores[marketCap];

  return {
    name: "Market Cap",
    score: entry.score,
    description: entry.description,
  };
}

/**
 * Maps a composite risk score (0-100) to a discrete risk level.
 *
 * 0-25   = LOW
 * 26-50  = MEDIUM
 * 51-75  = HIGH
 * 76-100 = VERY_HIGH
 */
function mapScoreToLevel(score: number): RiskLevel {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "VERY_HIGH";
}

/**
 * Assesses the risk level of a stock tip based on SL distance, timeframe,
 * and optionally market capitalization.
 *
 * When market cap is not provided, the weights are redistributed:
 * SL distance gets ~53% and timeframe gets ~47%.
 *
 * @param input - Tip data to assess
 * @returns Risk assessment with composite score, level, and factor breakdown
 */
export function assessTipRisk(input: TipRiskInput): TipRiskAssessment {
  const { entryPrice, stopLoss, direction, timeframe, marketCap } = input;

  const factors: RiskFactor[] = [];

  // Always compute SL distance and timeframe factors
  const slFactor = scoreSLDistance(entryPrice, stopLoss, direction);
  const timeframeFactor = scoreTimeframe(timeframe);
  factors.push(slFactor);
  factors.push(timeframeFactor);

  let compositeScore: number;

  if (marketCap !== undefined) {
    // All three factors available, use standard weights
    const marketCapFactor = scoreMarketCap(marketCap);
    factors.push(marketCapFactor);

    compositeScore =
      slFactor.score * WEIGHT_SL_DISTANCE +
      timeframeFactor.score * WEIGHT_TIMEFRAME +
      marketCapFactor.score * WEIGHT_MARKET_CAP;
  } else {
    // No market cap data: redistribute weight proportionally between SL and timeframe
    const totalWeight = WEIGHT_SL_DISTANCE + WEIGHT_TIMEFRAME;
    const adjustedSLWeight = WEIGHT_SL_DISTANCE / totalWeight;
    const adjustedTimeframeWeight = WEIGHT_TIMEFRAME / totalWeight;

    compositeScore =
      slFactor.score * adjustedSLWeight +
      timeframeFactor.score * adjustedTimeframeWeight;
  }

  // Clamp to 0-100 and round
  compositeScore = Math.round(Math.max(0, Math.min(100, compositeScore)));

  const riskLevel = mapScoreToLevel(compositeScore);

  return {
    riskLevel,
    riskScore: compositeScore,
    factors,
  };
}
