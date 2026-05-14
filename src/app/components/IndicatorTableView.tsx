// app/components/IndicatorTableView.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useI18n } from "@/app/contexts/I18nContext";

export interface ColumnDef<TRow> {
  key: string;
  header: string;
  render: (row: TRow) => React.ReactNode;
  sortable?: boolean;
  /** Custom extractor for sort comparison; falls back to row[key] if omitted. */
  sortValue?: (row: TRow) => number | string | null;
}

interface IndicatorTableViewProps<TRow extends { year: number }> {
  rows: TRow[];
  columns: ColumnDef<TRow>[];
  defaultSortKey?: string;
  defaultSortOrder?: "asc" | "desc";
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
}

export function IndicatorTableView<TRow extends { year: number }>({
  rows,
  columns,
  defaultSortKey = "year",
  defaultSortOrder = "desc",
  pageSize = 15,
  emptyMessage,
  className,
}: IndicatorTableViewProps<TRow>) {
  const { t } = useI18n();
  const [sortKey, setSortKey] = useState<string>(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);
  const [page, setPage] = useState(0);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
    setPage(0);
  };

  const sortedRows = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    return [...rows].sort((a, b) => {
      const aVal = col?.sortValue
        ? col.sortValue(a)
        : (a as Record<string, unknown>)[sortKey];
      const bVal = col?.sortValue
        ? col.sortValue(b)
        : (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortOrder, columns]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const pageRows = sortedRows.slice(page * pageSize, (page + 1) * pageSize);

  if (rows.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className ?? ""}`}>
        {emptyMessage ?? t("stationPage.empty.noData")}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap ${
                    col.sortable !== false
                      ? "cursor-pointer select-none hover:bg-gray-100"
                      : ""
                  }`}
                  onClick={
                    col.sortable !== false ? () => handleSort(col.key) : undefined
                  }
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable !== false && sortKey === col.key && (
                      <span className="text-xs text-gray-400">
                        {sortOrder === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pageRows.map((row, i) => (
              <tr key={row.year} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-3 px-1">
          <span className="text-xs text-gray-500">
            {t("indicatorTable.page", {
              current: String(page + 1),
              total: String(totalPages),
            })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100"
            >
              {t("indicatorTable.prev")}
            </button>
            <button
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page === totalPages - 1}
              className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100"
            >
              {t("indicatorTable.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
