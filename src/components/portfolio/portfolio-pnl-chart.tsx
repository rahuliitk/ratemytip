"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { formatPrice } from "@/lib/utils/format";

interface PnlDataPoint {
  readonly date: string;
  readonly totalValue: number;
  readonly totalPnl: number;
}

interface PortfolioPnlChartProps {
  readonly data: readonly PnlDataPoint[];
}

export function PortfolioPnlChart({ data }: PortfolioPnlChartProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-[#718096]">
        No portfolio history available yet.
      </div>
    );
  }

  const latestPnl = data[data.length - 1]?.totalPnl ?? 0;
  const lineColor = latestPnl >= 0 ? "#276749" : "#C53030";
  const fillColor = latestPnl >= 0 ? "#C6F6D5" : "#FED7D7";

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    totalValue: d.totalValue,
    totalPnl: d.totalPnl,
  }));

  const values = data.map((d) => d.totalValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || 100;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-[#1A202C]">Portfolio Value</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="portfolioValueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fillColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={fillColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#718096" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[Math.floor(minValue - padding), Math.ceil(maxValue + padding)]}
            tick={{ fontSize: 11, fill: "#718096" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatPrice(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "totalValue") return [formatPrice(value), "Value"];
              return [formatPrice(value), "P&L"];
            }}
            labelStyle={{ color: "#718096", fontSize: "11px" }}
          />
          <Area
            type="monotone"
            dataKey="totalValue"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#portfolioValueFill)"
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
