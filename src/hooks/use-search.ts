"use client";
import useSWR from "swr";
import { useDebounce } from "./use-debounce";
import type { SearchResults } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseSearchReturn {
  readonly results: SearchResults | null;
  readonly isLoading: boolean;
  readonly error: Error | undefined;
}

export function useSearch(query: string): UseSearchReturn {
  const debouncedQuery = useDebounce(query, 300);
  const shouldFetch = debouncedQuery.trim().length >= 2;

  const { data, isLoading, error } = useSWR(
    shouldFetch ? `/api/v1/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 1000 }
  );

  return {
    results: data?.success ? data.data : null,
    isLoading: shouldFetch && isLoading,
    error,
  };
}
