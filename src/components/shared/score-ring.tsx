import { cn } from "@/lib/utils";

interface ScoreRingProps {
  readonly score: number;
  readonly size?: "sm" | "md" | "lg";
  readonly confidenceInterval?: number;
  readonly className?: string;
}

const RING_SIZES = {
  sm: { svgSize: 72, strokeWidth: 4, glowStroke: 8, fontSize: "text-base", labelSize: "text-[8px]" },
  md: { svgSize: 108, strokeWidth: 5, glowStroke: 12, fontSize: "text-2xl", labelSize: "text-[10px]" },
  lg: { svgSize: 144, strokeWidth: 6, glowStroke: 16, fontSize: "text-4xl", labelSize: "text-xs" },
} as const;

function getScoreGradient(score: number): { start: string; end: string } {
  if (score >= 90) return { start: "#22543D", end: "#38A169" };
  if (score >= 75) return { start: "#276749", end: "#48BB78" };
  if (score >= 60) return { start: "#1A365D", end: "#2B6CB0" };
  if (score >= 45) return { start: "#9C4221", end: "#ED8936" };
  if (score >= 30) return { start: "#9B2C2C", end: "#E53E3E" };
  return { start: "#742A2A", end: "#C53030" };
}

let instanceCounter = 0;

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
  const gradient = getScoreGradient(clampedScore);
  const gradientId = `score-gradient-${++instanceCounter}`;

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
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradient.start} />
            <stop offset="100%" stopColor={gradient.end} />
          </linearGradient>
        </defs>
        {/* Background track circle */}
        <circle
          cx={config.svgSize / 2}
          cy={config.svgSize / 2}
          r={radius}
          fill="none"
          stroke="#EDF2F7"
          strokeWidth={config.strokeWidth - 1}
        />
        {/* Glow circle behind score arc */}
        <circle
          cx={config.svgSize / 2}
          cy={config.svgSize / 2}
          r={radius}
          fill="none"
          stroke={gradient.end}
          strokeWidth={config.glowStroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity={0.15}
          className="animate-score-ring"
          style={{ "--ring-circumference": circumference, "--ring-offset": offset, filter: "blur(4px)" } as React.CSSProperties}
        />
        {/* Score arc with gradient */}
        <circle
          cx={config.svgSize / 2}
          cy={config.svgSize / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-score-ring"
          style={{ "--ring-circumference": circumference, "--ring-offset": offset } as React.CSSProperties}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("font-bold tabular-nums text-gradient-primary", config.fontSize)}
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
