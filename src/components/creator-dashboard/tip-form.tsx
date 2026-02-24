"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StockSearchInput } from "./stock-search-input";

export function TipForm(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stockSymbol, setStockSymbol] = useState("");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entryPrice, setEntryPrice] = useState("");
  const [target1, setTarget1] = useState("");
  const [target2, setTarget2] = useState("");
  const [target3, setTarget3] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [timeframe, setTimeframe] = useState("SWING");
  const [conviction, setConviction] = useState("MEDIUM");
  const [rationale, setRationale] = useState("");

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      stockSymbol: stockSymbol.toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      target1: parseFloat(target1),
      target2: target2 ? parseFloat(target2) : null,
      target3: target3 ? parseFloat(target3) : null,
      stopLoss: parseFloat(stopLoss),
      timeframe,
      conviction,
      rationale: rationale || undefined,
    };

    try {
      const res = await fetch("/api/v1/creator-dashboard/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/creator-dashboard/my-tips");
      } else {
        setError(data.error?.message ?? "Failed to create tip");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Stock Symbol */}
      <div>
        <label className="block text-sm font-medium text-text">Stock *</label>
        <div className="mt-1">
          <StockSearchInput value={stockSymbol} onChange={setStockSymbol} />
        </div>
      </div>

      {/* Direction */}
      <div>
        <label className="block text-sm font-medium text-text">Direction *</label>
        <div className="mt-1 flex gap-2">
          {(["BUY", "SELL"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                direction === d
                  ? d === "BUY"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                  : "bg-bg text-muted hover:bg-gray-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Price Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="entry-price" className="block text-sm font-medium text-text">
            Entry Price *
          </label>
          <input
            id="entry-price"
            type="number"
            step="0.01"
            required
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm tabular-nums focus:border-accent focus:outline-none"
            placeholder="0.00"
          />
        </div>
        <div>
          <label htmlFor="stop-loss" className="block text-sm font-medium text-text">
            Stop Loss *
          </label>
          <input
            id="stop-loss"
            type="number"
            step="0.01"
            required
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm tabular-nums focus:border-accent focus:outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="target1" className="block text-sm font-medium text-text">
            Target 1 *
          </label>
          <input
            id="target1"
            type="number"
            step="0.01"
            required
            value={target1}
            onChange={(e) => setTarget1(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm tabular-nums focus:border-accent focus:outline-none"
            placeholder="0.00"
          />
        </div>
        <div>
          <label htmlFor="target2" className="block text-sm font-medium text-text">
            Target 2
          </label>
          <input
            id="target2"
            type="number"
            step="0.01"
            value={target2}
            onChange={(e) => setTarget2(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm tabular-nums focus:border-accent focus:outline-none"
            placeholder="Optional"
          />
        </div>
        <div>
          <label htmlFor="target3" className="block text-sm font-medium text-text">
            Target 3
          </label>
          <input
            id="target3"
            type="number"
            step="0.01"
            value={target3}
            onChange={(e) => setTarget3(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm tabular-nums focus:border-accent focus:outline-none"
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Timeframe + Conviction */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="timeframe" className="block text-sm font-medium text-text">
            Timeframe *
          </label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="INTRADAY">Intraday</option>
            <option value="SWING">Swing (2-14 days)</option>
            <option value="POSITIONAL">Positional (15-90 days)</option>
            <option value="LONG_TERM">Long Term (90+ days)</option>
          </select>
        </div>
        <div>
          <label htmlFor="conviction" className="block text-sm font-medium text-text">
            Conviction
          </label>
          <select
            id="conviction"
            value={conviction}
            onChange={(e) => setConviction(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {/* Rationale */}
      <div>
        <label htmlFor="rationale" className="block text-sm font-medium text-text">
          Rationale (optional)
        </label>
        <textarea
          id="rationale"
          rows={3}
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          maxLength={2000}
          placeholder="Why are you making this call? Technical analysis, fundamental reasons..."
        />
        <p className="mt-1 text-xs text-muted">{rationale.length}/2000</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Tip"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>

      <p className="text-xs text-muted">
        Your tip will be submitted for admin review before becoming active. Core tip data (entry, targets, stop loss) cannot be changed after submission.
      </p>
    </form>
  );
}
