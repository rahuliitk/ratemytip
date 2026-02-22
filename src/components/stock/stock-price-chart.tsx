"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatPrice } from "@/lib/utils/format";
import type { StockPriceData } from "@/types";

interface StockPriceChartProps {
  readonly priceHistory: readonly StockPriceData[];
  readonly symbol: string;
}

export function StockPriceChart({
  priceHistory,
  symbol,
}: StockPriceChartProps): React.ReactElement {
  if (priceHistory.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded bg-bg text-sm text-muted">
        No price history available for {symbol}.
      </div>
    );
  }

  // Oldest first for chart
  const data = [...priceHistory].reverse().map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    close: p.close,
    high: p.high,
    low: p.low,
  }));

  const prices = data.map((d) => d.close);
  const minPrice = Math.min(...prices) * 0.98;
  const maxPrice = Math.max(...prices) * 1.02;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2B6CB0" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2B6CB0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#718096" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minPrice, maxPrice]}
          tick={{ fontSize: 11, fill: "#718096" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatPrice(v).replace("₹", "")}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number) => [formatPrice(value), "Close"]}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke="#2B6CB0"
          strokeWidth={2}
          fill="url(#priceGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
