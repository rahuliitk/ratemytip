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
  NYSE: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  NASDAQ: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  TSX: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  LSE: "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200",
  XETRA: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  EURONEXT: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  NSE: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  BSE: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  TSE: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  HKEX: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  ASX: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
  KRX: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
  SGX: "bg-lime-50 text-lime-700 ring-1 ring-inset ring-lime-200",
  MCX: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  CRYPTO: "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200",
  INDEX: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
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
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gradient-primary">{symbol}</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              EXCHANGE_COLORS[exchange] ?? "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200"
            }`}
          >
            {exchange}
          </span>
          {marketCap && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted">
              {marketCap} CAP
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted">{name}</p>
        {sector && <p className="text-xs text-muted">{sector}</p>}
      </div>

      {lastPrice !== null && (
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-primary">
            {formatPrice(lastPrice)}
          </p>
          <p className="text-xs text-muted">Last traded price</p>
        </div>
      )}
    </div>
  );
}
