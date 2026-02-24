"use client";

import { useState } from "react";
import { TipCard } from "@/components/tip/tip-card";
import type { TipSummary } from "@/types";

interface StockTipFeedProps {
  readonly initialTips: readonly TipSummary[];
  readonly stockSymbol: string;
}

const FILTER_OPTIONS = ["ALL", "ACTIVE", "TARGET_HIT", "STOPLOSS_HIT", "EXPIRED"] as const;

export function StockTipFeed({
  initialTips,
  stockSymbol,
}: StockTipFeedProps): React.ReactElement {
  const [filter, setFilter] = useState<string>("ALL");

  const filteredTips = initialTips.filter((tip) => {
    if (filter === "ALL") return true;
    if (filter === "TARGET_HIT") {
      return (
        tip.status === "TARGET_1_HIT" ||
        tip.status === "TARGET_2_HIT" ||
        tip.status === "TARGET_3_HIT" ||
        tip.status === "ALL_TARGETS_HIT"
      );
    }
    return tip.status === filter;
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gradient-primary">
          Tips for {stockSymbol} ({filteredTips.length})
        </h2>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                filter === opt
                  ? "bg-white text-[#1A365D] shadow-[0_1px_2px_0_rgba(26,54,93,0.08)]"
                  : "text-muted hover:text-text"
              }`}
            >
              {opt === "ALL" ? "All" : opt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {filteredTips.length > 0 ? (
          filteredTips.map((tip) => (
            <TipCard key={tip.id} tip={tip} showCreator />
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            No tips match the selected filter.
          </p>
        )}
      </div>
    </div>
  );
}
