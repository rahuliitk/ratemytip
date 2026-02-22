import type { CreatorScoreData } from "@/types";

interface CreatorScoreBreakdownProps {
  readonly score: CreatorScoreData;
}

const COMPONENT_LABELS = [
  { key: "accuracyScore" as const, label: "Accuracy", weight: "40%", color: "bg-[#2B6CB0]" },
  { key: "riskAdjustedScore" as const, label: "Risk-Adjusted Return", weight: "30%", color: "bg-[#38A169]" },
  { key: "consistencyScore" as const, label: "Consistency", weight: "20%", color: "bg-[#C05621]" },
  { key: "volumeFactorScore" as const, label: "Volume Factor", weight: "10%", color: "bg-[#1A365D]" },
] as const;

export function CreatorScoreBreakdown({
  score,
}: CreatorScoreBreakdownProps): React.ReactElement {
  return (
    <div className="space-y-3">
      {COMPONENT_LABELS.map(({ key, label, weight, color }) => {
        const value = score[key];
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {label} <span className="text-xs opacity-70">({weight})</span>
              </span>
              <span className="font-semibold tabular-nums text-text">
                {value.toFixed(1)}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
