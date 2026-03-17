"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// EXECUTION GUIDE — Collapsible broker-specific step-by-step
// instructions showing beginners how to actually execute a
// tip in their brokerage app.
// ═══════════════════════════════════════════════════════════

// ──── Types ────

type Broker = "Zerodha" | "Groww" | "Angel One" | "Upstox" | "ICICI Direct";

interface ExecutionGuideProps {
  readonly entryPrice: number;
  readonly target1: number;
  readonly stopLoss: number;
  readonly stockSymbol: string;
  readonly direction: "BUY" | "SELL";
  readonly className?: string;
}

// ──── Constants ────

const BROKER_STORAGE_KEY = "ratemytip-preferred-broker";

const BROKERS: readonly Broker[] = [
  "Zerodha",
  "Groww",
  "Angel One",
  "Upstox",
  "ICICI Direct",
] as const;

const BROKER_COLORS: Record<Broker, { bg: string; text: string; border: string }> = {
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

// ──── Broker-specific Step Generators ────

interface StepConfig {
  readonly searchAction: string;
  readonly orderPath: string;
  readonly slMethod: string;
  readonly targetMethod: string;
}

const BROKER_STEP_CONFIG: Record<Broker, StepConfig> = {
  Zerodha: {
    searchAction: "Open Kite app or kite.zerodha.com",
    orderPath: 'Click on the stock, then click "B" (Buy) or "S" (Sell)',
    slMethod: 'Select "SL" order type and enter trigger price',
    targetMethod: 'Place a separate "Limit" sell/buy order at your target price',
  },
  Groww: {
    searchAction: "Open Groww app and go to Stocks section",
    orderPath: 'Tap the stock, then tap "Buy" or "Sell"',
    slMethod: 'Enable "Stop Loss" toggle and enter the SL price',
    targetMethod: 'Place a separate limit order for profit booking at target',
  },
  "Angel One": {
    searchAction: "Open Angel One app or web platform",
    orderPath: 'Search for the stock, then select "Buy" or "Sell"',
    slMethod: 'Choose "SL" order type and enter trigger price',
    targetMethod: 'Use GTT (Good Till Triggered) order to set your target exit',
  },
  Upstox: {
    searchAction: "Open Upstox Pro app or web platform",
    orderPath: 'Find the stock, then choose "Buy" or "Sell"',
    slMethod: 'Select "SL" or "SL-M" order type and set trigger price',
    targetMethod: 'Place a separate limit order at your target price',
  },
  "ICICI Direct": {
    searchAction: "Open ICICIdirect app or website",
    orderPath: 'Go to "Trade" section, search the stock, click "Buy" or "Sell"',
    slMethod: 'Select "Stop Loss" order type and enter the SL trigger price',
    targetMethod: 'Use "Cover Order" or place a separate limit order at target',
  },
};

function generateSteps(
  broker: Broker,
  stockSymbol: string,
  direction: "BUY" | "SELL",
  entryPrice: number,
  stopLoss: number,
  target1: number
): readonly { title: string; detail: string }[] {
  const config = BROKER_STEP_CONFIG[broker];
  const dirLabel = direction === "BUY" ? "Buy" : "Sell";
  const formattedEntry = formatPrice(entryPrice);
  const formattedSL = formatPrice(stopLoss);
  const formattedTarget = formatPrice(target1);

  return [
    {
      title: `Open ${broker} and search for ${stockSymbol}`,
      detail: `${config.searchAction}. Search for "${stockSymbol}" in the search bar.`,
    },
    {
      title: `Select "${dirLabel}" and choose "Limit Order"`,
      detail: `${config.orderPath}. Choose "Limit Order" as the order type, then enter price ${formattedEntry}.`,
    },
    {
      title: "Enter quantity",
      detail: `Decide how many shares to buy based on your risk tolerance. A good rule: risk no more than 1-2% of your total capital on a single trade.`,
    },
    {
      title: `Set Stop Loss at ${formattedSL}`,
      detail: `${config.slMethod}. Set the stop-loss at ${formattedSL}. This automatically exits your position if the price moves against you.`,
    },
    {
      title: `Optionally set target exit at ${formattedTarget}`,
      detail: `${config.targetMethod}. Setting a target at ${formattedTarget} will auto-book profits when the price reaches your goal.`,
    },
  ] as const;
}

// ──── Helpers ────

function formatPrice(price: number): string {
  return `\u20B9${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ──── Component ────

export function ExecutionGuide({
  entryPrice,
  target1,
  stopLoss,
  stockSymbol,
  direction,
  className,
}: ExecutionGuideProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker>("Zerodha");
  const [mounted, setMounted] = useState(false);

  // Restore preferred broker from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BROKER_STORAGE_KEY);
      if (stored && BROKERS.includes(stored as Broker)) {
        setSelectedBroker(stored as Broker);
      }
    } catch {
      // Ignore
    }
    setMounted(true);
  }, []);

  const handleBrokerChange = useCallback((broker: Broker) => {
    setSelectedBroker(broker);
    try {
      localStorage.setItem(BROKER_STORAGE_KEY, broker);
    } catch {
      // Ignore
    }
  }, []);

  const steps = generateSteps(
    selectedBroker,
    stockSymbol,
    direction,
    entryPrice,
    stopLoss,
    target1
  );

  const brokerStyle = BROKER_COLORS[selectedBroker];

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white overflow-hidden",
        "transition-shadow duration-200",
        isExpanded && "shadow-md",
        className
      )}
    >
      {/* ── Collapsible Header ── */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3.5",
          "text-left transition-colors duration-150",
          "hover:bg-gray-50",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500"
        )}
      >
        <div className="flex items-center gap-2.5">
          {/* Clipboard icon */}
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              "bg-blue-50"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-blue-600"
              aria-hidden="true"
            >
              <rect x="9" y="2" width="6" height="4" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M12 11h4" />
              <path d="M12 16h4" />
              <path d="M8 11h.01" />
              <path d="M8 16h.01" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">
              How to Execute This Tip
            </span>
            <span className="ml-2 hidden text-xs text-gray-400 sm:inline">
              Step-by-step for your broker
            </span>
          </div>
        </div>

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* ── Expanded Content ── */}
      {isExpanded && mounted && (
        <div className="border-t border-gray-100 px-4 pb-5 pt-4">
          {/* Broker Selector */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Select your broker
            </label>
            <div className="flex flex-wrap gap-2">
              {BROKERS.map((broker) => {
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
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    )}
                    aria-pressed={isSelected}
                  >
                    {broker}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                {/* Step number + connector line */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                      "text-xs font-bold",
                      brokerStyle.bg,
                      brokerStyle.text,
                      "border",
                      brokerStyle.border
                    )}
                  >
                    {index + 1}
                  </div>
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="mt-1 mb-1 w-px flex-1 bg-gray-200" />
                  )}
                </div>

                {/* Step content */}
                <div className={cn("pb-5", index === steps.length - 1 && "pb-0")}>
                  <p className="text-sm font-medium text-gray-900 leading-snug">
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Risk Warning Footer */}
          <div
            className={cn(
              "mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3"
            )}
          >
            {/* Warning icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs leading-relaxed text-amber-800">
              <span className="font-semibold">Important:</span> Never invest
              more than you can afford to lose. Past performance of any tip
              creator does not guarantee future results. Always do your own
              research before trading.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
