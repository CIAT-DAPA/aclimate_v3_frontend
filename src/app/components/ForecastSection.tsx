// app/components/ForecastSection.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloud,
  faCloudRain,
  faCloudSun,
  faSun,
  faCloudShowersHeavy,
  faDroplet,
  faTemperatureArrowUp,
  faTemperatureArrowDown,
  faThermometerFull,
  faWind,
  faEye,
  faMountainSun,
  faGauge,
  faWater,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useI18n } from "@/app/contexts/I18nContext";
import { useBranchConfig } from "@/app/configs";
import { useForecast } from "@/app/hooks/useForecast";
import type { ForecastPoint, ForecastParameter } from "@/app/services/forecastService";
import type { ApexOptions } from "apexcharts";

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
      Cargando gráfico...
    </div>
  ),
});

// ─── Parameter classification ─────────────────────────────────────────────────
//
// Each parameter type maps to an icon, a Tailwind color class (used in tabs),
// and a hex color (used in charts). Rules are tested in order; first match wins.

export type ParamType =
  | "temp_max" | "temp_min" | "temp" | "prec" | "cloud"
  | "wind" | "humidity" | "visibility" | "radiation"
  | "pressure" | "water" | "other";

interface ParamMeta {
  type: ParamType;
  icon: IconDefinition;
  color: string;       // Tailwind text-color class
  chartColor: string;  // hex for ApexCharts
}

const PARAM_RULES: Array<{ test: (kw: string) => boolean; meta: ParamMeta }> = [
  { test: (kw) => /max|alta|superior/i.test(kw) && /temp|t_max/i.test(kw),
    meta: { type: "temp_max", icon: faTemperatureArrowUp,   color: "text-red-500",    chartColor: "#EF4444" } },
  { test: (kw) => /min|baja|inferior/i.test(kw) && /temp|t_min/i.test(kw),
    meta: { type: "temp_min", icon: faTemperatureArrowDown, color: "text-blue-400",   chartColor: "#60A5FA" } },
  { test: (kw) => /^temp(eratura)?$/i.test(kw),
    meta: { type: "temp",     icon: faThermometerFull,      color: "text-orange-400", chartColor: "#FB923C" } },
  { test: (kw) => /prec|rain|lluv/i.test(kw),
    meta: { type: "prec",     icon: faCloudRain,            color: "text-blue-500",   chartColor: "#3B82F6" } },
  { test: (kw) => /nub|cloud/i.test(kw),
    meta: { type: "cloud",    icon: faCloud,                color: "text-gray-400",   chartColor: "#9CA3AF" } },
  { test: (kw) => /viento|wind|vel_viento|velocidad|v_\d+m|wd_/i.test(kw),
    meta: { type: "wind",     icon: faWind,                 color: "text-teal-500",   chartColor: "#14B8A6" } },
  { test: (kw) => /hum|humid/i.test(kw),
    meta: { type: "humidity", icon: faDroplet,              color: "text-sky-400",    chartColor: "#38BDF8" } },
  { test: (kw) => /vis|visib/i.test(kw),
    meta: { type: "visibility", icon: faEye,                color: "text-purple-400", chartColor: "#C084FC" } },
  { test: (kw) => /rad|solar|sol/i.test(kw),
    meta: { type: "radiation", icon: faMountainSun,         color: "text-yellow-500", chartColor: "#EAB308" } },
  { test: (kw) => /pres|presion|pressure|hpa|mbar/i.test(kw),
    meta: { type: "pressure", icon: faGauge,                color: "text-violet-500", chartColor: "#8B5CF6" } },
  { test: (kw) => /agua|water|nivel|caudal/i.test(kw),
    meta: { type: "water",    icon: faWater,                color: "text-cyan-500",   chartColor: "#06B6D4" } },
];

