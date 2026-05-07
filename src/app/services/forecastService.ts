// app/services/forecastService.ts

export interface ForecastParameter {
  keyword: string;
  name: string;
  unit?: string;
  description?: string;
  interpretacion?: string;
}

export interface ForecastPoint {
  codigo_sitio: string;
  codigo_parametro: string;
  fecha: string;
  valor: number;
  created_at: string;
}

const getBaseUrl = (): string | null =>
  process.env.NEXT_PUBLIC_FORECAST_API_URL ?? null;

export const forecastService = {
  async getParameters(signal?: AbortSignal): Promise<ForecastParameter[]> {
    const base = getBaseUrl();
    if (!base) return [];
    const res = await fetch(`${base}/PronosticoModelos/parametros`, { signal });
    if (!res.ok) throw new Error(`Parameters fetch failed: ${res.status}`);
    return res.json();
  },

  async getForecast(
    siteId: string,
    parameterId: string,
    signal?: AbortSignal,
  ): Promise<ForecastPoint[]> {
    const base = getBaseUrl();
    if (!base) return [];
    const res = await fetch(
      `${base}/PronosticoModelos/pronostico_from_now/${siteId}/${parameterId}`,
      { signal },
    );
    if (!res.ok) throw new Error(`Forecast fetch failed: ${res.status}`);
    return res.json();
  },
};
