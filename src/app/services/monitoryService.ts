// app/services/monitoryService.ts
import { API_URL } from "@/app/config";
import { getClientToken } from "@/app/services/clientTokenService";

// Tipos para respuestas de API
interface ClimateHistoricalDateRecord {
  id: number;
  location_id: number;
  location_name: string;
  measure_id: number;
  measure_name: string;
  measure_short_name: string;
  measure_unit: string;
  value: number;
  date: string;
}

interface ClimateHistoricalMonthRecord {
  id: number;
  location_id: number;
  location_name: string;
  measure_id: number;
  measure_name: string;
  measure_short_name: string;
  measure_unit: string;
  month: number;
  value: number;
}

interface MinMaxDateRecord {
  id: number;
  name: string;
  location_id: number;
  location_name: string;
  min_value: number;
  min_date: string;
  max_value: number;
  max_date: string;
}

interface MinMaxMonthRecord {
  id: number;
  name: string;
  location_id: number;
  location_name: string;
  min_value: number;
  min_month: number;
  max_value: number;
  max_month: number;
}

interface IndicatorRawItem {
  indicator_short_name: string;
  indicator_name: string;
  indicator_unit: string;
  start_date: string;
  value: number;
}

interface PeriodAvailability {
  value: string;
  label: string;
  has_data: boolean;
}

