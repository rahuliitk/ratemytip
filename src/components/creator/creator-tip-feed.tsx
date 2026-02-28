"use client";

import { useState } from "react";
import { TipCard } from "@/components/tip/tip-card";
import type { TipSummary } from "@/types";

interface CreatorTipFeedProps {
  readonly initialTips: readonly TipSummary[];
  readonly creatorSlug: string;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "TARGET_1_HIT", label: "Target Hit" },
  { value: "STOPLOSS_HIT", label: "SL Hit" },
  { value: "EXPIRED", label: "Expired" },
];

export function CreatorTipFeed({
  initialTips,
}: CreatorTipFeedProps): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredTips = statusFilter === "all"
    ? initialTips
    : initialTips.filter((tip) => {
        if (statusFilter === "TARGET_1_HIT") {
          return (
            tip.status === "TARGET_1_HIT" ||
            tip.status === "TARGET_2_HIT" ||
            tip.status === "TARGET_3_HIT" ||
            tip.status === "ALL_TARGETS_HIT"
          );
        }
        return tip.status === statusFilter;
      });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gradient-primary">Tip History</h2>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-xl px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === filter.value
                  ? "bg-[#1A365D] text-white"
                  : "bg-[#F7FAFC] text-muted hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {filteredTips.length > 0 ? (
          filteredTips.map((tip) => (
            <TipCard key={tip.id} tip={tip} showCreator={false} />
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
