// app/components/CanicVisualizer.tsx
"use client";

import React from "react";
import { useI18n } from "@/app/contexts/I18nContext";
import { useCanicSeries } from "@/app/hooks/useCanicSeries";
import { useCanicTableColumns } from "@/app/hooks/useCanicTableColumns";
import { IndicatorTableView } from "@/app/components/IndicatorTableView";
import { CanicIntensityChart } from "@/app/components/CanicIntensityChart";

export interface CanicVisualizerProps {
  locationId: string | null;
  description?: string;
  className?: string;
}

/**
 * Orchestrates the full CANIC panel: fetches the three sub-indicators
 * (CANIC, CANIC-Dur, CANIC-Int) via useCanicSeries, builds column
 * definitions via useCanicTableColumns, and composes the historical table
 * with the intensity time-series chart.
 *
 * Activated whenever the indicator key is CANIC, CANIC-Dur, or CANIC-Int —
 * all three trigger the same unified panel.
 */
export function CanicVisualizer({ locationId, description, className }: CanicVisualizerProps) {
  const { t } = useI18n();
  const { data, isLoading, error } = useCanicSeries(locationId);
  const columns = useCanicTableColumns(data);

  const baseClass = `border border-gray-200 rounded-lg p-5 ${className ?? ""}`;

  if (!locationId) {
    return (
      <div className={`${baseClass} flex items-center justify-center text-gray-500 min-h-[6rem]`}>
        {t("canic.noStation")}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${baseClass} flex items-center justify-center min-h-[6rem]`}>
        <div className="flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-green" />
          <span>{t("canic.loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${baseClass} flex items-center justify-center text-red-500 min-h-[6rem]`}>
        {error.message}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`${baseClass} flex items-center justify-center text-gray-500 min-h-[6rem]`}>
        {t("canic.empty")}
      </div>
    );
  }

  return (
    <div className={baseClass}>
      <h3 className="font-semibold text-lg text-gray-800 mb-4">
        {t("canic.title")}
      </h3>

      {/* Description from the indicator metadata */}
      {description && (
        <div className="mb-4 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
          {description}
        </div>
      )}

      {/* Section 1: Historical start / duration / intensity table */}
      <div className="mb-6">
        <IndicatorTableView
          rows={data}
          columns={columns}
          defaultSortKey="year"
          defaultSortOrder="desc"
          pageSize={15}
          emptyMessage={t("canic.empty")}
        />
      </div>

      {/* Section 2: Intensity time-series chart */}
      <CanicIntensityChart data={data} description={description} />
    </div>
  );
}
