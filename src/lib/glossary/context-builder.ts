// ═══════════════════════════════════════════════════════════
// CONTEXT BUILDER — Generates contextual explanations for a
// specific tip using its actual numbers (entry, targets, SL)
// ═══════════════════════════════════════════════════════════

/**
 * Represents the core numeric data of a single tip.
 * All prices are in INR.
 */
interface TipData {
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2: number | null;
  readonly target3: number | null;
  readonly stopLoss: number;
  readonly direction: "BUY" | "SELL";
}

export interface ContextualExplanation {
  readonly term: string;
  readonly explanation: string;
}

/**
 * Formats a number as INR with commas (no paise if whole number).
 */
function formatINR(value: number): string {
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Builds contextual explanations for a given tip using its
 * real numbers. Returns an array of {term, explanation} objects
 * that can be displayed inline on the tip detail page.
 *
 * Covers: Stop Loss, Target 1, Risk-Reward Ratio, and a
 * Position Size hint.
 */
export function buildContextualExplanations(
  tip: TipData,
): readonly ContextualExplanation[] {
  const explanations: ContextualExplanation[] = [];

  const isBuy = tip.direction === "BUY";

  // ──── 1. Stop Loss explanation ────
  const slRisk = isBuy
    ? tip.entryPrice - tip.stopLoss
    : tip.stopLoss - tip.entryPrice;
  const slRiskPct = (slRisk / tip.entryPrice) * 100;

  explanations.push({
    term: "Stop Loss",
    explanation:
      `If the stock moves against you and reaches ${formatINR(tip.stopLoss)}, ` +
      `you should exit the trade to limit your loss. ` +
      `From the entry price of ${formatINR(tip.entryPrice)}, ` +
      `this means a maximum loss of ${formatINR(slRisk)} per share (${slRiskPct.toFixed(1)}%). ` +
      `Never remove or widen your stop loss after entering the trade.`,
  });

  // ──── 2. Target 1 explanation ────
  const t1Reward = isBuy
    ? tip.target1 - tip.entryPrice
    : tip.entryPrice - tip.target1;
  const t1RewardPct = (t1Reward / tip.entryPrice) * 100;

  let targetExplanation =
    `Target 1 at ${formatINR(tip.target1)} is the first profit-booking level. ` +
    `If the stock reaches this price, you gain ${formatINR(t1Reward)} per share (${t1RewardPct.toFixed(1)}%) ` +
    `from your entry at ${formatINR(tip.entryPrice)}.`;

  if (tip.target2 !== null) {
    targetExplanation +=
      ` Consider booking 50% of your position here and trailing the stop loss for the remaining shares toward Target 2 at ${formatINR(tip.target2)}.`;
  } else {
    targetExplanation +=
      ` Since there is only one target, consider exiting your full position here.`;
  }

  explanations.push({
    term: "Target 1",
    explanation: targetExplanation,
  });

  // ──── 3. Risk-Reward Ratio ────
  const rrRatio = slRisk > 0 ? t1Reward / slRisk : 0;

  let rrQuality: string;
  if (rrRatio >= 3) {
    rrQuality = "Excellent — you stand to gain significantly more than you risk.";
  } else if (rrRatio >= 2) {
    rrQuality = "Good — the potential reward is at least double the risk.";
  } else if (rrRatio >= 1.5) {
    rrQuality = "Acceptable — but consider if the probability justifies this ratio.";
  } else if (rrRatio >= 1) {
    rrQuality = "Marginal — the reward barely exceeds the risk. Be cautious.";
  } else {
    rrQuality = "Poor — you are risking more than you could gain. Think twice before entering.";
  }

  explanations.push({
    term: "Risk-Reward Ratio",
    explanation:
      `For this tip, the risk is ${formatINR(slRisk)} (entry ${formatINR(tip.entryPrice)} to SL ${formatINR(tip.stopLoss)}) ` +
      `and the reward to Target 1 is ${formatINR(t1Reward)} (entry to ${formatINR(tip.target1)}). ` +
      `That gives a risk-reward ratio of 1:${rrRatio.toFixed(1)}. ${rrQuality}`,
  });

  // ──── 4. Target 2 explanation (if present) ────
  if (tip.target2 !== null) {
    const t2Reward = isBuy
      ? tip.target2 - tip.entryPrice
      : tip.entryPrice - tip.target2;
    const t2RewardPct = (t2Reward / tip.entryPrice) * 100;

    let t2Explanation =
      `Target 2 at ${formatINR(tip.target2)} gives you ${formatINR(t2Reward)} per share (${t2RewardPct.toFixed(1)}%) ` +
      `from your entry at ${formatINR(tip.entryPrice)}.`;

    if (tip.target3 !== null) {
      t2Explanation +=
        ` Consider booking another portion of your position here and trailing the stop loss for the rest toward Target 3 at ${formatINR(tip.target3)}.`;
    } else {
      t2Explanation +=
        ` Since this is the final target, consider exiting your remaining position here.`;
    }

    explanations.push({
      term: "Target 2",
      explanation: t2Explanation,
    });
  }

  // ──── 5. Target 3 explanation (if present) ────
  if (tip.target3 !== null) {
    const t3Reward = isBuy
      ? tip.target3 - tip.entryPrice
      : tip.entryPrice - tip.target3;
    const t3RewardPct = (t3Reward / tip.entryPrice) * 100;

    explanations.push({
      term: "Target 3",
      explanation:
        `Target 3 at ${formatINR(tip.target3)} is the most optimistic profit level. ` +
        `If all targets are hit, your gain from entry would be ${formatINR(t3Reward)} per share (${t3RewardPct.toFixed(1)}%). ` +
        `This is the final target — exit your full remaining position here.`,
    });
  }

  // ──── 6. Position Size hint ────
  // Using a simple 2% portfolio risk rule as an illustration.
  const EXAMPLE_PORTFOLIO = 100_000; // ₹1,00,000
  const MAX_RISK_PCT = 2; // 2% risk per trade
  const maxRiskAmount = (EXAMPLE_PORTFOLIO * MAX_RISK_PCT) / 100;
  const suggestedQty = slRisk > 0 ? Math.floor(maxRiskAmount / slRisk) : 0;
  const positionValue = suggestedQty * tip.entryPrice;

  explanations.push({
    term: "Position Size Hint",
    explanation:
      `Using the common 2% risk rule on a ₹1,00,000 portfolio: ` +
      `you would risk at most ${formatINR(maxRiskAmount)} on this trade. ` +
      `With a per-share risk of ${formatINR(slRisk)} (entry ${formatINR(tip.entryPrice)} minus SL ${formatINR(tip.stopLoss)}), ` +
      `you could buy approximately ${suggestedQty} shares ` +
      `(position value: ${formatINR(positionValue)}). ` +
      `Adjust this number based on your actual portfolio size and risk appetite.`,
  });

  // ──── 7. Scenario P&L (concrete money example with 10 shares) ────
  const EXAMPLE_QTY = 10;
  const maxLossTotal = slRisk * EXAMPLE_QTY;
  const t1ProfitTotal = t1Reward * EXAMPLE_QTY;

  let scenarioText =
    `If you buy ${EXAMPLE_QTY} shares at ${formatINR(tip.entryPrice)}, ` +
    `your total investment would be ${formatINR(EXAMPLE_QTY * tip.entryPrice)}. ` +
    `Your maximum loss (if stop loss is hit) would be ${formatINR(maxLossTotal)}. ` +
    `If Target 1 is hit, your profit would be ${formatINR(t1ProfitTotal)}.`;

  if (tip.target2 !== null) {
    const t2ProfitTotal = (isBuy ? tip.target2 - tip.entryPrice : tip.entryPrice - tip.target2) * EXAMPLE_QTY;
    scenarioText += ` If Target 2 is also hit, your profit would be ${formatINR(t2ProfitTotal)}.`;
  }

  if (tip.target3 !== null) {
    const t3ProfitTotal = (isBuy ? tip.target3 - tip.entryPrice : tip.entryPrice - tip.target3) * EXAMPLE_QTY;
    scenarioText += ` If all three targets are hit, your profit would be ${formatINR(t3ProfitTotal)}.`;
  }

  explanations.push({
    term: "Scenario (10 Shares)",
    explanation: scenarioText,
  });

  return explanations;
}
