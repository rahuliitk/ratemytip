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
      color: "text-success",
    },
    {
      label: "Avg Return",
      value: score ? `${score.avgReturnPct >= 0 ? "+" : ""}${score.avgReturnPct.toFixed(1)}%` : "-",
      icon: TrendingUp,
      color: score && score.avgReturnPct >= 0 ? "text-success" : "text-danger",
    },
    {
      label: "Total Tips",
      value: stats.totalTips.toString(),
      icon: BarChart3,
      color: "text-accent",
    },
    {
      label: "Win Streak",
      value: (score?.winStreak ?? stats.winStreak).toString(),
      icon: Flame,
      color: "text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-surface p-4"
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs font-medium text-muted">
                {card.label}
              </span>
            </div>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${card.color}`}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
