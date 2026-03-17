import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  readonly score: number;
  readonly size?: "sm" | "md" | "lg";
  readonly showLabel?: boolean;
}

const SCORE_COLORS = [
  { min: 90, color: "bg-emerald-600 text-white" },
  { min: 75, color: "bg-emerald-500 text-white" },
  { min: 60, color: "bg-blue-600 text-white" },
  { min: 45, color: "bg-amber-500 text-white" },
  { min: 30, color: "bg-red-500 text-white" },
  { min: 0, color: "bg-red-700 text-white" },
] as const;

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-base",
} as const;

function getScoreColor(score: number): string {
  for (const { min, color } of SCORE_COLORS) {
    if (score >= min) {
      return color;
    }
  }
  const last = SCORE_COLORS[SCORE_COLORS.length - 1];
  return last?.color ?? "bg-red-700 text-white";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 45) return "Average";
  if (score >= 30) return "Below Average";
  return "Poor";
}

export function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
}: ScoreBadgeProps): React.ReactElement {
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <span
      data-tour="score-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-bold tabular-nums",
        getScoreColor(clampedScore),
        SIZE_CLASSES[size]
      )}
    >
      <span>{clampedScore.toFixed(1)}</span>
      {showLabel && (
        <span className="font-normal opacity-90">
          {getScoreLabel(clampedScore)}
        </span>
      )}
    </span>
  );
}
