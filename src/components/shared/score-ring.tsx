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
  if (score >= 90) return { start: "#059669", end: "#10B981" };
  if (score >= 75) return { start: "#059669", end: "#34D399" };
  if (score >= 60) return { start: "#2563EB", end: "#3B82F6" };
  if (score >= 45) return { start: "#D97706", end: "#F59E0B" };
  if (score >= 30) return { start: "#DC2626", end: "#EF4444" };
  return { start: "#991B1B", end: "#DC2626" };
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
        {/* Background track */}
        <circle
          cx={config.svgSize / 2}
          cy={config.svgSize / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={config.strokeWidth - 1}
        />
        {/* Glow circle */}
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
          opacity={0.12}
          className="animate-score-ring"
          style={{ "--ring-circumference": circumference, "--ring-offset": offset, filter: "blur(4px)" } as React.CSSProperties}
        />
        {/* Score arc */}
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
          className={cn("font-bold tabular-nums text-text", config.fontSize)}
        >
          {clampedScore.toFixed(0)}
        </span>
        <span className={cn("font-medium text-muted", config.labelSize)}>
          RMT Score
        </span>
        {confidenceInterval !== undefined && (
          <span className={cn("text-muted", config.labelSize)}>
            &plusmn;{confidenceInterval.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
