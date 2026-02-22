"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { formatPrice } from "@/lib/utils/format";
import type { StockPriceData } from "@/types";

interface TipPriceChartProps {
  readonly priceHistory: readonly StockPriceData[];
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2?: number | null;
  readonly target3?: number | null;
  readonly stopLoss: number;
  readonly symbol: string;
}

export function TipPriceChart({
  priceHistory,
  entryPrice,
  target1,
  target2,
  target3,
  stopLoss,
  symbol,
}: TipPriceChartProps): React.ReactElement {
  if (priceHistory.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded bg-bg text-sm text-muted">
        No price history available for {symbol}.
      </div>
    );
  }

  const data = [...priceHistory].reverse().map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    close: p.close,
  }));

  // Calculate Y-axis domain including all reference lines
  const allPrices = [
    ...data.map((d) => d.close),
    entryPrice,
    target1,
    stopLoss,
  ];
  if (target2) allPrices.push(target2);
  if (target3) allPrices.push(target3);

  const minPrice = Math.min(...allPrices) * 0.97;
  const maxPrice = Math.max(...allPrices) * 1.03;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
      >
        <defs>
          <linearGradient id="tipPriceGradient" x1="0" y1="0" x2="0" y2="1">
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

        {/* Entry Price Line */}
        <ReferenceLine
          y={entryPrice}
          stroke="#2B6CB0"
          strokeDasharray="6 3"
          strokeWidth={1.5}
          label={{
            value: `Entry ${formatPrice(entryPrice)}`,
            position: "insideBottomRight",
            fill: "#2B6CB0",
            fontSize: 10,
          }}
        />

        {/* Target 1 */}
        <ReferenceLine
          y={target1}
          stroke="#276749"
          strokeDasharray="6 3"
          strokeWidth={1.5}
          label={{
            value: `T1 ${formatPrice(target1)}`,
            position: "insideTopRight",
            fill: "#276749",
            fontSize: 10,
          }}
        />

        {/* Target 2 */}
        {target2 && (
          <ReferenceLine
            y={target2}
            stroke="#2F855A"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: `T2 ${formatPrice(target2)}`,
              position: "insideTopRight",
              fill: "#2F855A",
              fontSize: 10,
            }}
          />
        )}

        {/* Target 3 */}
        {target3 && (
          <ReferenceLine
            y={target3}
            stroke="#38A169"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: `T3 ${formatPrice(target3)}`,
              position: "insideTopRight",
              fill: "#38A169",
              fontSize: 10,
            }}
          />
        )}

        {/* Stop Loss Line */}
        <ReferenceLine
          y={stopLoss}
          stroke="#C53030"
          strokeDasharray="6 3"
          strokeWidth={1.5}
          label={{
            value: `SL ${formatPrice(stopLoss)}`,
            position: "insideBottomRight",
            fill: "#C53030",
            fontSize: 10,
          }}
        />

        <Area
          type="monotone"
          dataKey="close"
          stroke="#2B6CB0"
          strokeWidth={2}
          fill="url(#tipPriceGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
