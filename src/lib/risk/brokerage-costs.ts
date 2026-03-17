/**
 * Brokerage Cost Calculator
 *
 * Calculates the full breakdown of trading costs for Indian brokers
 * including brokerage fee, STT, exchange transaction charges, GST,
 * SEBI charges, and stamp duty.
 *
 * Supports 5 major Indian brokers: Zerodha, Groww, Angel One, Upstox,
 * and ICICI Direct with both Intraday and Delivery (CNC) trade types.
 *
 * Reference fees as of 2025.
 */

// ──── Types ────

export type BrokerName =
  | "Zerodha"
  | "Groww"
  | "Angel One"
  | "Upstox"
  | "ICICI Direct";

export type TradeType = "INTRADAY" | "DELIVERY";

export type ExchangeName = "NSE" | "BSE";

export interface BrokerageCostInput {
  readonly broker: BrokerName;
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly quantity: number;
  readonly tradeType: TradeType;
  readonly exchange?: ExchangeName;
}

export interface CostLineItem {
  readonly label: string;
  readonly amount: number;
  readonly description: string;
}

export interface BrokerageCostResult {
  readonly broker: BrokerName;
  readonly tradeType: TradeType;
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly quantity: number;
  readonly turnover: number;
  readonly grossProfit: number;
  readonly lineItems: readonly CostLineItem[];
  readonly totalCosts: number;
  readonly netProfit: number;
  readonly costAsPercentOfGrossProfit: number | null; // null if gross profit <= 0
  readonly warnings: readonly string[];
}

// ──── Constants ────

/** STT rates */
const STT = {
  /** Delivery: 0.1% on both buy and sell turnover */
  DELIVERY_RATE: 0.001,
  /** Intraday: 0.025% on sell side only */
  INTRADAY_RATE: 0.00025,
} as const;

/** Exchange transaction charges (% of turnover) */
const EXCHANGE_TXN_CHARGES: Record<ExchangeName, number> = {
  NSE: 0.0000297, // 0.00297%
  BSE: 0.0000375, // 0.00375%
} as const;

/** GST rate on (brokerage + exchange txn charges) */
const GST_RATE = 0.18;

/** SEBI turnover fee: Rs 10 per crore of turnover */
const SEBI_CHARGE_PER_CRORE = 10;
const ONE_CRORE = 1_00_00_000;

/** Stamp duty on buy side: 0.015% */
const STAMP_DUTY_RATE = 0.00015;

/** Cost warning threshold: if costs > this % of gross profit, show warning */
const COST_WARNING_THRESHOLD_PCT = 10;

// ──── Broker Fee Configs ────

interface BrokerFeeConfig {
  /** Calculate brokerage for a single leg (buy or sell) given that leg's turnover */
  readonly calculateBrokerage: (
    legTurnover: number,
    tradeType: TradeType
  ) => number;
}

const BROKER_CONFIGS: Record<BrokerName, BrokerFeeConfig> = {
  Zerodha: {
    calculateBrokerage(legTurnover: number, tradeType: TradeType): number {
      if (tradeType === "DELIVERY") {
        // Zero brokerage on delivery trades
        return 0;
      }
      // Intraday: Rs 20 per order OR 0.03% of turnover, whichever is lower
      return Math.min(20, legTurnover * 0.0003);
    },
  },

  Groww: {
    calculateBrokerage(legTurnover: number, tradeType: TradeType): number {
      // Rs 20 per order for both intraday and delivery
      if (legTurnover <= 0) return 0;
      return 20;
    },
  },

  "Angel One": {
    calculateBrokerage(legTurnover: number, tradeType: TradeType): number {
      // Rs 20 per order for both intraday and delivery
      if (legTurnover <= 0) return 0;
      return 20;
    },
  },

  Upstox: {
    calculateBrokerage(legTurnover: number, tradeType: TradeType): number {
      if (tradeType === "DELIVERY") {
        // Rs 20 per order on delivery
        if (legTurnover <= 0) return 0;
        return 20;
      }
      // Intraday: Rs 20 per order OR 0.05% of turnover, whichever is lower
      return Math.min(20, legTurnover * 0.0005);
    },
  },

  "ICICI Direct": {
    calculateBrokerage(legTurnover: number, tradeType: TradeType): number {
      if (tradeType === "DELIVERY") {
        // 0.275% of turnover for delivery
        return legTurnover * 0.00275;
      }
      // 0.0275% of turnover for intraday
      return legTurnover * 0.000275;
    },
  },
} as const;

// ──── Core Calculator ────

/**
 * Calculates the complete cost breakdown for a trade on an Indian broker.
 *
 * @param input - Trade parameters: broker, buy/sell prices, quantity, trade type
 * @returns Full cost breakdown with line items, totals, and warnings
 */
