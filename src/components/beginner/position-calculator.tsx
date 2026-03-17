"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  calculatePositionSize,
  type PositionSizeResult,
} from "@/lib/risk/position-sizer";

// ──── Constants ────

const LOCAL_STORAGE_KEY = "ratemytip_user_capital";
const DEFAULT_RISK_PCT = 2;
const MIN_RISK_PCT = 1;
const MAX_RISK_PCT = 5;
const RISK_STEP = 0.5;

// ──── Props ────

interface PositionCalculatorProps {
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2?: number;
  readonly stopLoss: number;
  readonly direction: "BUY" | "SELL";
  readonly stockSymbol: string;
}

// ──── Helpers ────

function formatCurrency(value: number): string {
  if (value >= 10_000_000) {
    return `\u20B9${(value / 10_000_000).toFixed(2)} Cr`;
  }
  if (value >= 100_000) {
    return `\u20B9${(value / 100_000).toFixed(2)} L`;
  }
  return `\u20B9${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function getCapitalBarColor(pct: number): string {
  if (pct > 50) return "bg-red-500";
  if (pct > 20) return "bg-yellow-500";
  return "bg-green-500";
}

function getCapitalBarBg(pct: number): string {
  if (pct > 50) return "bg-red-100";
  if (pct > 20) return "bg-yellow-100";
  return "bg-green-100";
}

function getCapitalTextColor(pct: number): string {
  if (pct > 50) return "text-red-600";
  if (pct > 20) return "text-yellow-600";
  return "text-green-600";
}

// ──── Component ────

export function PositionCalculator({
  entryPrice,
  target1,
  stopLoss,
  direction,
  stockSymbol,
}: PositionCalculatorProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const [capital, setCapital] = React.useState<string>("");
  const [riskPct, setRiskPct] = React.useState<number>(DEFAULT_RISK_PCT);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

  // Load persisted capital from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (!Number.isNaN(parsed) && parsed > 0) {
          setCapital(String(parsed));
        }
      }
    } catch {
      // localStorage unavailable (SSR or privacy mode)
    }
  }, []);

  const capitalNumber = Number(capital) || 0;

  const result: PositionSizeResult | null =
    capitalNumber > 0
      ? calculatePositionSize(
          {
            totalCapital: capitalNumber,
            riskPercentage: riskPct,
            entryPrice,
            stopLoss,
            direction,
          },
          target1
        )
      : null;

  // Dispatch custom event when the calculator is meaningfully used (capital entered)
  React.useEffect(() => {
    if (capitalNumber > 0 && result) {
      try {
        window.dispatchEvent(new CustomEvent("ratemytip:position-calculator-used"));
      } catch {
        // Ignore dispatch errors
      }
    }
  }, [capitalNumber, result]);

  function handleSaveCapital(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, String(capitalNumber));
      setSavedMessage("Capital saved!");
      setTimeout(() => setSavedMessage(null), 2000);
    } catch {
      setSavedMessage("Could not save. Storage unavailable.");
      setTimeout(() => setSavedMessage(null), 3000);
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-surface shadow-sm overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-bg-alt/50 transition-colors"
      >
        <div className="flex items-center gap-2">
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
              d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008H15.75v-.008Zm0 2.25h.008v.008H15.75V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z"
            />
          </svg>
          <span className="text-sm font-semibold text-text">
            Position Size Calculator
          </span>
          <span className="text-xs text-muted ml-1">
            for {stockSymbol}
          </span>
        </div>
        <svg
          className={cn(
            "h-4 w-4 text-muted transition-transform duration-200",
            isOpen && "rotate-180"
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

      {/* Collapsible Body */}
      {isOpen && (
        <div className="border-t border-border/60 p-4 space-y-5">
          {/* Input: Total Capital */}
          <div className="space-y-1.5">
            <label
              htmlFor="psc-capital"
              className="text-sm font-medium text-text"
            >
              Total Capital
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                {"\u20B9"}
              </span>
              <input
                id="psc-capital"
                type="number"
                min={0}
                placeholder="e.g. 500000"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-surface pl-8 pr-3.5 py-2 text-sm text-text shadow-xs transition-colors placeholder:text-muted-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCapital}
                disabled={capitalNumber <= 0}
                className="text-xs text-accent hover:text-accent-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save my capital
              </button>
              {savedMessage && (
                <span className="text-xs text-green-600 animate-in fade-in">
                  {savedMessage}
                </span>
              )}
            </div>
          </div>

          {/* Input: Risk Per Trade % */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="psc-risk"
                className="text-sm font-medium text-text"
              >
                Risk Per Trade
              </label>
              <span className="text-sm font-semibold tabular-nums text-accent">
                {riskPct}%
              </span>
            </div>
            <input
              id="psc-risk"
              type="range"
              min={MIN_RISK_PCT}
              max={MAX_RISK_PCT}
              step={RISK_STEP}
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-bg-alt accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted">
              <span>{MIN_RISK_PCT}% (conservative)</span>
              <span>{MAX_RISK_PCT}% (aggressive)</span>
            </div>
          </div>

          {/* Tip Context */}
          <div className="rounded-lg bg-bg-alt/60 p-3 space-y-1">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">
              Trade Setup
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Direction</span>
                <span
                  className={cn(
                    "font-medium",
                    direction === "BUY" ? "text-green-600" : "text-red-600"
                  )}
                >
                  {direction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Entry</span>
                <span className="font-medium tabular-nums text-text">
                  {"\u20B9"}{entryPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Target 1</span>
                <span className="font-medium tabular-nums text-green-600">
                  {"\u20B9"}{target1.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Stop Loss</span>
                <span className="font-medium tabular-nums text-red-600">
                  {"\u20B9"}{stopLoss.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Results */}
          {result && capitalNumber > 0 ? (
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <ResultCard
                  label="Max Shares"
                  value={result.maxShares.toLocaleString("en-IN")}
                  highlight
                />
                <ResultCard
                  label="Total Investment"
                  value={formatCurrency(result.totalInvestment)}
                />
                <ResultCard
                  label="Max Loss"
                  value={formatCurrency(result.maxLoss)}
                  variant="danger"
                />
                <ResultCard
                  label="Risk Per Share"
                  value={`\u20B9${result.riskPerShare.toLocaleString("en-IN")}`}
                />
                {result.riskRewardRatio !== null && (
                  <ResultCard
                    label="Risk : Reward"
                    value={`1 : ${result.riskRewardRatio}`}
                    variant={result.riskRewardRatio >= 1 ? "success" : "danger"}
                  />
                )}
              </div>

              {/* Capital Usage Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">
                    Capital Usage
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      getCapitalTextColor(result.capitalUsedPct)
                    )}
                  >
                    {result.capitalUsedPct}%
                  </span>
                </div>
                <div
                  className={cn(
                    "relative h-3 w-full overflow-hidden rounded-full",
                    getCapitalBarBg(result.capitalUsedPct)
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      getCapitalBarColor(result.capitalUsedPct)
                    )}
                    style={{
                      width: `${Math.min(result.capitalUsedPct, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted">
                  <span>0%</span>
                  <span className="text-yellow-600">20%</span>
                  <span className="text-red-600">50%</span>
                  <span>100%</span>
                </div>
              </div>

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
            capitalNumber <= 0 && (
              <p className="text-sm text-muted text-center py-2">
                Enter your total capital above to see position sizing recommendations.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ──── Sub-Components ────

interface ResultCardProps {
  readonly label: string;
  readonly value: string;
  readonly variant?: "default" | "success" | "danger";
  readonly highlight?: boolean;
}

function ResultCard({
  label,
  value,
  variant = "default",
  highlight = false,
}: ResultCardProps): React.ReactElement {
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
    message.includes("over 50%") || message.includes("too small");

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
