// app/hooks/useCanicTableColumns.tsx
"use client";

import React, { useMemo } from "react";
import { useI18n } from "@/app/contexts/I18nContext";
import type { CanicYearRow } from "@/app/hooks/useCanicSeries";
import type { ColumnDef } from "@/app/components/IndicatorTableView";

const MONTH_NAMES: Record<string, string[]> = {
  es: [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ],
  en: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
};

function CategoryBadge({
  category,
}: {
  category: "Leve" | "Moderada" | "Severa" | null;
}) {
  if (!category) return <span className="text-gray-400">—</span>;

  const classes: Record<"Leve" | "Moderada" | "Severa", string> = {
    Leve: "bg-amber-100 text-amber-800 border border-amber-200",
    Moderada: "bg-orange-100 text-orange-800 border border-orange-200",
    Severa: "bg-red-100 text-red-800 border border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${classes[category]}`}
    >
      {category}
    </span>
  );
}

/**
 * Returns the column definitions for the CANIC historical table.
 * Centralises date formatting, category badges, and extreme-row highlighting.
 * Receives the full data array to compute which years hold the record
 * duration and intensity.
 */
export function useCanicTableColumns(
  data: CanicYearRow[]
): ColumnDef<CanicYearRow>[] {
  const { t, locale } = useI18n();

  return useMemo(() => {
    const months = MONTH_NAMES[locale] ?? MONTH_NAMES["es"];

    const validDurations = data.filter((r) => r.duration != null);
    const validIntensities = data.filter((r) => r.intensity != null);

    const maxDurationYear =
      validDurations.length > 0
        ? validDurations.reduce((max, r) =>
            r.duration! > max.duration! ? r : max
          ).year
        : null;

    const maxIntensityYear =
      validIntensities.length > 0
        ? validIntensities.reduce((max, r) =>
            r.intensity! > max.intensity! ? r : max
          ).year
        : null;

    const formatStartDate = (row: CanicYearRow): string => {
      if (!row.startDate) return "—";
      const day = row.startDate.getDate();
      const month = row.startDate.getMonth();
      return `${day} ${months[month]}`;
    };

    return [
      {
        key: "year",
        header: t("canic.table.year"),
        sortable: true,
        sortValue: (r) => r.year,
        render: (r) => <span className="font-medium">{r.year}</span>,
      },
      {
        key: "startDate",
        header: t("canic.table.startDate"),
        sortable: true,
        sortValue: (r) => r.julianDay,
        render: (r) => <span>{formatStartDate(r)}</span>,
      },
      {
        key: "duration",
        header: t("canic.table.duration"),
        sortable: true,
        sortValue: (r) => r.duration,
        render: (r) => (
          <span className="flex items-center gap-1">
            {r.duration != null
              ? `${r.duration} ${t("canic.unit.days")}`
              : "—"}
            {r.year === maxDurationYear && (
              <span
                className="text-brand-green text-xs leading-none"
                title={t("canic.maxDuration")}
                aria-label={t("canic.maxDuration")}
              >
                ★
              </span>
            )}
          </span>
        ),
      },
      {
        key: "intensity",
        header: t("canic.table.intensity"),
        sortable: true,
        sortValue: (r) => r.intensity,
        render: (r) => (
          <span className="flex items-center gap-1">
            {r.intensity != null ? `${r.intensity.toFixed(1)} %` : "—"}
            {r.year === maxIntensityYear && (
              <span
                className="text-orange-500 text-xs leading-none"
                title={t("canic.maxIntensity")}
                aria-label={t("canic.maxIntensity")}
              >
                ★
              </span>
            )}
          </span>
        ),
      },
      {
        key: "category",
        header: t("canic.table.category"),
        sortable: true,
        sortValue: (r) => r.category ?? "",
        render: (r) => <CategoryBadge category={r.category} />,
      },
    ];
  }, [data, t, locale]);
}
