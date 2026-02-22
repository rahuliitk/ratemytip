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
            className="rounded-lg border border-gray-200 bg-surface p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">{card.label}</p>
                <p className="text-2xl font-bold tabular-nums text-text">
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
