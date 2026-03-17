"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorSummary {
  id: string;
  slug: string;
  displayName: string;
  profileImageUrl: string | null;
  tier: string;
  isVerified: boolean;
  totalTips: number;
  specializations: string[];
}

interface CompareSelectorProps {
  readonly initialIds: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompareSelector({
  initialIds,
}: CompareSelectorProps): React.ReactElement {
  const router = useRouter();
  const [selected, setSelected] = useState<CreatorSummary[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreatorSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial creators by IDs
  useEffect(() => {
    if (initialIds.length === 0 || initialLoaded) return;

    async function loadInitial(): Promise<void> {
      try {
        const promises = initialIds.map(async (id) => {
          const res = await fetch(`/api/v1/creators/${id}`);
          const json = await res.json();
          if (json.success && json.data) {
            return {
              id: json.data.id,
              slug: json.data.slug,
              displayName: json.data.displayName,
              profileImageUrl: json.data.profileImageUrl,
              tier: json.data.tier,
              isVerified: json.data.isVerified ?? false,
              totalTips: json.data.totalTips ?? json.data.stats?.totalTips ?? 0,
              specializations: json.data.specializations ?? [],
            } as CreatorSummary;
          }
          return null;
        });
        const loaded = (await Promise.all(promises)).filter(
          (c): c is CreatorSummary => c !== null
        );
        setSelected(loaded);
      } catch {
        // Silently fail — user can re-search
      }
      setInitialLoaded(true);
    }

    loadInitial();
  }, [initialIds, initialLoaded]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);

      if (value.trim().length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      searchTimeout.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await fetch(
            `/api/v1/creators?search=${encodeURIComponent(value.trim())}&pageSize=10`
          );
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setResults(json.data as CreatorSummary[]);
            setShowDropdown(true);
          }
        } catch {
          setResults([]);
        }
        setIsSearching(false);
      }, 300);
    },
    []
  );

  const handleAdd = useCallback(
    (creator: CreatorSummary) => {
      if (selected.length >= 3) return;
      if (selected.some((s) => s.id === creator.id)) return;
      setSelected((prev) => [...prev, creator]);
      setQuery("");
      setResults([]);
      setShowDropdown(false);
    },
    [selected]
  );

  const handleRemove = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleCompare = useCallback(() => {
    if (selected.length < 2) return;
    const ids = selected.map((s) => s.id).join(",");
    router.push(`/compare?creators=${ids}`);
  }, [selected, router]);

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-4 shadow-sm">
      {/* Selected creators */}
      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {selected.map((creator) => (
            <div
              key={creator.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-bg-alt/50 px-3 py-1.5"
            >
              {creator.profileImageUrl ? (
                <Image
                  src={creator.profileImageUrl}
                  alt={creator.displayName}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-subtle text-xs font-bold text-accent">
                  {creator.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-text">
                {creator.displayName}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(creator.id)}
                className="ml-1 rounded-md p-0.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                aria-label={`Remove ${creator.displayName}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search + Compare button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={
              selected.length >= 3
                ? "Maximum 3 creators selected"
                : "Search creators to compare..."
            }
            disabled={selected.length >= 3}
            className="pl-9"
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
          )}

          {/* Dropdown results */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-xl border border-border/60 bg-surface shadow-lg">
              <div className="max-h-64 overflow-y-auto p-1">
                {results
                  .filter((r) => !selected.some((s) => s.id === r.id))
                  .map((creator) => (
                    <button
                      key={creator.id}
                      type="button"
                      onClick={() => handleAdd(creator)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-bg-alt"
                      )}
                    >
                      {creator.profileImageUrl ? (
                        <Image
                          src={creator.profileImageUrl}
                          alt={creator.displayName}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-border/40"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle text-sm font-bold text-accent ring-1 ring-border/40">
                          {creator.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {creator.displayName}
                        </p>
                        <p className="text-xs text-muted">
                          {creator.totalTips} tips &middot; {creator.tier}
                        </p>
                      </div>
                    </button>
                  ))}
                {results.filter((r) => !selected.some((s) => s.id === r.id))
                  .length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted">
                    All matching creators are already selected.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          variant="glow"
          onClick={handleCompare}
          disabled={selected.length < 2}
        >
          Compare
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {selected.length === 1 && (
        <p className="mt-2 text-xs text-muted">
          Select at least one more creator to compare.
        </p>
      )}
    </div>
  );
}