export function calculateBrokerageCosts(
  input: BrokerageCostInput
): BrokerageCostResult {
  const {
    broker,
    buyPrice,
    sellPrice,
    quantity,
    tradeType,
    exchange = "NSE",
  } = input;

  const warnings: string[] = [];

  // Validate inputs
  if (buyPrice <= 0 || sellPrice <= 0 || quantity <= 0) {
    return createEmptyResult(input, "Prices and quantity must be greater than zero.");
  }

  const brokerConfig = BROKER_CONFIGS[broker];

  // Turnover calculations
  const buyTurnover = buyPrice * quantity;
  const sellTurnover = sellPrice * quantity;
  const totalTurnover = buyTurnover + sellTurnover;

  // Gross profit (before costs)
  const grossProfit = (sellPrice - buyPrice) * quantity;

  const lineItems: CostLineItem[] = [];

  // 1. Brokerage (buy leg + sell leg)
  const buyBrokerage = brokerConfig.calculateBrokerage(buyTurnover, tradeType);
  const sellBrokerage = brokerConfig.calculateBrokerage(sellTurnover, tradeType);
  const totalBrokerage = roundToTwo(buyBrokerage + sellBrokerage);
  lineItems.push({
    label: "Brokerage",
    amount: totalBrokerage,
    description:
      tradeType === "DELIVERY" && broker === "Zerodha"
        ? "Zero brokerage on delivery trades"
        : `Buy: ${formatRupee(buyBrokerage)} + Sell: ${formatRupee(sellBrokerage)}`,
  });

  // 2. STT (Securities Transaction Tax)
  let sttAmount: number;
  let sttDescription: string;
  if (tradeType === "DELIVERY") {
    // 0.1% on both buy and sell turnover
    sttAmount = roundToTwo(totalTurnover * STT.DELIVERY_RATE);
    sttDescription = `0.1% on total turnover (${formatRupee(totalTurnover)})`;
  } else {
    // Intraday: 0.025% on sell side only
    sttAmount = roundToTwo(sellTurnover * STT.INTRADAY_RATE);
    sttDescription = `0.025% on sell turnover (${formatRupee(sellTurnover)})`;
  }
  lineItems.push({
    label: "STT",
    amount: sttAmount,
    description: sttDescription,
  });

  // 3. Exchange Transaction Charges
  const exchangeRate = EXCHANGE_TXN_CHARGES[exchange];
  const exchangeChargePct = exchange === "NSE" ? "0.00297%" : "0.00375%";
  const exchangeCharges = roundToTwo(totalTurnover * exchangeRate);
  lineItems.push({
    label: `Exchange Txn (${exchange})`,
    amount: exchangeCharges,
    description: `${exchangeChargePct} on total turnover`,
  });

  // 4. GST (18% on brokerage + exchange txn charges)
  const gstBase = totalBrokerage + exchangeCharges;
  const gstAmount = roundToTwo(gstBase * GST_RATE);
  lineItems.push({
    label: "GST",
    amount: gstAmount,
    description: `18% on brokerage + txn charges (${formatRupee(gstBase)})`,
  });

  // 5. SEBI Charges (Rs 10 per crore of turnover)
  const sebiCharges = roundToTwo((totalTurnover / ONE_CRORE) * SEBI_CHARGE_PER_CRORE);
  lineItems.push({
    label: "SEBI Charges",
    amount: sebiCharges,
    description: `Rs 10 per crore of turnover`,
  });

  // 6. Stamp Duty (0.015% on buy side)
  const stampDuty = roundToTwo(buyTurnover * STAMP_DUTY_RATE);
  lineItems.push({
    label: "Stamp Duty",
    amount: stampDuty,
    description: `0.015% on buy turnover (${formatRupee(buyTurnover)})`,
  });

  // Totals
  const totalCosts = roundToTwo(
    totalBrokerage + sttAmount + exchangeCharges + gstAmount + sebiCharges + stampDuty
  );
  const netProfit = roundToTwo(grossProfit - totalCosts);

  // Cost as % of gross profit
  let costAsPercentOfGrossProfit: number | null = null;
  if (grossProfit > 0) {
    costAsPercentOfGrossProfit = roundToTwo((totalCosts / grossProfit) * 100);
  }

  // Warnings
  if (grossProfit <= 0) {
    warnings.push(
      "This trade results in a gross loss before costs. Transaction costs will add to your loss."
    );
  } else if (
    costAsPercentOfGrossProfit !== null &&
    costAsPercentOfGrossProfit > COST_WARNING_THRESHOLD_PCT
  ) {
    warnings.push(
      "Transaction costs make this tip less profitable for small positions. Consider increasing your position size or choosing a broker with lower fees."
    );
  }

  if (netProfit < 0 && grossProfit > 0) {
    warnings.push(
      "After all charges, this trade results in a net loss even though the stock price moved in your favour."
    );
  }

  return {
    broker,
    tradeType,
    buyPrice,
    sellPrice,
    quantity,
    turnover: roundToTwo(totalTurnover),
    grossProfit: roundToTwo(grossProfit),
    lineItems,
    totalCosts,
    netProfit,
    costAsPercentOfGrossProfit,
    warnings,
  };
}

// ──── Helpers ────

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatRupee(value: number): string {
  return `\u20B9${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function createEmptyResult(
  input: BrokerageCostInput,
  warning: string
): BrokerageCostResult {
  return {
    broker: input.broker,
    tradeType: input.tradeType,
    buyPrice: input.buyPrice,
    sellPrice: input.sellPrice,
    quantity: input.quantity,
    turnover: 0,
    grossProfit: 0,
    lineItems: [],
    totalCosts: 0,
    netProfit: 0,
    costAsPercentOfGrossProfit: null,
    warnings: [warning],
  };
}

/** All supported broker names (for use in UI dropdowns) */
export const SUPPORTED_BROKERS: readonly BrokerName[] = [
  "Zerodha",
  "Groww",
  "Angel One",
  "Upstox",
  "ICICI Direct",
] as const;

/** All supported trade types */
export const TRADE_TYPES: readonly TradeType[] = [
  "INTRADAY",
  "DELIVERY",
] as const;
