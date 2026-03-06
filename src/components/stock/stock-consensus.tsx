interface StockConsensusProps {
  readonly bullish: number;
  readonly bearish: number;
}

export function StockConsensus({
  bullish,
  bearish,
}: StockConsensusProps): React.ReactElement {
  const total = bullish + bearish;
  const bullishPct = total > 0 ? (bullish / total) * 100 : 50;
  const bearishPct = total > 0 ? (bearish / total) * 100 : 50;

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-text">Tip Consensus</h3>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-medium text-emerald-600">
          Bullish: {bullish}
        </span>
        <span className="font-medium text-red-600">
          Bearish: {bearish}
        </span>
      </div>

      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-bg-alt">
        {total > 0 ? (
          <>
            <div
              className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
              style={{ width: `${bullishPct}%` }}
            />
            <div
              className="bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
              style={{ width: `${bearishPct}%` }}
            />
          </>
        ) : (
          <div className="w-full bg-border" />
        )}
      </div>

      {total > 0 && (
        <div className="mt-1.5 flex justify-between text-xs font-medium tabular-nums text-muted">
          <span>{bullishPct.toFixed(0)}%</span>
          <span>{bearishPct.toFixed(0)}%</span>
        </div>
      )}

      {total === 0 && (
        <p className="mt-2 text-xs text-muted">No tips tracked yet</p>
      )}
    </div>
  );
}
