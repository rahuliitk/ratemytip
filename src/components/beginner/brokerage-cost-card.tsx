"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  calculateBrokerageCosts,
  SUPPORTED_BROKERS,
  TRADE_TYPES,
  type BrokerName,
  type BrokerageCostResult,
  type TradeType,
} from "@/lib/risk/brokerage-costs";

// ──── Constants ────

const BROKER_STORAGE_KEY = "ratemytip-preferred-broker";
const DEFAULT_BROKER: BrokerName = "Zerodha";

const BROKER_COLORS: Record<BrokerName, { bg: string; text: string; border: string }> = {
  Zerodha: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  Groww: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  "Angel One": {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  Upstox: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  "ICICI Direct": {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

const TRADE_TYPE_LABELS: Record<TradeType, string> = {
  INTRADAY: "Intraday",
  DELIVERY: "Delivery (CNC)",
};

// ──── Props ────

interface BrokerageCostCardProps {
  readonly entryPrice: number;
  readonly target1: number;
  readonly stockSymbol: string;
  readonly defaultQuantity?: number;
  readonly className?: string;
}

// ──── Helpers ────

function formatRupee(value: number): string {
  if (Math.abs(value) >= 10_000_000) {
    return `\u20B9${(value / 10_000_000).toFixed(2)} Cr`;
  }
  if (Math.abs(value) >= 100_000) {
    return `\u20B9${(value / 100_000).toFixed(2)} L`;
  }
  return `\u20B9${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isSupportedBroker(value: string): value is BrokerName {
  return (SUPPORTED_BROKERS as readonly string[]).includes(value);
}

// ──── Component ────

export function BrokerageCostCard({
  entryPrice,
  target1,
  stockSymbol,
  defaultQuantity,
  className,
}: BrokerageCostCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerName>(DEFAULT_BROKER);
  const [tradeType, setTradeType] = useState<TradeType>("DELIVERY");
  const [quantity, setQuantity] = useState<string>(
    defaultQuantity !== undefined && defaultQuantity > 0
      ? String(defaultQuantity)
      : "10"
  );
  const [mounted, setMounted] = useState(false);

  // Restore preferred broker from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BROKER_STORAGE_KEY);
      if (stored && isSupportedBroker(stored)) {
        setSelectedBroker(stored);
      }
    } catch {
      // localStorage unavailable (SSR or privacy mode)
    }
    setMounted(true);
  }, []);

  // Sync defaultQuantity when it changes (e.g. from position calculator)
  useEffect(() => {
    if (defaultQuantity !== undefined && defaultQuantity > 0) {
      setQuantity(String(defaultQuantity));
    }
  }, [defaultQuantity]);

  const handleBrokerChange = useCallback((broker: BrokerName) => {
    setSelectedBroker(broker);
    try {
      localStorage.setItem(BROKER_STORAGE_KEY, broker);
    } catch {
      // Ignore
    }
  }, []);

  const quantityNum = Math.max(0, Math.floor(Number(quantity) || 0));

  // Calculate costs
  const result: BrokerageCostResult | null =
    quantityNum > 0
      ? calculateBrokerageCosts({
          broker: selectedBroker,
          buyPrice: entryPrice,
          sellPrice: target1,
          quantity: quantityNum,
          tradeType,
        })
      : null;

  const brokerStyle = BROKER_COLORS[selectedBroker];

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-surface overflow-hidden",
        "transition-shadow duration-200",
        isExpanded && "shadow-sm",
        className
      )}
    >
      {/* ── Collapsible Header ── */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-bg-alt/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Currency / cost icon */}
          <svg
            className="h-5 w-5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
            />
          </svg>
          <span className="text-sm font-semibold text-text">
            Brokerage Cost Calculator
          </span>
          <span className="text-xs text-muted ml-1">
            for {stockSymbol}
          </span>
        </div>
        <svg
          className={cn(
            "h-4 w-4 text-muted transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* ── Expanded Content ── */}
      {isExpanded && mounted && (
        <div className="border-t border-border/60 p-4 space-y-5">
          {/* Broker Selector */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted uppercase tracking-wide">
              Select your broker
            </label>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_BROKERS.map((broker) => {
                const isSelected = broker === selectedBroker;
                const colors = BROKER_COLORS[broker];

                return (
                  <button
                    key={broker}
                    type="button"
                    onClick={() => handleBrokerChange(broker)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium",
                      "transition-all duration-150",
                      isSelected
                        ? cn(colors.bg, colors.text, colors.border, "ring-1 ring-offset-1", colors.border)
                        : "border-border/60 bg-surface text-muted hover:border-border hover:bg-bg-alt/50"
                    )}
                    aria-pressed={isSelected}
                  >
                    {broker}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trade Type Toggle */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted uppercase tracking-wide">
              Trade Type
            </label>
            <div className="flex gap-2">
              {TRADE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTradeType(type)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium",
                    "transition-all duration-150",
                    tradeType === type
                      ? cn(brokerStyle.bg, brokerStyle.text, brokerStyle.border)
                      : "border-border/60 bg-surface text-muted hover:border-border hover:bg-bg-alt/50"
                  )}
                  aria-pressed={tradeType === type}
                >
                  {TRADE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="bcc-quantity"
              className="text-sm font-medium text-text"
            >
              Quantity (shares)
            </label>
            <input
              id="bcc-quantity"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-text shadow-xs transition-colors placeholder:text-muted-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
            />
          </div>

          {/* Trade Setup Context */}
          <div className="rounded-lg bg-bg-alt/60 p-3 space-y-1">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">
              Trade Setup
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Buy (Entry)</span>
                <span className="font-medium tabular-nums text-text">
                  {"\u20B9"}{entryPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Sell (Target 1)</span>
                <span className="font-medium tabular-nums text-emerald-600">
                  {"\u20B9"}{target1.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Quantity</span>
                <span className="font-medium tabular-nums text-text">
                  {quantityNum > 0 ? quantityNum.toLocaleString("en-IN") : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Broker</span>
                <span className={cn("font-medium text-xs", brokerStyle.text)}>
                  {selectedBroker}
                </span>
              </div>
            </div>
          </div>

          {/* Results */}
          {result && quantityNum > 0 ? (
            <div className="space-y-4">
              {/* Cost Breakdown Table */}
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-alt/60">
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wide">
                        Charge
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted uppercase tracking-wide">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {result.lineItems.map((item) => (
                      <tr key={item.label} className="group">
                        <td className="px-3 py-2">
                          <p className="text-sm text-text">{item.label}</p>
                          <p className="text-[11px] text-muted leading-tight mt-0.5">
                            {item.description}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-sm font-medium text-text whitespace-nowrap">
                          {formatRupee(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-bg-alt/40 border-t border-border/60">
                      <td className="px-3 py-2.5 text-sm font-semibold text-text">
                        Total Costs
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-sm font-bold text-red-600 whitespace-nowrap">
                        {formatRupee(result.totalCosts)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard
                  label="Gross Profit"
                  value={formatRupee(result.grossProfit)}
                  variant={result.grossProfit >= 0 ? "success" : "danger"}
                />
                <SummaryCard
                  label="Net Profit After Costs"
                  value={formatRupee(result.netProfit)}
                  variant={result.netProfit >= 0 ? "success" : "danger"}
                  highlight
                />
              </div>

              {/* Cost as % of profit */}
              {result.costAsPercentOfGrossProfit !== null && (
                <div className="rounded-lg bg-bg-alt/60 p-3 flex items-center justify-between">
                  <span className="text-sm text-muted">
                    Costs eat
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      result.costAsPercentOfGrossProfit > 10
                        ? "text-red-600"
                        : result.costAsPercentOfGrossProfit > 5
                          ? "text-yellow-600"
                          : "text-green-600"
                    )}
                  >
                    {result.costAsPercentOfGrossProfit.toFixed(1)}% of your profit
                  </span>
                </div>
              )}

              {/* Cost % visual bar */}
              {result.costAsPercentOfGrossProfit !== null && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">
                      Cost Impact
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        getCostBarTextColor(result.costAsPercentOfGrossProfit)
                      )}
                    >
                      {result.costAsPercentOfGrossProfit.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        getCostBarColor(result.costAsPercentOfGrossProfit)
                      )}
                      style={{
                        width: `${Math.min(result.costAsPercentOfGrossProfit, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>0%</span>
                    <span className="text-yellow-600">5%</span>
                    <span className="text-red-600">10%</span>
                    <span>20%+</span>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="space-y-2">
                  {result.warnings.map((warning, idx) => (
                    <WarningBox key={idx} message={warning} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            quantityNum <= 0 && (
              <p className="text-sm text-muted text-center py-2">
                Enter a valid quantity above to see the cost breakdown.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ──── Sub-Components ────

interface SummaryCardProps {
  readonly label: string;
  readonly value: string;
  readonly variant?: "default" | "success" | "danger";
  readonly highlight?: boolean;
}

function SummaryCard({
  label,
  value,
  variant = "default",
  highlight = false,
}: SummaryCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        highlight
          ? "border-accent/40 bg-accent/5"
          : "border-border/60 bg-bg-alt/40"
      )}
    >
      <p className="text-[11px] font-medium text-muted uppercase tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums mt-0.5",
          variant === "success" && "text-green-600",
          variant === "danger" && "text-red-600",
          variant === "default" && "text-text"
        )}
      >
        {value}
      </p>
    </div>
  );
}

interface WarningBoxProps {
  readonly message: string;
}

function WarningBox({ message }: WarningBoxProps): React.ReactElement {
  const isStrong =
    message.includes("net loss") || message.includes("gross loss");

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs",
        isStrong
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-yellow-200 bg-yellow-50 text-yellow-700"
      )}
    >
      <svg
        className="h-4 w-4 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

// ──── Color Helpers ────

function getCostBarColor(pct: number): string {
  if (pct > 10) return "bg-red-500";
  if (pct > 5) return "bg-yellow-500";
  return "bg-green-500";
}

function getCostBarTextColor(pct: number): string {
  if (pct > 10) return "text-red-600";
  if (pct > 5) return "text-yellow-600";
  return "text-green-600";
}
