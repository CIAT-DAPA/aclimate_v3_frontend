// app/monitory/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { stationService } from "@/app/services/stationService";
import { monitoryService } from "@/app/services/monitoryService";
import { Station } from "@/app/types/Station";
import Link from "next/link";
import ClimateChart from "@/app/components/ClimateChart";

// Cargar el mapa dinámicamente sin SSR
const MapComponent = dynamic(() => import("@/app/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
    </div>
  ),
});

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

export default function StationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<'climatic' | 'indicators'>('climatic');
  const [timePeriod, setTimePeriod] = useState<string>("daily");
  const [timePeriodIndicators, setTimePeriodIndicators] = useState<string>("monthly");
  const [filterDates, setFilterDates] = useState<{ start: string; end: string }>({ start: "", end: "" });

  const [station, setStation] = useState<Station | null>(null);
  const [stationDates, setStationDates] = useState<any>(null);
  const [climateHistoricalData, setClimateHistoricalData] = useState<any>(null);
  const [indicatorsData, setIndicatorsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Opciones para el selector de período de indicadores
  const indicatorPeriodOptions = [
    { value: "daily", label: "Diario" },
    { value: "monthly", label: "Mensual" },
    { value: "annual", label: "Anual" },
    { value: "seasonal", label: "Estacional" },
    { value: "decadal", label: "Decadal" },
    { value: "other", label: "Otro" },
  ];

  // Convertir fecha a formato de mes (para climatología)
  const dateToMonthFormat = (date: string) => {
    if (!date) return "2000-01"; // Valor por defecto
    const [year, month] = date.split('-');
    return `2000-${month}`; // Usamos 2000 como año ficticio
  };

  // Convertir mes a formato de fecha (para climatología)
  const monthToDateFormat = (monthValue: string) => {
    return `2000-${monthValue}`;
  };
  // Efecto para cargar datos de la estación
  useEffect(() => {
    const fetchStation = async () => {
      try {
        setLoading(true);
        const stationData = await stationService.getById(id);
        setStation(stationData[0]);
        const dates = await monitoryService.getStationDates(id, timePeriod, activeTab === "indicators");
        setStationDates(dates);
        
        // Para climatología, usar formato de mes
        if (timePeriod === "climatology") {
          setFilterDates({ 
            start: dateToMonthFormat(dates.minDate || "2000-01"), 
            end: dateToMonthFormat(dates.maxDate || "2000-12") 
          });
        } else {
          setFilterDates({ 
            start: dates.minDate || "", 
            end: dates.maxDate || "" 
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading station data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStation();
    }
  }, [id, timePeriod, activeTab]);

  // Agrega este nuevo useEffect después del primer useEffect
  useEffect(() => {
    if (!stationDates) return;
    
    if (timePeriod === "climatology") {
      setFilterDates({ 
        start: dateToMonthFormat(stationDates.minDate), 
        end: dateToMonthFormat(stationDates.maxDate) 
      });
    } else {
      setFilterDates({ 
        start: stationDates.minDate, 
        end: stationDates.maxDate 
      });
    }
  }, [timePeriod, stationDates]);

  // Efecto para cargar datos climáticos cuando cambian los filtros
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        if (!filterDates.start || !filterDates.end) return;
        
        const climateHistorical = await monitoryService.getClimateHistorical(
          id, 
          timePeriod, 
          filterDates.start, 
          filterDates.end
        );
        setClimateHistoricalData(climateHistorical);
        if (activeTab === 'indicators') {
            const indicators = await monitoryService.getIndicatorsHistorical(
              id,
              timePeriodIndicators,
              filterDates.start,
              filterDates.end
            );
            setIndicatorsData(indicators);
          }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading climate data");
      }
    };

    fetchChartData();
  }, [timePeriod, filterDates, id, activeTab, timePeriodIndicators]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#bc6c25] text-white cursor-pointer px-4 py-2 rounded hover:bg-amber-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Estación no encontrada</p>
          <Link
            href="/"
            className="bg-[#bc6c25] text-white cursor-pointer px-4 py-2 rounded hover:bg-amber-700 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Formatear fechas
  const startDate = stationDates.minDate;
  const endDate = stationDates.maxDate;

  function getIndicatorColor(indicatorKey: string): string {
    const colorMap: Record<string, string> = {
      "cold_stress": "#2196F3",
      "heat_stress": "#F44336",
      "precipitation": "#4CAF50",
      "drought": "#FF9800",
      "default": "#9C27B0"
    };

    return colorMap[indicatorKey] || colorMap.default;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="bg-white shadow-sm max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Monitoreo</h1>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">
            Estación {station?.name || "Desconocida"}
          </h2>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-medium">Ubicación:</span> {station?.admin2_name || "N/A"},{" "}
            {station?.admin1_name || "N/A"}, {station?.country_name || "N/A"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {station?.latitude?.toFixed(6) || "N/A"}, {station?.longitude?.toFixed(6) || "N/A"}
          </p>
        </div>
        
        {/* Línea divisora */}
        <div className="border-t border-gray-200"></div>

        {/* Descripción de la estación */}
        <div className="mt-4 mb-4 text-gray-700">
          <p>
            La estación meteorológica <strong>{station?.name || "Desconocida"}</strong> está ubicada en{" "}
            <strong>{station?.admin2_name || "N/A"}, {station?.country_name || "N/A"}</strong> en la latitud{" "}
            <strong>{station?.latitude?.toFixed(4) || "N/A"}</strong> y longitud{" "}
            <strong>{station?.longitude?.toFixed(4) || "N/A"}</strong>, ha registrado datos desde el{" "}
            <strong>{startDate}</strong> hasta el{" "}
            <strong>{endDate}</strong>, cubriendo variables clave para el monitoreo agroclimático.
          </p>
        </div>
        
        {/* Sección de fechas con selector de rango */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Fechas</h3>
          
          {timePeriod === "climatology" ? (
            // Selectores de mes para climatología
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-month" className="block text-sm font-medium text-gray-700 mb-1">
                  Mes inicial
                </label>
                <select
                  id="start-month"
                  value={filterDates.start.split('-')[1]}
                  onChange={(e) => setFilterDates(prev => ({
                    ...prev, 
                    start: monthToDateFormat(e.target.value)
                  }))}
                  // Añadido: Clases para mejorar la apariencia del select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-gray-900 bg-white"
                >
                  {MONTHS.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="end-month" className="block text-sm font-medium text-gray-700 mb-1">
                  Mes final
                </label>
                <select
                  id="end-month"
                  value={filterDates.end.split('-')[1]}
                  onChange={(e) => setFilterDates(prev => ({
                    ...prev, 
                    end: monthToDateFormat(e.target.value)
                  }))}
                  // Añadido: Clases para mejorar la apariencia del select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-gray-900 bg-white"
                >
                  {MONTHS.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            // Selectores de fecha para otros modos
            <div className="flex flex-col md:flex-row md:justify-start gap-4">
              <div className="flex flex-col">
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha inicial
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={filterDates.start}
                  min={stationDates?.minDate || ""}
                  max={stationDates?.maxDate || ""}
                  onChange={(e) => setFilterDates(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              
              <div className="flex flex-col">
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha final
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={filterDates.end}
                  min={filterDates.start || stationDates?.minDate || ""}
                  max={stationDates?.maxDate || ""}
                  onChange={(e) => setFilterDates(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {timePeriod === "climatology" 
                ? "Rango completo: Todos los meses" 
                : `Rango completo: ${startDate} - ${endDate}`}
            </div>
            <button
              onClick={() => {
                if (stationDates) {
                  if (timePeriod === "climatology") {
                    setFilterDates({ 
                      start: dateToMonthFormat(stationDates.minDate), 
                      end: dateToMonthFormat(stationDates.maxDate) 
                    });
                  } else {
                    setFilterDates({ 
                      start: stationDates.minDate, 
                      end: stationDates.maxDate 
                    });
                  }
                }
              }}
              className="text-sm text-brand-green hover:text-green-700 font-medium"
            >
              Restablecer rango
            </button>
          </div>
        </div>
        
        
        {/* Mapa */}
        <div className="h-80 rounded-lg overflow-hidden border border-gray-200">
          <MapComponent
            center={[station.latitude, station.longitude]}
            zoom={13}
            stations={[station]}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Segunda card - Gráficas y datos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Tabs para selección de tipo de datos */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`py-3 px-6 font-medium ${
                  activeTab === 'climatic'
                    ? 'text-black border-b-2 border-brand-green'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('climatic')}
              >
                Datos climáticos
              </button>
              <button
                className={`py-3 px-6 font-medium ${
                  activeTab === 'indicators'
                    ? 'text-black border-b-2 border-brand-green'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('indicators')}
              >
                Indicadores climáticos
              </button>
            </div>

            {/* Selector de período de tiempo */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {activeTab === 'climatic' ? 'Datos climáticos' : 'Indicadores climáticos'}
              </h2>
              {/* Selector condicional basado en la pestaña activa */}
              {activeTab === 'climatic' ? (
                <div className="flex items-center bg-gray-100 rounded">
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    // Modificado: Añadir clases para texto negro
                    className="px-4 py-2 text-gray-900 bg-transparent focus:outline-none"
                  >
                    <option value="daily">Diario</option>
                    <option value="monthly">Mensual</option>
                    <option value="climatology">Climatología</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center bg-gray-100 rounded">
                  <select
                    value={timePeriodIndicators}
                    onChange={(e) => setTimePeriodIndicators(e.target.value)}
                    // Modificado: Añadir clases para texto negro
                    className="px-4 py-2 text-gray-900 bg-transparent focus:outline-none"
                  >
                    {indicatorPeriodOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Contenido de los tabs */}
            <div className="mt-6">
              {activeTab === 'climatic' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ClimateChart 
                    title="Temperatura máxima" 
                    unit="°C"
                    datasets={[
                      { 
                        label: "Datos estación", 
                        color: "#4CAF50",
                        data: climateHistoricalData?.Tmax?.values || [],
                        dates: climateHistoricalData?.Tmax?.dates || []
                      }
                    ]}
                    period={timePeriod}
                  />
                  <ClimateChart 
                    title="Precipitación" 
                    unit="mm"
                    datasets={[
                      { 
                        label: "Datos estación", 
                        color: "#2196F3",
                        data: climateHistoricalData?.Prec?.values || [],
                        dates: climateHistoricalData?.Prec?.dates || []
                      }
                    ]}
                    period={timePeriod}
                  />
                  <ClimateChart 
                    title="Temperatura mínima" 
                    unit="°C"
                    datasets={[
                      { 
                        label: "Datos estación", 
                        color: "#FF9800",
                        data: climateHistoricalData?.Tmin?.values || [],
                        dates: climateHistoricalData?.Tmin?.dates || []
                      }
                    ]}
                    period={timePeriod}
                  />
                  <ClimateChart 
                    title="Radiación solar" 
                    unit="MJ/m²"
                    datasets={[
                      { 
                        label: "Datos estación", 
                        color: "#F44336",
                        data: climateHistoricalData?.Rad?.values || [],
                        dates: climateHistoricalData?.Rad?.dates || []
                      }
                    ]}
                    period={timePeriod}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {indicatorsData && Object.keys(indicatorsData).length > 0 ? (
                    Object.entries(indicatorsData).map(([key, indicator]) => (
                      <ClimateChart
                        key={key}
                        title={indicator.name}
                        unit={indicator.unit}
                        datasets={[
                          { 
                            label: "Datos estación", 
                            color: getIndicatorColor(key),
                            data: indicator.values,
                            dates: indicator.dates
                          }
                        ]}
                        period={timePeriodIndicators}
                      />
                    ))
                  ) : (
                    <div className="col-span-2 flex items-center justify-center">
                      <p className="text-gray-500">No hay datos disponibles</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón de descarga */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button className="bg-brand-green text-black py-3 rounded hover:bg-green-700 transition-colors font-medium">
                Descargar todos los datos
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}