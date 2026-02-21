import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  readonly score: number;
  readonly size?: "sm" | "md" | "lg";
  readonly showLabel?: boolean;
}

const SCORE_COLORS = [
  { min: 90, color: "bg-[#276749] text-white" },
  { min: 75, color: "bg-[#2F855A] text-white" },
  { min: 60, color: "bg-[#2B6CB0] text-white" },
  { min: 45, color: "bg-[#C05621] text-white" },
  { min: 30, color: "bg-[#C53030] text-white" },
  { min: 0, color: "bg-[#9B2C2C] text-white" },
] as const;

const SIZE_CLASSES = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
} as const;

function getScoreColor(score: number): string {
  for (const { min, color } of SCORE_COLORS) {
    if (score >= min) {
      return color;
    }
  }
  const last = SCORE_COLORS[SCORE_COLORS.length - 1];
  return last?.color ?? "#9B2C2C";
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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-semibold tabular-nums",
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
