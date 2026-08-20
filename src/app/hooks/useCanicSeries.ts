// app/hooks/useCanicSeries.ts
import { useState, useEffect } from "react";
import { monitoryService } from "@/app/services/monitoryService";

export interface CanicYearRow {
  year: number;
  julianDay: number | null;
  startDate: Date | null;
  duration: number | null;
  intensity: number | null;
  category: "Leve" | "Moderada" | "Severa" | null;
}

function julianToDate(julianDay: number, year: number): Date {
  const d = new Date(year, 0, 1);
  d.setDate(d.getDate() + julianDay - 1);
  return d;
}

function getIntensityCategory(
  value: number
): "Leve" | "Moderada" | "Severa" {
  if (value < 25) return "Leve";
  if (value < 50) return "Moderada";
  return "Severa";
}

type RawIndicator = { dates: string[]; values: number[] } | null;

function buildYearMap(indicator: RawIndicator): Map<number, number> {
  const map = new Map<number, number>();
  if (!indicator) return map;
  indicator.dates.forEach((d, i) => {
    const y = parseInt(d.split("-")[0], 10);
    if (!isNaN(y)) map.set(y, indicator.values[i]);
  });
  return map;
}

function extractYearsFromIndicator(
  indicator: RawIndicator,
  yearSet: Set<number>
): void {
  indicator?.dates.forEach((d) => {
    const y = parseInt(d.split("-")[0], 10);
    if (!isNaN(y)) yearSet.add(y);
  });
}

/**
 * Fetches and combines CANIC, CANIC-Dur and CANIC-Int annual series for a
 * given station into a typed per-year array.  Makes a single
 * getIndicatorsHistorical request — all three sub-indicators are returned
 * in the same API response.
 */
export function useCanicSeries(locationId: string | null): {
  data: CanicYearRow[];
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<CanicYearRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!locationId) {
      setData([]);
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
          "annual",
          true
        );

        if (!minDate || !maxDate) {
          if (!cancelled) setData([]);
          return;
        }

        // Single request — all three CANIC sub-indicators come in one response
        const raw = await monitoryService.getIndicatorsHistorical(
          locationId,
          "annual",
          minDate,
          maxDate
        );

        if (cancelled) return;

        const canicData = (raw as Record<string, RawIndicator>)["CANIC"] ?? null;
        const durData = (raw as Record<string, RawIndicator>)["CANIC-Dur"] ?? null;
        const intData = (raw as Record<string, RawIndicator>)["CANIC-Int"] ?? null;

        const yearSet = new Set<number>();
        extractYearsFromIndicator(canicData, yearSet);
        extractYearsFromIndicator(durData, yearSet);
        extractYearsFromIndicator(intData, yearSet);

        if (yearSet.size === 0) {
          setData([]);
          return;
        }

        const canicMap = buildYearMap(canicData);
        const durMap = buildYearMap(durData);
        const intMap = buildYearMap(intData);

        const years = Array.from(yearSet).sort((a, b) => a - b);

        const rows: CanicYearRow[] = years.map((year) => {
          const julianDay = canicMap.has(year) ? canicMap.get(year)! : null;
          const duration = durMap.has(year) ? durMap.get(year)! : null;
          const intensity = intMap.has(year) ? intMap.get(year)! : null;
          const startDate =
            julianDay != null ? julianToDate(julianDay, year) : null;
          const category =
            intensity != null ? getIntensityCategory(intensity) : null;
          return { year, julianDay, startDate, duration, intensity, category };
        });

        setData(rows);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error("Error loading CANIC data")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  return { data, isLoading, error };
}
