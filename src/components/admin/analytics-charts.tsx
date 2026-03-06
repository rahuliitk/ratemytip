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
      {/* Tips Over Time */}
      <div className="rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text">Tips Over Time</h2>
        <p className="mt-0.5 text-xs text-muted">Last 30 days</p>
        {dailyTips.length > 0 ? (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={[...dailyTips]} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                  name="Tips"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 flex h-60 items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted">
            No tip data available yet.
          </div>
        )}
      </div>

      {/* Score Distribution */}
      <div className="rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-text">Score Distribution</h2>
        <p className="mt-0.5 text-xs text-muted">RMT Score ranges across creators</p>
        {scoreDistribution.length > 0 ? (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...scoreDistribution]} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  name="Creators"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 flex h-60 items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted">
            No score data available yet.
          </div>
        )}
      </div>
    </div>
  );
}
