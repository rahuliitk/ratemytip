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
import type { ScoreSnapshotData } from "@/types";

interface CreatorScoreChartProps {
  readonly snapshots: readonly ScoreSnapshotData[];
}

export function CreatorScoreChart({
  snapshots,
}: CreatorScoreChartProps): React.ReactElement {
  if (snapshots.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded bg-bg text-sm text-muted">
        No score history available yet.
      </div>
    );
  }

  // Reverse so oldest is first (chart reads left to right)
  const data = [...snapshots].reverse().map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    rmtScore: Number(s.rmtScore.toFixed(1)),
    accuracyRate: Number((s.accuracyRate * 100).toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#718096" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#718096" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => {
            if (name === "rmtScore") return [`${value}`, "RMT Score"];
            return [`${value}%`, "Accuracy"];
          }}
        />
        <Line
          type="monotone"
          dataKey="rmtScore"
          stroke="#2B6CB0"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="accuracyRate"
          stroke="#38A169"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="4 4"
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
