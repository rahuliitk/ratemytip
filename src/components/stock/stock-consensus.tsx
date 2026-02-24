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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]">
      <h3 className="text-sm font-semibold text-primary">Tip Consensus</h3>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-medium text-success">
          Bullish: {bullish}
        </span>
        <span className="font-medium text-danger">
          Bearish: {bearish}
        </span>
      </div>

      <div className="mt-2 flex h-4 overflow-hidden rounded-full bg-gray-100">
        {total > 0 ? (
          <>
            <div
              className="bg-gradient-to-r from-[#22543D] to-[#38A169] transition-all duration-500"
              style={{ width: `${bullishPct}%` }}
            />
            <div
              className="bg-gradient-to-r from-[#E53E3E] to-[#C53030] transition-all duration-500"
              style={{ width: `${bearishPct}%` }}
            />
          </>
        ) : (
          <div className="w-full bg-gray-200" />
        )}
      </div>

      {total > 0 && (
        <div className="mt-1.5 flex justify-between text-xs font-medium text-muted tabular-nums">
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