function getParamMeta(keyword: string): ParamMeta {
  for (const rule of PARAM_RULES) {
    if (rule.test(keyword)) return rule.meta;
  }
  return { type: "other", icon: faChartLine, color: "text-green-600", chartColor: "#16A34A" };
}

// Convenience helpers used for card aggregation and climogram detection
const isTempMax = (kw: string) => getParamMeta(kw).type === "temp_max";
const isTempMin = (kw: string) => getParamMeta(kw).type === "temp_min";
const isTemp    = (kw: string) => getParamMeta(kw).type === "temp";
const isPrec    = (kw: string) => getParamMeta(kw).type === "prec";
const isCloud   = (kw: string) => getParamMeta(kw).type === "cloud";

// ─── Weather icon helpers ─────────────────────────────────────────────────────

function getWeatherAssets(cloudPct: number | null, precMm: number | null) {
  const cloud = cloudPct ?? 0;
  const prec = precMm ?? 0;
  if (prec > 10) return { icon: faCloudShowersHeavy, color: "text-blue-500" };
  if (prec > 0.5) return { icon: faCloudRain, color: "text-blue-400" };
  if (cloud > 75) return { icon: faCloud, color: "text-gray-400" };
  if (cloud > 35) return { icon: faCloudSun, color: "text-yellow-400" };
  return { icon: faSun, color: "text-yellow-500" };
}

// ─── Daily aggregation ────────────────────────────────────────────────────────

interface DaySummary {
  date: string;
  label: string;
  tempMax: number | null;
  tempMin: number | null;
  tempSingle: number | null;
  totalPrec: number | null;
  avgCloud: number | null;
}

function buildDailySummaries(
  forecastData: Record<string, ForecastPoint[]>,
  parameters: ForecastParameter[],
  locale: string,
): DaySummary[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tempMaxKw = parameters.find((p) => isTempMax(p.keyword))?.keyword;
  const tempMinKw = parameters.find((p) => isTempMin(p.keyword))?.keyword;
  const tempKw    = parameters.find((p) => isTemp(p.keyword))?.keyword;
  const precKw    = parameters.find((p) => isPrec(p.keyword))?.keyword;
  const cloudKw   = parameters.find((p) => isCloud(p.keyword))?.keyword;

  const dateSet = new Set<string>();
  Object.values(forecastData).forEach((pts) =>
    pts.forEach((pt) => dateSet.add(pt.fecha.split("T")[0])),
  );
  const dates = Array.from(dateSet).sort();

  const groupReduce = (
    kw: string | undefined,
    reducer: (vals: number[]) => number,
  ): Record<string, number> => {
    if (!kw || !forecastData[kw]?.length) return {};
    const map: Record<string, number[]> = {};
    // pt.fecha looks like "2026-05-07T11:00:00" — split("T")[0] gives "2026-05-07"
    forecastData[kw].forEach((pt) => {
      const d = pt.fecha.split("T")[0];
      (map[d] ??= []).push(pt.valor);
    });
    return Object.fromEntries(
      Object.entries(map).map(([d, vals]) => [d, reducer(vals)]),
    );
  };

  const tempMaxByDay = groupReduce(tempMaxKw, (v) => Math.max(...v));
  const tempMinByDay = groupReduce(tempMinKw, (v) => Math.min(...v));
  const tempByDay    = groupReduce(tempKw,    (v) => v.reduce((a, b) => a + b, 0) / v.length);
  const precByDay = groupReduce(precKw, (v) =>
    v.reduce((a, b) => a + b, 0),
  );
  const cloudByDay = groupReduce(cloudKw, (v) =>
    v.reduce((a, b) => a + b, 0) / v.length,
  );

  const intlDay = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-SV", {
    weekday: "short",
  });
  const todayLabel = locale === "en" ? "Today" : "Hoy";
  const tomorrowLabel = locale === "en" ? "Tomorrow" : "Mañana";

  return dates.map((date) => {
    const d = new Date(date + "T12:00:00");
    const diffDays = Math.floor(
      (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    let label: string;
    if (diffDays === 0) label = todayLabel;
    else if (diffDays === 1) label = tomorrowLabel;
    else label = `${intlDay.format(d)} ${d.getDate()}`;

    return {
      date,
      label,
      tempMax: tempMaxByDay[date] ?? null,
      tempMin: tempMinByDay[date] ?? null,
      tempSingle: tempByDay[date] ?? null,
      totalPrec: precByDay[date] ?? null,
      avgCloud: cloudByDay[date] ?? null,
    };
  });
}

// ─── Chart data builders ──────────────────────────────────────────────────────

function buildClimoData(
  forecastData: Record<string, ForecastPoint[]>,
  precKw: string,
  tempMaxKw: string | undefined,
  tempMinKw: string | undefined,
  tempKw: string | undefined,
) {
  const dateSet = new Set<string>();
  forecastData[precKw]?.forEach((pt) => dateSet.add(pt.fecha.split("T")[0]));
  const dates = Array.from(dateSet).sort();

  const aggregate = (
    kw: string | undefined,
    fn: (v: number[]) => number,
  ): [number, number][] => {
    if (!kw || !forecastData[kw]?.length) return [];
    const map: Record<string, number[]> = {};
    forecastData[kw].forEach((pt) => {
      const d = pt.fecha.split("T")[0];
      (map[d] ??= []).push(pt.valor);
    });
    return dates.map((d) => [
      new Date(d + "T12:00:00Z").getTime(),
      map[d] ? fn(map[d]) : 0,
    ]);
  };

  return {
    precData:    aggregate(precKw,    (v) => v.reduce((a, b) => a + b, 0)),
    tempMaxData: aggregate(tempMaxKw, (v) => Math.max(...v)),
    tempMinData: aggregate(tempMinKw, (v) => Math.min(...v)),
    tempData:    aggregate(tempKw,    (v) => v.reduce((a, b) => a + b, 0) / v.length),
  };
}

function buildLineData(points: ForecastPoint[]): [number, number][] {
  return [...points]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((pt) => [new Date(pt.fecha).getTime(), pt.valor]);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ForecastSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[90px] h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-24 h-7 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-lg" />
    </div>
  );
}

