// app/components/PrcdBarChart.tsx
"use client";

import React from "react";
import ClimateChart from "@/app/components/ClimateChart";
import { useI18n } from "@/app/contexts/I18nContext";
import type { PrcdDecadeRow } from "@/app/hooks/usePrcdSeries";

// Category color palette — explicit hex to match the project pattern (see getIndicatorColor)
const CAT_COLORS: Record<number, string> = {
  1: "#f97316", // orange-500 — Debajo de lo Normal
  2: "#22c55e", // green-500  — Normal
  3: "#3b82f6", // blue-500   — Arriba de lo Normal
};
const NO_DATA_COLOR = "#d1d5db"; // gray-300

export interface PrcdBarChartProps {
  primaryData: PrcdDecadeRow[];
  primaryYear: number;
  description?: string;
  className?: string;
}

/**
 * Renders the PRCD decadal bar chart by delegating to the existing
 * ClimateChart component.  Each of the 36 bars is colored according to
 * the PRCD-Cat value for that decade (below / normal / above normal).
 * Uses ClimateChart's `barDistributedColors` extension — no new library
 * wrapper is created here.
 */
export function PrcdBarChart({
  primaryData,
  primaryYear,
  description,
  className,
}: PrcdBarChartProps) {
  const { t } = useI18n();

  // X-axis categories: full decade labels ("Ene D1", "Ene D2", …) so the
  // tooltip header always has a meaningful value instead of "undefined".
  const labels = primaryData.map((row) => row.label);

  // X-axis tick formatter: show the month name only on the middle decade (D2)
  // so the label appears naturally centered under its three bars.
  const xAxisLabelFormatter = (label: string) =>
    label.includes("D2") ? label.replace(/\s+D2$/, "") : "";

  // Tooltip header formatter: decade label + labelled relative anomaly percentage.
  const tooltipXHeaderFormatter = (label: string, index: number) => {
    const row = primaryData[index];
    if (!row) return label;
    if (row.rel != null) {
      const sign = row.rel >= 0 ? "+" : "";
      return `${row.label}  — ${t("prcd.chart.relLabel")}: ${sign}${row.rel.toFixed(1)}%`;
    }
    return row.label;
  };

  // Y values: PRCD in mm; null where no record exists (no bar drawn)
  const values = primaryData.map((row) => row.prcd);

  // Per-bar colors driven by category
  const colors = primaryData.map((row) =>
    row.cat != null ? CAT_COLORS[row.cat] : NO_DATA_COLOR
  );

  const catItems = [
    { color: CAT_COLORS[3], label: t("prcd.category.above") },
    { color: CAT_COLORS[2], label: t("prcd.category.normal") },
    { color: CAT_COLORS[1], label: t("prcd.category.below") },
  ];

  return (
    <div className={className}>
      {/* Category color legend — replaces the default ClimateChart series legend */}
      <div className="flex flex-wrap gap-4 mb-3 px-1">
        {catItems.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      {/* Wrap chart in a plain div — no custom overlay needed */}
      <div>
        <ClimateChart
          title={t("prcd.chart.title", { year: String(primaryYear) })}
          unit="mm"
          datasets={[
            {
              label: t("prcd.chart.legend"),
              color: CAT_COLORS[2],
              data: values as number[],
              dates: labels,
            },
          ]}
          period="climatology"
          chartType="bar"
          barDistributedColors={colors}
          hideManualLegend={true}
          xAxisLabelFormatter={xAxisLabelFormatter}
          tooltipXHeaderFormatter={tooltipXHeaderFormatter}
          description={description}
        />
      </div>
    </div>
  );
}
