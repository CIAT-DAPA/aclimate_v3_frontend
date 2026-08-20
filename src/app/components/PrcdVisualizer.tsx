// app/components/PrcdVisualizer.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/app/contexts/I18nContext";
import { usePrcdSeries } from "@/app/hooks/usePrcdSeries";
import { PrcdBarChart } from "@/app/components/PrcdBarChart";

export interface PrcdVisualizerProps {
  locationId: string | null;
  description?: string;
  className?: string;
}

/**
 * Orchestrates the PRCD panel: manages year-selector state, fetches the four
 * sub-indicators (PRCD, PRCD-Abs, PRCD-Rel, PRCD-Cat) via usePrcdSeries, and
 * composes the year selector with PrcdBarChart.
 *
 * Activated whenever the indicator key is PRCD, PRCD-Abs, PRCD-Rel or
 * PRCD-Cat — all four trigger this same unified panel.
 */
export function PrcdVisualizer({ locationId, description, className }: PrcdVisualizerProps) {
  const { t } = useI18n();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { data, availableYears, isLoading, error } = usePrcdSeries(
    locationId,
    selectedYear
  );

  // Default to the most recent available year once data loads
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear == null) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const baseClass = `border border-gray-200 rounded-lg p-5 ${className ?? ""}`;

  if (!locationId) {
    return (
      <div
        className={`${baseClass} flex items-center justify-center text-gray-500 min-h-[6rem]`}
      >
        {t("prcd.noStation")}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`${baseClass} flex items-center justify-center min-h-[6rem]`}
      >
        <div className="flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-green" />
          <span>{t("prcd.loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${baseClass} flex items-center justify-center text-red-500 min-h-[6rem]`}
      >
        {error.message}
      </div>
    );
  }

  if (availableYears.length === 0) {
    return (
      <div
        className={`${baseClass} flex items-center justify-center text-gray-500 min-h-[6rem]`}
      >
        {t("prcd.empty")}
      </div>
    );
  }

  return (
    <div className={baseClass}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold text-lg text-gray-800">{t("prcd.title")}</h3>

        {/* Year selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="prcd-year-select"
            className="text-xs font-medium text-gray-700"
          >
            {t("prcd.yearSelector")}
          </label>
          <select
            id="prcd-year-select"
            value={selectedYear ?? ""}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white text-sm"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedYear != null && data.length > 0 ? (
        <PrcdBarChart primaryData={data} primaryYear={selectedYear} description={description} />
      ) : (
        <div className="flex items-center justify-center py-8 text-gray-500">
          {t("prcd.empty")}
        </div>
      )}
    </div>
  );
}
