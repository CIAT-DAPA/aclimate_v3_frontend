// app/hooks/useForecast.ts
"use client";

import { useState, useEffect } from "react";
import {
  forecastService,
  ForecastParameter,
  ForecastPoint,
} from "@/app/services/forecastService";

export type ForecastData = Record<string, ForecastPoint[]>;

export interface UseForecastResult {
  parameters: ForecastParameter[];
  forecastData: ForecastData;
  loading: boolean;
  error: string | null;
}

/**
 * Loads forecast data in the background without blocking the rest of the page.
 * Returns empty state immediately if extId is null or NEXT_PUBLIC_FORECAST_API_URL is not set.
 */
export function useForecast(extId: string | null): UseForecastResult {
  const [parameters, setParameters] = useState<ForecastParameter[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!extId || !process.env.NEXT_PUBLIC_FORECAST_API_URL) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = await forecastService.getParameters(signal);
        setParameters(params);

        const results = await Promise.allSettled(
          params.map((p) =>
            forecastService
              .getForecast(extId, p.keyword, signal)
              .then((data) => ({ keyword: p.keyword, data })),
          ),
        );

        const data: ForecastData = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") {
            data[r.value.keyword] = r.value.data;
          }
        });
        setForecastData(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [extId]);

  return { parameters, forecastData, loading, error };
}
