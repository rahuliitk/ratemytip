import { Target, TrendingUp, BarChart3, Flame } from "lucide-react";
import type { CreatorScoreData, CreatorStats as CreatorStatsType } from "@/types";

interface CreatorStatsProps {
  readonly stats: CreatorStatsType;
  readonly score: CreatorScoreData | null;
}

const ICON_GRADIENTS: Record<string, string> = {
  "text-success": "from-[#276749]/10 to-[#38A169]/5",
  "text-danger": "from-[#C53030]/10 to-[#E53E3E]/5",
  "text-accent": "from-[#2B6CB0]/10 to-[#2B6CB0]/5",
  "text-warning": "from-[#C05621]/10 to-[#ED8936]/5",
};

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
        const gradientBg = ICON_GRADIENTS[card.color] ?? "from-gray-100 to-gray-50";
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_2px_0_rgba(26,54,93,0.04)] card-hover"
          >
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradientBg}`}>
                <Icon className={`h-4.5 w-4.5 ${card.color}`} />
              </div>
              <span className="text-xs font-medium text-muted">
                {card.label}
              </span>
            </div>
            <p className={`mt-3 text-3xl font-bold tabular-nums ${card.color}`}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
