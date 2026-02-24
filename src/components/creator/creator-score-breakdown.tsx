import type { CreatorScoreData } from "@/types";

interface CreatorScoreBreakdownProps {
  readonly score: CreatorScoreData;
}

const COMPONENT_LABELS = [
  { key: "accuracyScore" as const, label: "Accuracy", weight: "40%", gradient: "from-[#1A365D] to-[#2B6CB0]" },
  { key: "riskAdjustedScore" as const, label: "Risk-Adjusted Return", weight: "30%", gradient: "from-[#22543D] to-[#38A169]" },
  { key: "consistencyScore" as const, label: "Consistency", weight: "20%", gradient: "from-[#9C4221] to-[#ED8936]" },
  { key: "volumeFactorScore" as const, label: "Volume Factor", weight: "10%", gradient: "from-[#553C9A] to-[#805AD5]" },
] as const;

export function CreatorScoreBreakdown({
  score,
}: CreatorScoreBreakdownProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {COMPONENT_LABELS.map(({ key, label, weight, gradient }) => {
        const value = score[key];
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text">
                {label} <span className="text-xs text-muted">({weight})</span>
              </span>
              <span className="font-bold tabular-nums text-text">
                {value.toFixed(1)}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