export const monitoryService = {
  async getStationDates(
    stationId: string,
    period: string,
    indicator: boolean,
  ): Promise<{ minDate: string | null; maxDate: string | null }> {
    // Construir la URL base según el período
    let urlBase = "";
    if (!indicator && (period === "monthly" || period === "daily")) {
      urlBase = "historical-" + period + "/minmax-by-location";
    } else if (!indicator && period === "climatology") {
      urlBase = "climatology/minmax-by-location";
    } else if (indicator) {
      urlBase = "indicator/minmax-by-location";
    } else {
      throw new Error("Invalid period specified");
    }

    const response = await fetch(
      `${API_URL}/${urlBase}?location_id=${stationId}`,
      { headers: { Authorization: `Bearer ${await getClientToken()}` } },
    );
    if (!response.ok) throw new Error("Error fetching dates");

    const data = (await response.json()) as (
      | MinMaxDateRecord
      | MinMaxMonthRecord
    )[];
    // Validar que la respuesta sea un array
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format");
    }

    let minDate: string | null = null;
    let maxDate: string | null = null;

    // Para climatología, algunos endpoints devuelven min_month/max_month en vez de min_date/max_date
    if (!indicator && period === "climatology") {
      let minMonth: string | null = null;
      let maxMonth: string | null = null;

      for (const item of data) {
        const monthItem = item as Partial<MinMaxMonthRecord>;
        const candidateMins = [monthItem.min_month];
        const candidateMaxs = [monthItem.max_month];

        const norm = (m: number | string | undefined | null) => {
          if (m === undefined || m === null) return null;
          const s = String(m).padStart(2, "0");
          // Validar que esté entre 01 y 12
          return /^(0[1-9]|1[0-2])$/.test(s) ? s : null;
        };

        const localMin = candidateMins.map(norm).find(Boolean) || null;
        const localMax = candidateMaxs.map(norm).find(Boolean) || null;

        if (localMin && (!minMonth || localMin < minMonth)) minMonth = localMin;
        if (localMax && (!maxMonth || localMax > maxMonth)) maxMonth = localMax;
      }

      // Mapear meses a fechas ficticias del año 2000 para mantener formato YYYY-MM-DD
      minDate = minMonth ? `2000-${minMonth}-01` : null;
      maxDate = maxMonth ? `2000-${maxMonth}-01` : null;
    } else {
      // Procesamiento estándar por fecha
      for (const item of data) {
        const dateItem = item as Partial<MinMaxDateRecord>;
        const dates = [dateItem.min_date, dateItem.max_date];
        for (const date of dates) {
          if (!date) continue;
          const onlyDate = String(date).split("T")[0];
          if (!minDate || onlyDate < minDate) {
            minDate = onlyDate;
          }
          if (!maxDate || onlyDate > maxDate) {
            maxDate = onlyDate;
          }
        }
      }
    }

    return { minDate, maxDate };
  },

  async getClimateHistorical(
    stationId: string,
    period: string,
    startDate: string,
    endDate: string,
  ) {
    let urlBase = "";
    let params = `location_ids=${stationId}`;

    if (period === "monthly" || period === "daily") {
      urlBase = "historical-" + period + "/by-date-range-all-measures";

      // Convertir fechas de formato mes a fecha completa si es necesario
      const convertToFullDate = (date: string) => {
        if (date.includes("2000-")) {
          const year = new Date().getFullYear(); // Usar año actual
          return `${year}-${date.split("-")[1]}-01`; // Convertir a primer día del mes
        }
        return date;
      };

      params += `&start_date=${convertToFullDate(startDate)}&end_date=${convertToFullDate(endDate)}`;
    } else if (period === "climatology") {
      urlBase = "climatology/by-month-range-location-ids-all-measures";

      // Extraer solo los meses de las fechas
      const startMonth = startDate.split("-")[1];
      const endMonth = endDate.split("-")[1];

      params += `&start_month=${startMonth}&end_month=${endMonth}`;
    } else {
      throw new Error("Invalid period specified");
    }

    const response = await fetch(`${API_URL}/${urlBase}?${params}`, {
      headers: { Authorization: `Bearer ${await getClientToken()}` },
    });
    if (!response.ok) throw new Error("Error fetching climate historical data");

    const data = (await response.json()) as Array<
      ClimateHistoricalDateRecord | ClimateHistoricalMonthRecord
    >;
    return this.processClimateData(data, period);
  },

  /**
   * Obtiene los datos de la última fecha disponible para una estación
   * @param stationId ID de la estación
   * @returns Datos de la última fecha disponible
   */
  async getLatestDailyData(
    stationId: string,
  ): Promise<ClimateHistoricalDateRecord[]> {
    try {
      // Obtener la última fecha disponible
      const { maxDate } = await this.getStationDates(stationId, "daily", false);

      if (!maxDate) {
        // No hay datos disponibles para esta estación; devolver vacío sin marcar error
        return [];
      }

      // Obtener los datos para la última fecha
      const response = await fetch(
        `${API_URL}/historical-daily/by-date-range-all-measures?location_ids=${stationId}&start_date=${maxDate}&end_date=${maxDate}`,
        { headers: { Authorization: `Bearer ${await getClientToken()}` } },
      );

      if (!response.ok) {
        throw new Error("Error fetching latest daily data");
      }

      return (await response.json()) as ClimateHistoricalDateRecord[];
    } catch (error) {
      // Registrar como advertencia para evitar overlay de errores cuando no es crítico
      console.warn("Aviso en getLatestDailyData:", error);
      return [];
    }
  },

  processClimateData(
    data: Array<ClimateHistoricalDateRecord | ClimateHistoricalMonthRecord>,
    period: string,
  ): Record<string, { dates: string[]; values: number[] }> {
    const result: Record<string, { dates: string[]; values: number[] }> = {};
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    data.forEach((item) => {
      const measureKey = item.measure_short_name;
      if (!result[measureKey]) {
        result[measureKey] = { dates: [], values: [] };
      }

      // Para climatología, usar nombres de mes
      if (period === "climatology") {
        const monthValue = "month" in item ? item.month : NaN;
        const monthIndex = Number(monthValue) - 1;
        if (monthIndex >= 0 && monthIndex < monthNames.length) {
          result[measureKey].dates.push(monthNames[monthIndex]);
        } else {
          result[measureKey].dates.push(String(monthValue));
        }
      } else {
        // Para otros períodos usar fecha completa
        const dateValue = "date" in item ? item.date : "";
        result[measureKey].dates.push(dateValue);
      }

      // Redondear a 2 decimales
      const roundedValue = parseFloat(item.value.toFixed(2));
      result[measureKey].values.push(roundedValue);
    });
    // Para daily y monthly, asegurar orden cronológico ascendente por fecha
    if (period !== "climatology") {
      Object.keys(result).forEach((key) => {
        const pairs = result[key].dates.map((date, i) => ({
          date,
          value: result[key].values[i],
        }));
        pairs.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        result[key].dates = pairs.map((p) => p.date);
        result[key].values = pairs.map((p) => p.value);
      });
    }

    return result;
  },
  /**
   * Obtiene datos históricos de indicadores climáticos
   *
   * @param stationId ID de la estación
   * @param period Período de tiempo ('annual', 'monthly', etc.)
   * @param startDate Fecha de inicio del rango (YYYY-MM-DD)
   * @param endDate Fecha de fin del rango (YYYY-MM-DD)
   * @returns Datos de indicadores procesados
   */
  async getIndicatorsHistorical(
    stationId: string,
    period: string,
    startDate: string,
    endDate: string,
  ) {
    // Construir parámetros de consulta
    const params = new URLSearchParams({
      location_id: stationId,
      start_date: startDate,
      end_date: endDate,
      period: period,
    });

    const response = await fetch(
      `${API_URL}/indicator/by-location-date-period?${params}`,
      { headers: { Authorization: `Bearer ${await getClientToken()}` } },
    );

    if (!response.ok) throw new Error("Error fetching indicators data");

    const data = await response.json();
    return this.processIndicatorsData(data);
  },

  /**
   * Procesa datos de indicadores para su uso en gráficos
   *
   * @param data Datos crudos de la API
   * @returns Datos estructurados por indicador
   */
  processIndicatorsData(data: IndicatorRawItem[]): Record<
    string,
    {
      name: string;
      unit: string;
      dates: string[];
      values: number[];
    }
  > {
    const result: Record<
      string,
      {
        name: string;
        unit: string;
        dates: string[];
        values: number[];
      }
    > = {};

    data.forEach((item) => {
      const indicatorKey = item.indicator_short_name;

      if (!result[indicatorKey]) {
        // Inicializar estructura para este indicador
        // Normalizar unidades conocidas
        const rawUnit = item.indicator_unit;
        const unit = rawUnit === "día" ? "días" : rawUnit;
        result[indicatorKey] = {
          name: item.indicator_name,
          unit,
          dates: [],
          values: [],
        };
      }

      // Usar la fecha de inicio como referencia
      const date = new Date(item.start_date).toISOString().split("T")[0];
      result[indicatorKey].dates.push(date);

      // Redondear a 2 decimales
      const roundedValue = parseFloat(item.value.toFixed(2));
      result[indicatorKey].values.push(roundedValue);
    });

    // Ordenar por fecha (más antiguo primero)
    Object.values(result).forEach((indicator) => {
      const sorted = indicator.dates
        .map((date, i) => ({ date, value: indicator.values[i] }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      indicator.dates = sorted.map((item) => item.date);
      indicator.values = sorted.map((item) => item.value);
    });

    return result;
  },

  /**
   * Obtiene todos los periodos disponibles y cuáles tienen datos para una estación específica
   * @param stationId ID de la estación
   * @returns Array de periodos con información sobre disponibilidad de datos
   */
  async getAvailablePeriods(stationId: string): Promise<PeriodAvailability[]> {
    try {
      const response = await fetch(
        `${API_URL}/periods/available?location_id=${stationId}`,
        { headers: { Authorization: `Bearer ${await getClientToken()}` } },
      );
      if (!response.ok) throw new Error("Error fetching available periods");
      return await response.json();
    } catch (error) {
      console.warn("Aviso en getAvailablePeriods:", error);
      // Retornar estructura por defecto si falla
      return [
        { value: "daily", label: "Daily", has_data: false },
        { value: "monthly", label: "Monthly", has_data: false },
        { value: "annual", label: "Annual", has_data: false },
        { value: "seasonal", label: "Seasonal", has_data: false },
        { value: "decadal", label: "Decadal", has_data: false },
        { value: "other", label: "Other", has_data: false },
      ];
    }
  },
};
