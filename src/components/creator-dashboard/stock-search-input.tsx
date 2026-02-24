"use client";

import { useState, useRef, useEffect } from "react";

interface StockResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface StockSearchInputProps {
  readonly value: string;
  readonly onChange: (symbol: string) => void;
}

export function StockSearchInput({ value, onChange }: StockSearchInputProps): React.ReactElement {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<StockResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(q: string): void {
    setQuery(q);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/stocks?search=${encodeURIComponent(q)}&pageSize=8`);
        const data = await res.json();
        if (data.success) {
          setResults(
            data.data.map((s: { symbol: string; name: string; exchange: string }) => ({
              symbol: s.symbol,
              name: s.name,
              exchange: s.exchange,
            }))
          );
          setShowDropdown(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(stock: StockResult): void {
    setQuery(stock.symbol);
    onChange(stock.symbol);
    setShowDropdown(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        placeholder="Search stocks (e.g., RELIANCE, TCS)..."
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-surface shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-xs text-muted">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted">No stocks found</div>
          ) : (
            results.map((stock) => (
              <button
                key={stock.symbol}
                type="button"
                onClick={() => handleSelect(stock)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-bg"
              >
                <div>
                  <span className="font-medium text-text">{stock.symbol}</span>
                  <span className="ml-2 text-xs text-muted">{stock.name}</span>
                </div>
                <span className="text-xs text-muted">{stock.exchange}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
