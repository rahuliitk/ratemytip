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
      <div className="flex h-48 items-center justify-center rounded-2xl bg-gray-50 text-sm text-muted">
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
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" strokeOpacity={0.6} />
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
            border: "none",
            borderRadius: "12px",
            fontSize: "12px",
            boxShadow: "0 10px 15px -3px rgba(26, 54, 93, 0.08), 0 4px 6px -4px rgba(26, 54, 93, 0.06)",
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
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="accuracyRate"
          stroke="#38A169"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="4 4"
          activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
