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

export function StockHeader({
  symbol,
  name,
  exchange,
  sector,
  marketCap,
  lastPrice,
}: StockHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text">{symbol}</h1>
          <span className="rounded-md bg-bg-alt px-2.5 py-0.5 text-xs font-medium text-muted">
            {exchange}
          </span>
          {marketCap && (
            <span className="rounded-md bg-bg-alt px-2.5 py-0.5 text-xs text-muted">
              {marketCap} CAP
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted">{name}</p>
        {sector && <p className="mt-0.5 text-xs text-muted-light">{sector}</p>}
      </div>

      {lastPrice !== null && (
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-text">
            {formatPrice(lastPrice)}
          </p>
          <p className="mt-0.5 text-xs text-muted">Last traded price</p>
        </div>
      )}
    </div>
  );
}
