import { Target, TrendingUp, BarChart3, Flame } from "lucide-react";
import type { CreatorScoreData, CreatorStats as CreatorStatsType } from "@/types";

interface CreatorStatsProps {
  readonly stats: CreatorStatsType;
  readonly score: CreatorScoreData | null;
}

export function CreatorStats({ stats, score }: CreatorStatsProps): React.ReactElement {
  const cards = [
    {
      label: "Accuracy Rate",
      value: score ? `${(score.accuracyRate * 100).toFixed(1)}%` : "-",
      icon: Target,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-600",
    },
    {
      label: "Avg Return",
      value: score ? `${score.avgReturnPct >= 0 ? "+" : ""}${score.avgReturnPct.toFixed(1)}%` : "-",
      icon: TrendingUp,
      iconBg: score && score.avgReturnPct >= 0 ? "bg-emerald-50" : "bg-danger-light",
      iconColor: score && score.avgReturnPct >= 0 ? "text-emerald-600" : "text-danger",
      valueColor: score && score.avgReturnPct >= 0 ? "text-emerald-600" : "text-danger",
    },
    {
      label: "Total Tips",
      value: stats.totalTips.toString(),
      icon: BarChart3,
      iconBg: "bg-accent-subtle",
      iconColor: "text-accent",
      valueColor: "text-text",
    },
    {
      label: "Win Streak",
      value: (score?.winStreak ?? stats.winStreak).toString(),
      icon: Flame,
      iconBg: "bg-warning-light",
      iconColor: "text-warning",
      valueColor: "text-text",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <span className="text-xs text-muted">
                {card.label}
              </span>
            </div>
            <p className={`mt-3 text-2xl font-bold tabular-nums ${card.valueColor}`}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
