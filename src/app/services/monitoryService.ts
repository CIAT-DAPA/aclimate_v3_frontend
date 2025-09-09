// app/services/monitoryService.ts
import { API_URL } from "@/app/config";

export const monitoryService = {

  async getStationDates(stationId: string, period: string, indicator: boolean): Promise<{ minDate: string | null; maxDate: string | null}> {
    // Construir la URL base según el período
    let urlBase = '';
    if (!indicator && (period === "monthly" || period === "daily")) {
        urlBase = 'historical-' + period + '/minmax-by-location';
    } else if (!indicator && period === "climatology") {
        urlBase = 'climatology/minmax-by-location';
    } else if (indicator) {
        urlBase = 'indicator/minmax-by-location';
    } else {
        throw new Error("Invalid period specified");
    }

    const response = await fetch(
        `${API_URL}/${urlBase}?location_id=${stationId}`
    );
    if (!response.ok) throw new Error("Error fetching dates");

    const data = await response.json();
    
    // Validar que la respuesta sea un array
    if (!Array.isArray(data)) {
        throw new Error("Unexpected response format");
    }

    let minDate: string | null = null;
    let maxDate: string | null = null;

    // Procesar cada elemento para encontrar fechas extremas
    for (const item of data) {
        // Considerar tanto min_date como max_date de cada objeto
        const dates = [item.min_date, item.max_date];
        
        for (const date of dates) {
            if (!minDate || date < minDate) {
                minDate = date;
            }
            if (!maxDate || date > maxDate) {
                maxDate = date;
            }
        }
    }

    // Formatear fechas a YYYY-MM-DD
    return {
        minDate: minDate ? minDate.split('T')[0] : null,
        maxDate: maxDate ? maxDate.split('T')[0] : null
    };
},

async getClimateHistorical(stationId: string, period: string, startDate: string, endDate: string) {
  let urlBase = '';
  let params = `location_ids=${stationId}`;
  
  if (period === "monthly" || period === "daily") {
    urlBase = 'historical-' + period + '/by-date-range-all-measures';
    
    // Convertir fechas de formato mes a fecha completa si es necesario
    const convertToFullDate = (date: string) => {
      if (date.includes('2000-')) {
        const year = new Date().getFullYear(); // Usar año actual
        return `${year}-${date.split('-')[1]}-01`; // Convertir a primer día del mes
      }
      return date;
    };
    
    params += `&start_date=${convertToFullDate(startDate)}&end_date=${convertToFullDate(endDate)}`;
  } else if (period === "climatology") {
    urlBase = 'climatology/by-month-range-location-ids-all-measures';
    
    // Extraer solo los meses de las fechas
    const startMonth = startDate.split('-')[1];
    const endMonth = endDate.split('-')[1];
    
    params += `&start_month=${startMonth}&end_month=${endMonth}`;
  } else {
    throw new Error("Invalid period specified");
  }
  
  const response = await fetch(`${API_URL}/${urlBase}?${params}`);
  console.log("Fetching climate historical data from:", `${API_URL}/${urlBase}?${params}`);
  if (!response.ok) 
    throw new Error("Error fetching climate historical data");
  
  const data = await response.json();
  return this.processClimateData(data, period);
},

processClimateData(data: any[], period: string): Record<string, { dates: string[]; values: number[] }> {
  const result: Record<string, { dates: string[]; values: number[] }> = {};
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  data.forEach(item => {
    const measureKey = item.measure_short_name;
    if (!result[measureKey]) {
      result[measureKey] = { dates: [], values: [] };
    }
    
    // Para climatología, usar nombres de mes
    if (period === "climatology") {
      const monthIndex = parseInt(item.month) - 1;
      if (monthIndex >= 0 && monthIndex < monthNames.length) {
        result[measureKey].dates.push(monthNames[monthIndex]);
      } else {
        result[measureKey].dates.push(item.month);
      }
    } else {
      // Para otros períodos usar fecha completa
      result[measureKey].dates.push(item.date);
    }
    
    // Redondear a 2 decimales
    const roundedValue = parseFloat(item.value.toFixed(2));
    result[measureKey].values.push(roundedValue);
  });

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
    endDate: string
  ) {
    // Construir parámetros de consulta
    const params = new URLSearchParams({
      location_id: stationId,
      start_date: startDate,
      end_date: endDate,
      period: period
    });

    const response = await fetch(
      `${API_URL}/indicator/by-location-date-period?${params}`
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
  processIndicatorsData(data: any[]): Record<string, {
    name: string;
    unit: string;
    dates: string[];
    values: number[];
  }> {
    const result: Record<string, {
      name: string;
      unit: string;
      dates: string[];
      values: number[];
    }> = {};

    data.forEach(item => {
      const indicatorKey = item.indicator_short_name;
      
      if (!result[indicatorKey]) {
        // Inicializar estructura para este indicador
        result[indicatorKey] = {
          name: item.indicator_name,
          unit: item.indicator_unit,
          dates: [],
          values: []
        };
      }
      
      // Usar la fecha de inicio como referencia
      const date = new Date(item.start_date).toISOString().split('T')[0];
      result[indicatorKey].dates.push(date);
      
      // Redondear a 2 decimales
      const roundedValue = parseFloat(item.value.toFixed(2));
      result[indicatorKey].values.push(roundedValue);
    });

    // Ordenar por fecha (más antiguo primero)
    Object.values(result).forEach(indicator => {
      const sorted = indicator.dates
        .map((date, i) => ({ date, value: indicator.values[i] }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      indicator.dates = sorted.map(item => item.date);
      indicator.values = sorted.map(item => item.value);
    });

    return result;
  }
};