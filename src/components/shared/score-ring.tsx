import { cn } from "@/lib/utils";

interface ScoreRingProps {
  readonly score: number;
  readonly size?: "sm" | "md" | "lg";
  readonly confidenceInterval?: number;
  readonly className?: string;
}

const RING_SIZES = {
  sm: { svgSize: 64, strokeWidth: 4, fontSize: "text-sm", labelSize: "text-[8px]" },
  md: { svgSize: 96, strokeWidth: 5, fontSize: "text-xl", labelSize: "text-[10px]" },
  lg: { svgSize: 128, strokeWidth: 6, fontSize: "text-3xl", labelSize: "text-xs" },
} as const;

function getScoreHexColor(score: number): string {
  if (score >= 90) return "#276749";
  if (score >= 75) return "#2F855A";
  if (score >= 60) return "#2B6CB0";
  if (score >= 45) return "#C05621";
  if (score >= 30) return "#C53030";
  return "#9B2C2C";
}

export function ScoreRing({
  score,
  size = "md",
  confidenceInterval,
  className,
}: ScoreRingProps): React.ReactElement {
  const clampedScore = Math.max(0, Math.min(100, score));
  const config = RING_SIZES[size];
  const radius = (config.svgSize - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;
  const color = getScoreHexColor(clampedScore);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: config.svgSize, height: config.svgSize }}
    >
      <svg
        width={config.svgSize}
        height={config.svgSize}
        viewBox={`0 0 ${config.svgSize} ${config.svgSize}`}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.svgSize / 2}
          cy={config.svgSize / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={config.strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={config.svgSize / 2}
          cy={config.svgSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("font-bold tabular-nums", config.fontSize)}
          style={{ color }}
        >
          {clampedScore.toFixed(0)}
        </span>
        <span className={cn("font-medium text-[#718096]", config.labelSize)}>
          RMT Score
        </span>
        {confidenceInterval !== undefined && (
          <span className={cn("text-[#718096]", config.labelSize)}>
            &plusmn;{confidenceInterval.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