// ─── Daily cards ──────────────────────────────────────────────────────────────

function DailyCards({ summaries }: { summaries: DaySummary[] }) {
  if (!summaries.length) return null;
  const hasTemp       = summaries.some((s) => s.tempMax !== null || s.tempMin !== null);
  const hasTempSingle = summaries.some((s) => s.tempSingle !== null);
  const hasPrec       = summaries.some((s) => s.totalPrec !== null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 mb-5">
      {summaries.map((day) => {
        const { icon, color } = getWeatherAssets(day.avgCloud, day.totalPrec);
        return (
          <div
            key={day.date}
            className="flex-shrink-0 flex flex-col items-center bg-gray-50 border border-gray-200 rounded-xl p-3 min-w-[86px] gap-1"
          >
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              {day.label}
            </span>
            <FontAwesomeIcon icon={icon} className={`w-7 h-7 ${color} my-0.5`} />
            {hasTemp && (
              <div className="flex gap-1.5 text-xs font-medium">
                {day.tempMax !== null && (
                  <span className="text-red-500 flex items-center gap-0.5">
                    <FontAwesomeIcon icon={faTemperatureArrowUp} className="w-2.5 h-2.5" />
                    {day.tempMax.toFixed(1)}°
                  </span>
                )}
                {day.tempMin !== null && (
                  <span className="text-blue-400 flex items-center gap-0.5">
                    <FontAwesomeIcon icon={faTemperatureArrowDown} className="w-2.5 h-2.5" />
                    {day.tempMin.toFixed(1)}°
                  </span>
                )}
              </div>
            )}
            {hasTempSingle && day.tempSingle !== null && (
              <div className="flex items-center gap-1 text-xs font-medium text-orange-400">
                <FontAwesomeIcon icon={faThermometerFull} className="w-2.5 h-2.5" />
                {day.tempSingle.toFixed(1)}°
              </div>
            )}
            {hasPrec && day.totalPrec !== null && (
              <div className="flex items-center gap-1 text-[11px] text-blue-500">
                <FontAwesomeIcon icon={faCloudRain} className="w-2.5 h-2.5" />
                <span>{day.totalPrec.toFixed(1)} mm</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Climogram (dual-axis: prec bars + temp lines) ────────────────────────────

interface ClimoChartProps {
  forecastData: Record<string, ForecastPoint[]>;
  precKw: string;
  tempMaxKw: string | undefined;
  tempMinKw: string | undefined;
  tempKw: string | undefined;
  parameters: ForecastParameter[];
}

function ClimoChart({
  forecastData,
  precKw,
  tempMaxKw,
  tempMinKw,
  tempKw,
  parameters,
}: ClimoChartProps) {
  const { precData, tempMaxData, tempMinData, tempData } = useMemo(
    () => buildClimoData(forecastData, precKw, tempMaxKw, tempMinKw, tempKw),
    [forecastData, precKw, tempMaxKw, tempMinKw, tempKw],
  );

  const precParam    = parameters.find((p) => p.keyword === precKw);
  const tempMaxParam = parameters.find((p) => p.keyword === tempMaxKw);
  const tempMinParam = parameters.find((p) => p.keyword === tempMinKw);
  const tempParam    = parameters.find((p) => p.keyword === tempKw);

  const hasTempMax    = tempMaxData.length > 0;
  const hasTempMin    = tempMinData.length > 0;
  const hasTempSingle = tempData.length > 0;

  const series = [
    { name: precParam?.name ?? "Precipitación", type: "bar", data: precData },
    ...(hasTempMax
      ? [{ name: tempMaxParam?.name ?? "T. Máx", type: "line", data: tempMaxData }]
      : []),
    ...(hasTempMin
      ? [{ name: tempMinParam?.name ?? "T. Mín", type: "line", data: tempMinData }]
      : []),
    ...(hasTempSingle
      ? [{ name: tempParam?.name ?? "Temperatura", type: "line", data: tempData }]
      : []),
  ];

  // Dynamic colors: prec=blue, tempMax=red, tempMin=lightblue, tempSingle=orange
  const colors = [
    "#3B82F6",
    ...(hasTempMax    ? ["#EF4444"] : []),
    ...(hasTempMin    ? ["#60A5FA"] : []),
    ...(hasTempSingle ? ["#FB923C"] : []),
  ];

  // yaxis: one entry per series.
  // ApexCharts mixed charts need one yaxis entry per series when using dual axes.
  // Extra temp lines share the right axis — the duplicate entries have show:false.
  const hasTempAxis   = hasTempMax || hasTempMin || hasTempSingle;
  const extraTempCount = (hasTempMax ? 1 : 0) + (hasTempMin ? 1 : 0) + (hasTempSingle ? 1 : 0);
  const yaxis: ApexOptions["yaxis"] = [
    {
      seriesName: precParam?.name ?? "Precipitación",
      title: { text: `Precipitación (${precParam?.unit ?? "mm"})` },
      min: 0,
      labels: { formatter: (v: number) => v.toFixed(1) },
    },
    ...(hasTempAxis
      ? [
          {
            opposite: true,
            title: { text: "Temperatura (°C)" },
            labels: { formatter: (v: number) => v.toFixed(1) },
          },
        ]
      : []),
    // Hidden duplicates for any 2nd+ temp series
    ...Array.from({ length: extraTempCount - (hasTempAxis ? 1 : 0) }).map(() => ({
      opposite: true,
      show: false,
    })),
  ];

  const options: ApexOptions = {
    chart: { type: "line", height: "100%", toolbar: { show: true }, animations: { enabled: false } },
    stroke: { curve: "smooth", width: series.map((s) => (s.type === "bar" ? 0 : 2)) },
    plotOptions: { bar: { columnWidth: "60%", borderRadius: 2 } },
    fill: { opacity: series.map((s) => (s.type === "bar" ? 0.75 : 1)) },
    colors,
    xaxis: {
      type: "datetime",
      title: { text: "Fecha" },
      labels: {
        datetimeUTC: true,
        formatter: (val: string) => {
          const d = new Date(Number(val));
          return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
        },
      },
    },
    yaxis,
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: (val: number) =>
          new Date(val).toLocaleDateString("es-SV", { day: "numeric", month: "short" }),
      },
    },
    legend: { show: true, position: "top" },
  };

  return (
    <ApexChart
      type="line"
      options={options}
      series={series}
      height="100%"
      width="100%"
    />
  );
}

// ─── Single parameter line chart ──────────────────────────────────────────────

interface LineChartProps {
  points: ForecastPoint[];
  parameter: ForecastParameter;
}

function LineChart({ points, parameter }: LineChartProps) {
  const meta = useMemo(() => getParamMeta(parameter.keyword), [parameter.keyword]);
  const data = useMemo(() => buildLineData(points), [points]);

  const options: ApexOptions = {
    chart: { type: "line", height: "100%", toolbar: { show: true }, animations: { enabled: false } },
    stroke: { curve: "smooth", width: 2 },
    colors: [meta.chartColor],
    title: {
      text: parameter.name,
      align: "left",
      style: { fontSize: "15px", fontWeight: "bold" },
    },
    xaxis: {
      type: "datetime",
      title: { text: "Fecha / Hora" },
      labels: {
        datetimeUTC: false,
        formatter: (val: string) => {
          const d = new Date(Number(val));
          return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}h`;
        },
      },
    },
    yaxis: {
      title: { text: parameter.unit ? `${parameter.name} (${parameter.unit})` : parameter.name },
      labels: { formatter: (v: number) => v.toFixed(2) },
    },
    tooltip: {
      x: {
        formatter: (val: number) =>
          new Date(val).toLocaleString("es-SV", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          }),
      },
      y: {
        formatter: (v: number) =>
          `${v.toFixed(2)}${parameter.unit ? " " + parameter.unit : ""}`,
        title: { formatter: (name: string) => name },
      },
    },
    markers: { size: 3, hover: { size: 5 } },
  };

  return (
    <ApexChart
      type="line"
      options={options}
      series={[{ name: parameter.name, data }]}
      height="100%"
      width="100%"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface ForecastSectionProps {
  extId: string;
}

export default function ForecastSection({ extId }: ForecastSectionProps) {
  const { t, locale } = useI18n();
  const branchConfig = useBranchConfig();
  const [isOpen, setIsOpen] = useState(true);
  const { parameters, forecastData, loading, error } = useForecast(extId);
  const [selectedTab, setSelectedTab] = useState<string>("");

  const precKw    = parameters.find((p) => isPrec(p.keyword))?.keyword;
  const tempMaxKw = parameters.find((p) => isTempMax(p.keyword))?.keyword;
  const tempMinKw = parameters.find((p) => isTempMin(p.keyword))?.keyword;
  const tempKw    = parameters.find((p) => isTemp(p.keyword))?.keyword;

  const hasClimoData = Boolean(
    precKw &&
      forecastData[precKw]?.length &&
      (tempMaxKw || tempMinKw || tempKw),
  );

  // Initialise default tab once parameters are loaded
  useEffect(() => {
    if (parameters.length > 0 && !selectedTab) {
      const firstNonClimo = parameters[0]?.keyword;
      setSelectedTab(firstNonClimo ?? "");
    }
  }, [parameters, selectedTab]);

  const dailySummaries = useMemo(
    () => buildDailySummaries(forecastData, parameters, locale),
    [forecastData, parameters, locale],
  );

  const hasCardData = dailySummaries.some((d) => d.avgCloud !== null || d.totalPrec !== null);
  const sourceText = branchConfig.station?.forecastSource;

  return (
    <div id="forecast-accordion">
      <h2 id="forecast-accordion-trigger">
        <button
          type="button"
          className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 hover:bg-gray-100"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
        >
          <span className="text-xl font-semibold text-gray-800">
            {t("stationPage.sections.forecast")}
          </span>
          <svg
            className={`w-6 h-6 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </h2>

      <div
        id="forecast-accordion-content"
        className={isOpen ? "" : "hidden"}
        aria-labelledby="forecast-accordion-trigger"
      >
        <div className="p-5 border border-t-0 border-gray-200 space-y-4">
          {/* Description + source attribution */}
          <div className="space-y-2">
            <p className="text-gray-700 text-sm">{t("stationPage.forecast.description")}</p>
            {sourceText && (
              <p className="text-sm text-gray-500 font-medium border-l-4 border-brand-green pl-3 py-0.5 italic">
                {sourceText}
              </p>
            )}
          </div>

          {loading && <ForecastSkeleton />}

          {!loading && error && (
            <p className="text-red-500 text-sm py-4">{error}</p>
          )}

          {!loading && !error && parameters.length === 0 && (
            <p className="text-gray-500 py-4">{t("stationPage.empty.noData")}</p>
          )}

          {!loading && !error && parameters.length > 0 && (
            <>
              {/* Daily weather cards */}
              {hasCardData && <DailyCards summaries={dailySummaries} />}

              {/* Climogram — always visible when data is available */}
              {hasClimoData && precKw && (
                <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                  <div>
                    <h3 className="font-medium text-lg text-gray-800">
                      {t("stationPage.forecast.tabs.climogram")}
                    </h3>
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md mt-1">
                      {t("stationPage.forecast.tabs.climogramTooltip")}
                    </p>
                  </div>
                  <div className="relative h-80 overflow-hidden">
                    <ClimoChart
                      forecastData={forecastData}
                      precKw={precKw}
                      tempMaxKw={tempMaxKw}
                      tempMinKw={tempMinKw}
                      tempKw={tempKw}
                      parameters={parameters}
                    />
                  </div>
                </div>
              )}

              {/* Parameter tabs — individual variable pills */}
              <div className="flex flex-wrap gap-2">
                {parameters.map((p) => {
                  const meta = getParamMeta(p.keyword);
                  const isActive = selectedTab === p.keyword;
                  const tooltipText = [p.name, p.interpretacion].filter(Boolean).join(" — ");
                  return (
                    <button
                      key={p.keyword}
                      onClick={() => setSelectedTab(p.keyword)}
                      className={`relative group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border select-none ${
                        isActive ? "text-white border-transparent" : "bg-white border-gray-300 hover:bg-gray-50"
                      }`}
                      style={isActive ? { backgroundColor: meta.chartColor, borderColor: meta.chartColor } : {}}
                    >
                      <FontAwesomeIcon
                        icon={meta.icon}
                        className={`w-3.5 h-3.5 ${isActive ? "text-white" : meta.color}`}
                      />
                      <span className={isActive ? "text-white" : "text-gray-700"}>{p.name}</span>
                      {tooltipText && (
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 font-normal">
                          {tooltipText}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Chart for selected individual parameter */}
              {selectedTab && forecastData[selectedTab] && (
                <div className="relative h-80 overflow-hidden">
                  <LineChart
                    points={forecastData[selectedTab]}
                    parameter={parameters.find((p) => p.keyword === selectedTab)!}
                  />
                </div>
              )}
              {/* Parameter description from API */}
              {selectedTab &&
                parameters.find((p) => p.keyword === selectedTab)?.interpretacion && (
                  <p className="text-xs text-gray-400 italic mt-1.5 px-1">
                    {parameters.find((p) => p.keyword === selectedTab)?.interpretacion}
                  </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
