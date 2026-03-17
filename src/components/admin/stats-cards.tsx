import type { LucideIcon } from "lucide-react";

interface StatCard {
  readonly label: string;
  readonly value: string;
  readonly icon: LucideIcon;
  readonly color: string;
  readonly bgColor: string;
}

interface StatsCardsProps {
  readonly cards: readonly StatCard[];
}

export function StatsCards({ cards }: StatsCardsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">{card.label}</p>
                <p className="text-2xl font-bold text-text tabular-nums">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
