// app/hooks/usePrcdSeries.ts
import { useState, useEffect, useMemo } from "react";
import { monitoryService } from "@/app/services/monitoryService";
import { useI18n } from "@/app/contexts/I18nContext";

export interface PrcdDecadeRow {
  decadeIndex: number;      // 0-35, chronological position within the year
  month: number;            // 1-12
  decNum: 1 | 2 | 3;
  startDate: Date;
  label: string;            // "Ene D1", "Ene D2", etc. in project locale
  prcd: number | null;      // mm
  abs: number | null;       // mm — absolute anomaly
  rel: number | null;       // % — relative anomaly
  cat: 1 | 2 | 3 | null;   // tercile category
}

const MONTH_SHORT: Record<string, string[]> = {
  es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

type RawRecord = { dates: string[]; values: number[] } | undefined | null;

function buildDateMap(record: RawRecord): Map<string, number> {
  const m = new Map<string, number>();
  if (!record) return m;
  record.dates.forEach((d, i) => m.set(d, record.values[i]));
  return m;
}

function extractYears(record: RawRecord, set: Set<number>): void {
  record?.dates.forEach((d) => {
    const y = parseInt(d.slice(0, 4), 10);
    if (!isNaN(y)) set.add(y);
  });
}

/**
 * Fetches all PRCD, PRCD-Abs, PRCD-Rel and PRCD-Cat data for a station in a
 * single request, then filters client-side by the requested year to build a
 * fixed 36-entry array (one per decade of the year).
 */
export function usePrcdSeries(
  locationId: string | null,
  year: number | null
): {
  data: PrcdDecadeRow[];
  availableYears: number[];
  isLoading: boolean;
  error: Error | null;
} {
  const { locale } = useI18n();
  const [allRaw, setAllRaw] = useState<Record<string, RawRecord> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the full dataset once per locationId
  useEffect(() => {
    if (!locationId) {
      setAllRaw(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { minDate, maxDate } = await monitoryService.getStationDates(
          locationId,
          "decadal",
          true
        );

        if (!minDate || !maxDate) {
          if (!cancelled) setAllRaw({});
          return;
        }

        // Single request — all four PRCD sub-indicators in one response
        const raw = await monitoryService.getIndicatorsHistorical(
          locationId,
          "decadal",
          minDate,
          maxDate
        );

        if (!cancelled) setAllRaw(raw as Record<string, RawRecord>);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err : new Error("Error loading PRCD data")
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  // Derive available years from the raw data (sorted newest first for default selection)
  const availableYears = useMemo(() => {
    if (!allRaw) return [];
    const yearSet = new Set<number>();
    (["PRCD", "PRCD-Abs", "PRCD-Rel", "PRCD-Cat"] as const).forEach((k) =>
      extractYears(allRaw[k] ?? null, yearSet)
    );
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allRaw]);

  // Build the 36-entry array for the selected year (client-side filtering)
  const data = useMemo((): PrcdDecadeRow[] => {
    if (!allRaw || year == null) return [];

    const prcdMap = buildDateMap(allRaw["PRCD"] ?? null);
    const absMap  = buildDateMap(allRaw["PRCD-Abs"] ?? null);
    const relMap  = buildDateMap(allRaw["PRCD-Rel"] ?? null);
    const catMap  = buildDateMap(allRaw["PRCD-Cat"] ?? null);

    const months = MONTH_SHORT[locale] ?? MONTH_SHORT["es"];
    const rows: PrcdDecadeRow[] = [];

    for (let month = 1; month <= 12; month++) {
      for (let dec = 1; dec <= 3; dec++) {
        const day = dec === 1 ? 1 : dec === 2 ? 11 : 21;
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const decNum = dec as 1 | 2 | 3;
        const decadeIndex = (month - 1) * 3 + (dec - 1);

        const prcd = prcdMap.has(dateStr) ? prcdMap.get(dateStr)! : null;
        const abs  = absMap.has(dateStr)  ? absMap.get(dateStr)!  : null;
        const rel  = relMap.has(dateStr)  ? relMap.get(dateStr)!  : null;
        const rawCat = catMap.has(dateStr) ? catMap.get(dateStr)! : null;
        const cat = rawCat != null ? (Math.round(rawCat) as 1 | 2 | 3) : null;

        rows.push({
          decadeIndex,
          month,
          decNum,
          startDate: new Date(year, month - 1, day),
          label: `${months[month - 1]} D${dec}`,
          prcd,
          abs,
          rel,
          cat,
        });
      }
    }
    return rows;
  }, [allRaw, year, locale]);

  return { data, availableYears, isLoading, error };
}
