"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ScorePoint {
  date: string;
  rmtScore: number;
  accuracyRate: number;
}

interface PerformanceChartProps {
  readonly data: ScorePoint[];
}

export function PerformanceChart({ data }: PerformanceChartProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border/60 bg-surface">
        <p className="text-sm text-muted">No score history data yet</p>
      </div>
    );
  }

  const chartData = data
    .slice()
    .reverse()
    .map((point) => ({
      date: new Date(point.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      "RMT Score": point.rmtScore,
      Accuracy: +(point.accuracyRate * 100).toFixed(1),
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            borderRadius: 8,
          }}
        />
        <Line
          type="monotone"
          dataKey="RMT Score"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Accuracy"
          stroke="var(--color-success)"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
