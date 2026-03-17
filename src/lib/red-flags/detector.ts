// ──── Types ────

export type RedFlagSeverity = "WARNING" | "DANGER";

export interface RedFlag {
  readonly id: string;
  readonly severity: RedFlagSeverity;
  readonly title: string;
  readonly description: string;
  readonly evidence?: string;
}

export interface CreatorRedFlagReport {
  readonly creatorId: string;
  readonly flags: readonly RedFlag[];
  readonly transparencyScore: number; // 0-100 (higher = more transparent)
  readonly transparencyBreakdown: TransparencyBreakdown;
  readonly overallRisk: "LOW" | "MODERATE" | "HIGH";
}

export interface CreatorAnalysisData {
  readonly totalTips: number;
  readonly recentAccuracy: number; // 30-day accuracy (0-1)
  readonly allTimeAccuracy: number; // All-time accuracy (0-1)
  readonly smallCapPct: number; // Percentage of tips on small/micro cap stocks (0-1)
  readonly tipsWithoutSL: number; // Percentage of tips without proper stop loss (0-1)
  readonly avgTipsPerDay: number;
  readonly avgStockVolume: number; // Average daily traded volume of tipped stocks
  readonly buyPct: number; // Percentage of tips that are BUY direction (0-1)
}

// ──── Detection Thresholds ────

const ACCURACY_DROP_THRESHOLD = 0.20; // 20% drop triggers warning
const SMALL_CAP_THRESHOLD = 0.70; // >70% small cap triggers warning
const MISSING_SL_THRESHOLD = 0.30; // >30% without SL triggers danger
const EXCESSIVE_FREQUENCY_THRESHOLD = 5; // >5 tips per day triggers warning
const LOW_VOLUME_THRESHOLD = 100_000; // Avg volume below 1 lakh triggers warning
const ONE_SIDED_THRESHOLD = 0.90; // >90% BUY triggers warning

// ──── Penalty Points ────

const SEVERITY_PENALTY = {
  WARNING: 10,
  DANGER: 20,
} as const;

// ──── Detection Rules ────

function checkAccuracyDrop(data: CreatorAnalysisData): RedFlag | null {
  const drop = data.allTimeAccuracy - data.recentAccuracy;

  if (data.totalTips >= 20 && drop >= ACCURACY_DROP_THRESHOLD) {
    return {
      id: "accuracy-drop",
      severity: "WARNING",
      title: "Accuracy Drop Detected",
      description:
        "Recent 30-day accuracy is significantly below all-time accuracy, indicating deteriorating performance.",
      evidence: `30-day accuracy: ${(data.recentAccuracy * 100).toFixed(1)}% vs all-time: ${(data.allTimeAccuracy * 100).toFixed(1)}% (drop of ${(drop * 100).toFixed(1)}%)`,
    };
  }

  return null;
}

function checkSmallCapFocus(data: CreatorAnalysisData): RedFlag | null {
  if (data.smallCapPct > SMALL_CAP_THRESHOLD) {
    return {
      id: "small-cap-focus",
      severity: "WARNING",
      title: "Heavy Small Cap Focus",
      description:
        "Over 70% of tips target small or micro cap stocks, which carry higher manipulation risk and lower liquidity.",
      evidence: `${(data.smallCapPct * 100).toFixed(1)}% of tips are on small/micro cap stocks`,
    };
  }

  return null;
}

function checkMissingStopLosses(data: CreatorAnalysisData): RedFlag | null {
  if (data.tipsWithoutSL > MISSING_SL_THRESHOLD) {
    return {
      id: "missing-stop-losses",
      severity: "DANGER",
      title: "Missing Stop Losses",
      description:
        "A significant portion of tips do not include proper stop loss levels, exposing followers to unlimited downside risk.",
      evidence: `${(data.tipsWithoutSL * 100).toFixed(1)}% of tips lack a stop loss`,
    };
  }

  return null;
}

function checkExcessiveFrequency(data: CreatorAnalysisData): RedFlag | null {
  if (data.avgTipsPerDay > EXCESSIVE_FREQUENCY_THRESHOLD) {
    return {
      id: "excessive-frequency",
      severity: "WARNING",
      title: "Excessive Tip Frequency",
      description:
        "This creator posts an unusually high number of tips per day, which may indicate pump-and-dump activity or low-quality analysis.",
      evidence: `Average ${data.avgTipsPerDay.toFixed(1)} tips per day (threshold: ${EXCESSIVE_FREQUENCY_THRESHOLD})`,
    };
  }

  return null;
}

function checkLowVolumeStocks(data: CreatorAnalysisData): RedFlag | null {
  if (data.avgStockVolume > 0 && data.avgStockVolume < LOW_VOLUME_THRESHOLD) {
    return {
      id: "low-volume-stocks",
      severity: "WARNING",
      title: "Low Volume Stock Targets",
      description:
        "Tips frequently target low-volume stocks, which are susceptible to price manipulation and may have poor liquidity for exit.",
      evidence: `Average tipped stock volume: ${data.avgStockVolume.toLocaleString("en-IN")} (threshold: ${LOW_VOLUME_THRESHOLD.toLocaleString("en-IN")})`,
    };
  }

  return null;
}

function checkOneSided(data: CreatorAnalysisData): RedFlag | null {
  if (data.totalTips >= 10 && data.buyPct > ONE_SIDED_THRESHOLD) {
    return {
      id: "one-sided",
      severity: "WARNING",
      title: "One-Sided Recommendations",
      description:
        "Over 90% of tips are BUY recommendations with virtually no SELL or exit calls, suggesting a perpetual bullish bias regardless of market conditions.",
      evidence: `${(data.buyPct * 100).toFixed(1)}% of tips are BUY recommendations`,
    };
  }

  return null;
}

