// app/components/CanicIntensityChart.tsx
"use client";

import React from "react";
import ClimateChart from "@/app/components/ClimateChart";
import { useI18n } from "@/app/contexts/I18nContext";
import type { CanicYearRow } from "@/app/hooks/useCanicSeries";

export interface CanicIntensityChartProps {
  data: CanicYearRow[];
  description?: string;
  className?: string;
}

/**
 * Renders the CANIC-Int (dry-spell intensity %) time-series by delegating
 * entirely to the existing ClimateChart component.  Years without an
 * intensity record are omitted from the line.
 */
export function CanicIntensityChart({
  data,
  description,
  className,
}: CanicIntensityChartProps) {
  const { t } = useI18n();

  const validRows = data.filter((r) => r.intensity != null);

  // Annual dates encoded as YYYY-01-01 so ClimateChart's datetime axis
  // resolves them correctly with xAxisYearOnly={true}.
  const dates = validRows.map((r) => `${r.year}-01-01`);
  const values = validRows.map((r) => r.intensity as number);

  return (
    <div className={className}>
      <ClimateChart
        title={t("canic.chart.title")}
        unit="%"
        datasets={[
          {
            label: t("canic.chart.legend"),
            color: "#f97316",
            data: values,
            dates,
          },
        ]}
        period="annual"
        chartType="line"
        xAxisYearOnly={true}
        description={description}
      />
    </div>
  );
}
