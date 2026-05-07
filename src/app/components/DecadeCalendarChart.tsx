// app/components/DecadeCalendarChart.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { useDecadeFrequencies } from "@/app/hooks/useDecadeFrequencies";
import { useI18n } from "@/app/contexts/I18nContext";

export interface DecadeCalendarChartProps {
  /** Raw encoded series: each value = month*10 + decadeInMonth */
  series: number[];
  /** Display name shown as chart title */
  indicatorLabel: string;
  /** Controls gradient: 'rainy' = greens, 'dry' = oranges */
  colorScheme: "rainy" | "dry";
  className?: string;
}

// ─── colour helpers ───────────────────────────────────────────────────────────

const SCHEME = {
  rainy: {
    empty: "#f0fdf4",
    low: "#bbf7d0",
    mid: "#4ade80",
    high: "#15803d",
    accent: "#166534",
    text: "text-green-800",
    border: "border-green-700",
    badge: "bg-green-100 text-green-800",
  },
  dry: {
    empty: "#fff7ed",
    low: "#fed7aa",
    mid: "#fb923c",
    high: "#c2410c",
    accent: "#9a3412",
    text: "text-orange-800",
    border: "border-orange-700",
    badge: "bg-orange-100 text-orange-800",
  },
} as const;

/** Linear interpolation between two hex colours by ratio 0..1 */
function interpolateColor(hex1: string, hex2: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

function getCellColor(
  relFreq: number,
  maxFreq: number,
  scheme: (typeof SCHEME)[keyof typeof SCHEME],
): string {
  if (relFreq === 0 || maxFreq === 0) return scheme.empty;
  const t = relFreq / maxFreq; // normalise to 0..1 relative to max
  if (t < 0.5) return interpolateColor(scheme.low, scheme.mid, t * 2);
  return interpolateColor(scheme.mid, scheme.high, (t - 0.5) * 2);
}

// ─── component ───────────────────────────────────────────────────────────────

const MONTH_KEYS = [
  "jan","feb","mar","apr","may","jun",
  "jul","aug","sep","oct","nov","dec",
] as const;

const DecadeCalendarChart: React.FC<DecadeCalendarChartProps> = ({
  series,
  indicatorLabel,
  colorScheme,
  className = "",
}) => {
  const { t, locale } = useI18n();
  const scheme = SCHEME[colorScheme];
  const { freq, counts, totalCount, maxFreq } = useDecadeFrequencies(series);
  const tooltipInitRef = useRef(false);

  // Initialise Flowbite tooltips after mount / data change
  useEffect(() => {
    const init = async () => {
      const { initTooltips } = await import("flowbite");
      initTooltips();
    };
    init();
    tooltipInitRef.current = true;
  }, [series]);

  // Month labels via Intl (respects locale)
  const monthLabels = MONTH_KEYS.map((_, idx) =>
    new Intl.DateTimeFormat(locale === "es" ? "es" : "en", { month: "short" })
      .format(new Date(2000, idx, 1))
      .replace(".", ""),
  );

  const decadeLabels = [
    t("decadeCalendar.decade1"),
    t("decadeCalendar.decade2"),
    t("decadeCalendar.decade3"),
  ];

  if (!series || series.length === 0) {
    return (
      <div
        className={`border border-gray-200 rounded-lg p-4 flex items-center justify-center h-48 ${className}`}
      >
        <p className="text-gray-500">{t("stationPage.empty.noData")}</p>
      </div>
    );
  }

  return (
    <div
      className={`border border-gray-200 rounded-lg p-4 flex flex-col gap-3 ${className}`}
    >
      {/* Title */}
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-lg text-gray-800">{indicatorLabel}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scheme.badge}`}>
          {t("decadeCalendar.totalYears", { count: totalCount })}
        </span>
      </div>

      {/* Calendar grid — responsive: 12 cols md+, 6 cols on small */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-1 text-xs min-w-[420px]">
          <thead>
            <tr>
              {/* empty corner */}
              <th className="w-8"></th>
              {monthLabels.map((label, mi) => (
                <th
                  key={mi}
                  className="text-center font-medium text-gray-600 pb-1 capitalize"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((decade) => (
              <tr key={decade}>
                {/* Row label */}
                <td className="text-center font-semibold text-gray-500 pr-1 whitespace-nowrap">
                  {decadeLabels[decade - 1]}
                </td>
                {Array.from({ length: 12 }, (_, mi) => {
                  const month = mi + 1;
                  const relFreq = freq[month][decade];
                  const absCount = counts[month][decade];
                  const pct =
                    totalCount > 0
                      ? ((absCount / totalCount) * 100).toFixed(1)
                      : "0.0";
                  const cellColor = getCellColor(relFreq, maxFreq, scheme);
                  const tooltipId = `dc-${colorScheme}-m${month}-d${decade}`;

                  return (
                    <td key={mi} className="text-center">
                      {/* Tooltip anchor */}
                      <button
                        type="button"
                        data-tooltip-target={tooltipId}
                        data-tooltip-placement="top"
                        className="w-full aspect-square rounded-md transition-transform hover:scale-110 focus:outline-none"
                        style={{ backgroundColor: cellColor, minWidth: "20px", minHeight: "20px" }}
                        aria-label={`${monthLabels[mi]} D${decade}: ${absCount} (${pct}%)`}
                      />
                      {/* Tooltip content */}
                      <div
                        id={tooltipId}
                        role="tooltip"
                        className="absolute z-20 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip max-w-[180px]"
                      >
                        <p className="font-semibold capitalize">
                          {monthLabels[mi]} — {decadeLabels[decade - 1]}
                        </p>
                        <p>
                          {t("decadeCalendar.tooltip.count", { count: absCount })}
                        </p>
                        <p>
                          {t("decadeCalendar.tooltip.pct", { pct })}
                        </p>
                        <div className="tooltip-arrow" data-popper-arrow />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-xs text-gray-500">{t("decadeCalendar.legend.low")}</span>
        <div className="flex gap-0.5">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t_) => (
            <div
              key={t_}
              className="w-5 h-3 rounded-sm"
              style={{
                backgroundColor:
                  t_ === 0
                    ? scheme.empty
                    : getCellColor(t_ * maxFreq, maxFreq, scheme),
              }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">{t("decadeCalendar.legend.high")}</span>
        <span className="ml-auto text-xs text-gray-400">
          {t("decadeCalendar.legend.note")}
        </span>
      </div>
    </div>
  );
};

export default DecadeCalendarChart;
