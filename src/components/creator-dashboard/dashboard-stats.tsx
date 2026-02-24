import { Target, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface DashboardStatsProps {
  readonly totalTips: number;
  readonly activeTips: number;
  readonly pendingTips: number;
  readonly accuracyRate: number | null;
  readonly rmtScore: number | null;
}

export function DashboardStats({
  totalTips,
  activeTips,
  pendingTips,
  accuracyRate,
  rmtScore,
}: DashboardStatsProps): React.ReactElement {
  const stats = [
    {
      label: "Total Tips",
      value: totalTips.toString(),
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Active Tips",
      value: activeTips.toString(),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-green-50",
    },
    {
      label: "Pending Review",
      value: pendingTips.toString(),
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-orange-50",
    },
    {
      label: "Accuracy",
      value: accuracyRate !== null ? `${(accuracyRate * 100).toFixed(1)}%` : "N/A",
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-md p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted">{stat.label}</p>
                <p className="text-xl font-bold tabular-nums text-text">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}

      {rmtScore !== null && (
        <div className="col-span-2 rounded-lg border border-gray-200 bg-surface p-4 lg:col-span-4">
          <p className="text-xs text-muted">RMT Score</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-accent">
            {rmtScore.toFixed(1)}
            <span className="text-sm font-normal text-muted"> / 100</span>
          </p>
        </div>
      )}
    </div>
  );
}
