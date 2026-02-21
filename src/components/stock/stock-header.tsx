import { formatPrice } from "@/lib/utils/format";
import type { Exchange, MarketCap } from "@/types";

interface StockHeaderProps {
  readonly symbol: string;
  readonly name: string;
  readonly exchange: Exchange;
  readonly sector: string | null;
  readonly marketCap: MarketCap | null;
  readonly lastPrice: number | null;
}

const EXCHANGE_COLORS: Record<string, string> = {
  // Americas
  NYSE: "bg-blue-100 text-blue-800",
  NASDAQ: "bg-indigo-100 text-indigo-800",
  TSX: "bg-red-100 text-red-800",
  // Europe
  LSE: "bg-slate-100 text-slate-800",
  XETRA: "bg-amber-100 text-amber-800",
  EURONEXT: "bg-sky-100 text-sky-800",
  // Asia-Pacific
  NSE: "bg-blue-100 text-blue-800",
  BSE: "bg-purple-100 text-purple-800",
  TSE: "bg-rose-100 text-rose-800",
  HKEX: "bg-red-100 text-red-800",
  ASX: "bg-teal-100 text-teal-800",
  KRX: "bg-cyan-100 text-cyan-800",
  SGX: "bg-lime-100 text-lime-800",
  // Other
  MCX: "bg-orange-100 text-orange-800",
  CRYPTO: "bg-yellow-100 text-yellow-800",
  INDEX: "bg-green-100 text-green-800",
};

export function StockHeader({
  symbol,
  name,
  exchange,
  sector,
  marketCap,
  lastPrice,
}: StockHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-primary">{symbol}</h1>
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${
              EXCHANGE_COLORS[exchange] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {exchange}
          </span>
          {marketCap && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-muted">
              {marketCap} CAP
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">{name}</p>
        {sector && <p className="text-xs text-muted">{sector}</p>}
      </div>

      {lastPrice !== null && (
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-primary">
            {formatPrice(lastPrice)}
          </p>
          <p className="text-xs text-muted">Last traded price</p>
        </div>
      )}
    </div>
  );
}
