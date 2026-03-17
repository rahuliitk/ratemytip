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

function calculateTransparencyScore(flags: readonly RedFlag[]): number {
  let penalty = 0;

  for (const flag of flags) {
    penalty += SEVERITY_PENALTY[flag.severity];
  }

  return Math.max(0, 100 - penalty);
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

  const transparencyScore = calculateTransparencyScore(flags);
  const overallRisk = assessOverallRisk(flags);

  return {
    creatorId,
    flags,
    transparencyScore,
    overallRisk,
  };
}
