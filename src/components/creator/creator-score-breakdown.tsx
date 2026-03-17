import type { CreatorScoreData } from "@/types";

interface CreatorScoreBreakdownProps {
  readonly score: CreatorScoreData;
}

const COMPONENT_LABELS = [
  { key: "accuracyScore" as const, label: "Accuracy", weight: "40%", fillColor: "bg-accent" },
  { key: "riskAdjustedScore" as const, label: "Risk-Adjusted Return", weight: "30%", fillColor: "bg-success" },
  { key: "consistencyScore" as const, label: "Consistency", weight: "20%", fillColor: "bg-warning" },
  { key: "volumeFactorScore" as const, label: "Volume Factor", weight: "10%", fillColor: "bg-violet-500" },
] as const;

export function CreatorScoreBreakdown({
  score,
}: CreatorScoreBreakdownProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {COMPONENT_LABELS.map(({ key, label, weight, fillColor }) => {
        const value = score[key];
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-sm text-text">
                {label} <span className="text-xs text-muted">({weight})</span>
              </span>
              <span className="font-semibold tabular-nums text-text">
                {value.toFixed(1)}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-bg-alt">
              <div
                className={`h-full rounded-full ${fillColor} transition-all duration-700 ease-out`}
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
