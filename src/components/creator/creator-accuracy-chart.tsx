"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CreatorScoreData } from "@/types";

interface CreatorAccuracyChartProps {
  readonly score: CreatorScoreData;
}

const BAR_COLORS = [
  "var(--color-accent)",
  "var(--color-success)",
  "var(--color-warning)",
  "#7C3AED",
];

export function CreatorAccuracyChart({
  score,
}: CreatorAccuracyChartProps): React.ReactElement {
  const data = [
    {
      name: "Intraday",
      accuracy: score.intradayAccuracy !== null ? Number((score.intradayAccuracy * 100).toFixed(1)) : null,
    },
    {
      name: "Swing",
      accuracy: score.swingAccuracy !== null ? Number((score.swingAccuracy * 100).toFixed(1)) : null,
    },
    {
      name: "Positional",
      accuracy: score.positionalAccuracy !== null ? Number((score.positionalAccuracy * 100).toFixed(1)) : null,
    },
    {
      name: "Long Term",
      accuracy: score.longTermAccuracy !== null ? Number((score.longTermAccuracy * 100).toFixed(1)) : null,
    },
  ].filter((d) => d.accuracy !== null);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-bg-alt text-sm text-muted">
        Not enough data to show accuracy breakdown.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" strokeOpacity={0.8} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "var(--color-muted)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "var(--shadow-md)",
          }}
          formatter={(value: number) => [`${value}%`, "Accuracy"]}
        />
        <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((_, index) => (
            <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
