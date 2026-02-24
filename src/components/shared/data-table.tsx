"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface Column<T> {
  readonly key: string;
  readonly header: string;
  readonly sortable?: boolean;
  readonly align?: "left" | "right" | "center";
  readonly render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  readonly data: readonly T[];
  readonly columns: readonly Column<T>[];
  readonly keyField: keyof T;
  readonly emptyMessage?: string;
  readonly onRowClick?: (row: T) => void;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T>({
  data,
  columns,
  keyField,
  emptyMessage = "No data available.",
  onRowClick,
}: DataTableProps<T>): React.ReactElement {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  function handleSort(key: string): void {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const alignClass = (align?: string): string => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  };

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)]">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-[#F7FAFC]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold uppercase text-muted ${alignClass(col.align)} ${
                  col.sortable ? "cursor-pointer select-none hover:text-text" : ""
                }`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-gray-400">
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedData.map((row) => (
            <tr
              key={String(row[keyField])}
              className={`hover:bg-[#F7FAFC] transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm ${alignClass(col.align)}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {sortedData.length === 0 && (
        <div className="py-12 text-center text-sm text-muted">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