// ──── Transparency Score Calculation ────

/**
 * Breakdown of the transparency score for display in the UI.
 * Each criterion contributes up to its max points.
 */
export interface TransparencyBreakdown {
  /** Does the creator consistently provide stop losses? Max +25 */
  readonly stopLossScore: number;
  /** Does the creator provide rationale/analysis? Max +20 */
  readonly rationaleScore: number;
  /** Is the tip frequency consistent (not erratic)? Max +20 */
  readonly frequencyConsistencyScore: number;
  /** Does the creator tip a variety of stocks (not only small-cap)? Max +20 */
  readonly stockVarietyScore: number;
  /** Are there zero red flags detected? Max +15 */
  readonly cleanRecordScore: number;
  /** Final transparency score (0-100) */
  readonly total: number;
}

/**
 * Calculates a detailed transparency score (0-100) based on five
 * weighted criteria that reflect how transparent and responsible
 * a creator is with their tips.
 *
 * Criteria:
 *   1. Stop loss provision     (+25)  — inverse of tipsWithoutSL percentage
 *   2. Rationale provided      (+20)  — inferred from tip frequency & data quality
 *   3. Frequency consistency   (+20)  — lower avgTipsPerDay variance = better
 *   4. Stock variety           (+20)  — lower smallCapPct = more diverse picks
 *   5. No red flags            (+15)  — zero flags = full points
 */
function calculateTransparencyScore(
  data: CreatorAnalysisData,
  flags: readonly RedFlag[],
): TransparencyBreakdown {
  // 1. Stop loss score: 25 points max
  //    tipsWithoutSL is 0-1 (fraction without SL)
  //    Score = (1 - tipsWithoutSL) * 25
  const stopLossScore = Math.round((1 - data.tipsWithoutSL) * 25);

  // 2. Rationale score: 20 points max
  //    We don't have a direct "rationale" field on CreatorAnalysisData, so we
  //    use a heuristic: creators with moderate frequency (not spamming) and
  //    decent accuracy are more likely to provide quality analysis.
  //    If avgTipsPerDay <= 3 and allTimeAccuracy >= 0.5, give full points.
  //    Scale linearly otherwise.
  let rationaleScore = 20;
  if (data.avgTipsPerDay > 5) {
    // High-volume creators are less likely to provide rationale
    rationaleScore = Math.max(0, Math.round(20 * (1 - (data.avgTipsPerDay - 5) / 10)));
  }
  if (data.allTimeAccuracy < 0.4) {
    rationaleScore = Math.max(0, rationaleScore - 5);
  }

  // 3. Frequency consistency: 20 points max
  //    avgTipsPerDay <= 3 → full score
  //    avgTipsPerDay 3-5 → partial
  //    avgTipsPerDay > 5 → low
  let frequencyConsistencyScore: number;
  if (data.avgTipsPerDay <= 3) {
    frequencyConsistencyScore = 20;
  } else if (data.avgTipsPerDay <= 5) {
    frequencyConsistencyScore = Math.round(20 * (1 - (data.avgTipsPerDay - 3) / 4));
  } else {
    frequencyConsistencyScore = Math.max(0, Math.round(20 * (1 - (data.avgTipsPerDay - 5) / 10)));
  }

  // 4. Stock variety: 20 points max
  //    Lower small-cap percentage = more variety = higher score
  //    smallCapPct is 0-1
  //    0% small-cap → 20 points
  //    100% small-cap → 0 points
  const stockVarietyScore = Math.round((1 - data.smallCapPct) * 20);

  // 5. Clean record: 15 points max
  //    Zero flags → 15, each flag deducts based on severity
  let cleanRecordScore = 15;
  for (const flag of flags) {
    cleanRecordScore -= SEVERITY_PENALTY[flag.severity] >= 20 ? 10 : 5;
  }
  cleanRecordScore = Math.max(0, cleanRecordScore);

  const total = Math.min(
    100,
    Math.max(
      0,
      stopLossScore + rationaleScore + frequencyConsistencyScore + stockVarietyScore + cleanRecordScore,
    ),
  );

  return {
    stopLossScore,
    rationaleScore,
    frequencyConsistencyScore,
    stockVarietyScore,
    cleanRecordScore,
    total,
  };
}

// ──── Overall Risk Assessment ────

function assessOverallRisk(
  flags: readonly RedFlag[],
): "LOW" | "MODERATE" | "HIGH" {
  const dangerCount = flags.filter((f) => f.severity === "DANGER").length;
  const warningCount = flags.filter((f) => f.severity === "WARNING").length;

  if (dangerCount >= 2 || (dangerCount >= 1 && warningCount >= 2)) {
    return "HIGH";
  }

  if (dangerCount >= 1 || warningCount >= 2) {
    return "MODERATE";
  }

  return "LOW";
}

// ──── Main Detection Function ────

export async function detectRedFlags(
  creatorId: string,
  creatorData: CreatorAnalysisData,
): Promise<CreatorRedFlagReport> {
  const detectors = [
    checkAccuracyDrop,
    checkSmallCapFocus,
    checkMissingStopLosses,
    checkExcessiveFrequency,
    checkLowVolumeStocks,
    checkOneSided,
  ];

  const flags: RedFlag[] = [];

  for (const detect of detectors) {
    const flag = detect(creatorData);
    if (flag !== null) {
      flags.push(flag);
    }
  }

  const transparencyBreakdown = calculateTransparencyScore(creatorData, flags);
  const overallRisk = assessOverallRisk(flags);

  return {
    creatorId,
    flags,
    transparencyScore: transparencyBreakdown.total,
    transparencyBreakdown,
    overallRisk,
  };
}
