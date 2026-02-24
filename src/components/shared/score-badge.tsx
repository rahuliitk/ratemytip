import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  readonly score: number;
  readonly size?: "sm" | "md" | "lg";
  readonly showLabel?: boolean;
}

const SCORE_COLORS = [
  { min: 90, color: "bg-gradient-to-r from-[#22543D] to-[#38A169] text-white shadow-sm" },
  { min: 75, color: "bg-gradient-to-r from-[#276749] to-[#48BB78] text-white shadow-sm" },
  { min: 60, color: "bg-gradient-to-r from-[#1A365D] to-[#2B6CB0] text-white shadow-sm" },
  { min: 45, color: "bg-gradient-to-r from-[#9C4221] to-[#ED8936] text-white shadow-sm" },
  { min: 30, color: "bg-gradient-to-r from-[#9B2C2C] to-[#E53E3E] text-white shadow-sm" },
  { min: 0, color: "bg-gradient-to-r from-[#742A2A] to-[#C53030] text-white shadow-sm" },
] as const;

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-3.5 py-1.5 text-base",
} as const;

function getScoreColor(score: number): string {
  for (const { min, color } of SCORE_COLORS) {
    if (score >= min) {
      return color;
    }
  }
  const last = SCORE_COLORS[SCORE_COLORS.length - 1];
  return last?.color ?? "bg-[#9B2C2C] text-white";
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
        "inline-flex items-center gap-1.5 rounded-full font-bold tabular-nums",
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
