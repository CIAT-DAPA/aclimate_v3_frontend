// app/hooks/useDecadeFrequencies.ts
import { useMemo } from "react";

export interface DecadeFrequencies {
  /** freq[month][decade] = relative frequency 0..1, month 1..12, decade 1..3 */
  freq: Record<number, Record<number, number>>;
  /** absolute counts, same indexing */
  counts: Record<number, Record<number, number>>;
  totalCount: number;
  maxFreq: number;
}

/**
 * Transforms a raw series of encoded decade values (month*10 + decadeInMonth)
 * into a 12×3 matrix of relative frequencies.
 *
 * Encoding: value = month * 10 + decadeInMonth
 *   month         = Math.floor(value / 10)   // 1–12
 *   decadeInMonth = value % 10               // 1, 2 or 3
 */
export function useDecadeFrequencies(series: number[]): DecadeFrequencies {
  return useMemo(() => {
    // Build absolute count map
    const rawCounts = new Map<number, number>();
    for (const val of series) {
      if (val == null || isNaN(val)) continue;
      rawCounts.set(val, (rawCounts.get(val) ?? 0) + 1);
    }

    const totalCount = series.filter((v) => v != null && !isNaN(v)).length;

    // Initialize 12×3 structures
    const counts: Record<number, Record<number, number>> = {};
    const freq: Record<number, Record<number, number>> = {};
    for (let m = 1; m <= 12; m++) {
      counts[m] = { 1: 0, 2: 0, 3: 0 };
      freq[m] = { 1: 0, 2: 0, 3: 0 };
    }

    // Fill from raw counts
    rawCounts.forEach((count, encoded) => {
      const month = Math.floor(encoded / 10);
      const decade = encoded % 10;
      if (month >= 1 && month <= 12 && decade >= 1 && decade <= 3) {
        counts[month][decade] = count;
        freq[month][decade] = totalCount > 0 ? count / totalCount : 0;
      }
    });

    const maxFreq = Math.max(
      ...Object.values(freq).flatMap((d) => Object.values(d)),
      0,
    );

    return { freq, counts, totalCount, maxFreq };
  }, [series]);
}
