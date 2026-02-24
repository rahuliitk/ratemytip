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
      <div className="flex h-48 items-center justify-center rounded-lg border border-gray-200 bg-surface">
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#718096" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#718096" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            backgroundColor: "#fff",
            borderColor: "#e2e8f0",
            borderRadius: 8,
          }}
        />
        <Line
          type="monotone"
          dataKey="RMT Score"
          stroke="#2B6CB0"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Accuracy"
          stroke="#38A169"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
