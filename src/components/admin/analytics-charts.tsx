"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyTipCount {
  readonly date: string;
  readonly count: number;
}

interface ScoreDistribution {
  readonly range: string;
  readonly count: number;
}

interface AnalyticsChartsProps {
  readonly dailyTips: readonly DailyTipCount[];
  readonly scoreDistribution: readonly ScoreDistribution[];
}

export function AnalyticsCharts({
  dailyTips,
  scoreDistribution,
}: AnalyticsChartsProps): React.ReactElement {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-surface p-6">
        <h2 className="text-sm font-semibold text-primary">Tips Over Time</h2>
        {dailyTips.length > 0 ? (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[...dailyTips]} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#718096" }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#718096" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="count" stroke="#2B6CB0" strokeWidth={2} dot={false} name="Tips" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 flex h-48 items-center justify-center rounded bg-bg text-sm text-muted">No tip data available yet.</div>
        )}
      </div>
      <div className="rounded-lg border border-gray-200 bg-surface p-6">
        <h2 className="text-sm font-semibold text-primary">Score Distribution</h2>
        {scoreDistribution.length > 0 ? (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...scoreDistribution]} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#718096" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#718096" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#2B6CB0" radius={[4, 4, 0, 0]} name="Creators" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 flex h-48 items-center justify-center rounded bg-bg text-sm text-muted">No score data available yet.</div>
        )}
      </div>
    </div>
  );
}
