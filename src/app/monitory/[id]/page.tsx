// app/monitory/[id]/page.tsx
"use client";

import { useState, useEffect, useRef  } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
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


// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1pt solid #E5E7EB',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    color: '#6B7280',
  },
  section: {
    marginBottom: 15,
  },
  chartContainer: {
    marginBottom: 15,
    border: '1pt solid #E5E7EB',
    padding: 10,
    borderRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
});

// Componente para el documento PDF
const ReportDocument = ({ station, climateHistoricalData, indicatorsData, startDate, endDate }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.title}>Monitoreo</Text>
        <Text style={styles.subtitle}>Estación {station?.name || "Desconocida"}</Text>
        
        <Text style={styles.text}>
          Ubicación: {station?.country_name || "N/A"}, {station?.admin1_name || "N/A"}, {station?.admin2_name || "N/A"}
        </Text>
        <Text style={styles.text}>
          Latitud: {station?.latitude?.toFixed(6) || "N/A"}, Longitud: {station?.longitude?.toFixed(6) || "N/A"}
        </Text>
        <Text style={styles.text}>Fuente: {station?.source || "N/A"}</Text>
        <Text style={styles.text}>
          Período de datos: {startDate} - {endDate}
        </Text>
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.text}>
          La estación meteorológica {station?.name || "Desconocida"} está ubicada en{" "}
          {station?.admin2_name || "N/A"}, {station?.country_name || "N/A"} en la latitud{" "}
          {station?.latitude?.toFixed(4) || "N/A"} y longitud{" "}
          {station?.longitude?.toFixed(4) || "N/A"}, ha registrado datos desde el{" "}
          {startDate} hasta el {endDate}, cubriendo variables clave para el monitoreo agroclimático.
        </Text>
      </View>

      {/* Datos climáticos */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Datos Climáticos</Text>
        
        {climateHistoricalData && Object.entries(climateHistoricalData).map(([key, data]) => (
          <View key={key} style={styles.chartContainer}>
            <Text style={styles.chartTitle}>
              {key === 'Tmax' ? 'Temperatura máxima' : 
               key === 'Tmin' ? 'Temperatura mínima' : 
               key === 'Prec' ? 'Precipitación' : 
               key === 'Rad' ? 'Radiación solar' : key} 
              ({key === 'Tmax' || key === 'Tmin' ? '°C' : key === 'Prec' ? 'mm' : 'MJ/m²'})
            </Text>
            
            {/* Tabla de datos */}
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>Fecha</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>Valor</Text></View>
              </View>
              
              {data.dates.map((date, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{date}</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{data.values[index]}</Text></View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Indicadores climáticos */}
      {indicatorsData && Object.keys(indicatorsData).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Indicadores Climáticos</Text>
          
          {Object.entries(indicatorsData).map(([key, indicator]) => (
            <View key={key} style={styles.chartContainer}>
              <Text style={styles.chartTitle}>
                {indicator.name} ({indicator.unit})
              </Text>
              
              {/* Tabla de datos */}
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>Fecha</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>Valor</Text></View>
                </View>
                
                {indicator.dates.map((date, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{date}</Text></View>
                    <View style={styles.tableCol}><Text style={styles.tableCell}>{indicator.values[index]}</Text></View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);


export default function StationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [isClimaticOpen, setIsClimaticOpen] = useState(true);
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(true);
  const [timePeriod, setTimePeriod] = useState<string>("daily");
  const [timePeriodIndicators, setTimePeriodIndicators] = useState<string>("monthly");
  
  // Estados independientes para cada acordeón
  const [filterDatesClimatic, setFilterDatesClimatic] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [filterDatesIndicators, setFilterDatesIndicators] = useState<{ start: string; end: string }>({ start: "", end: "" });

  const [station, setStation] = useState<Station | null>(null);
  const [stationDates, setStationDates] = useState<any>(null);
  const [DataClimaticDates, setDataClimaticDates] = useState<any>(null);
  const [IndicatorsDates, setIndicatorsDates] = useState<any>(null);
  const [climateHistoricalData, setClimateHistoricalData] = useState<any>(null);
  const [indicatorsData, setIndicatorsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
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
    if (!date) return "2000-01";
    const [year, month] = date.split('-');
    return `2000-${month}`;
  };

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
        const dates = await monitoryService.getStationDates(id, timePeriod, false);
        setDataClimaticDates(dates);
        const datesIndicators = await monitoryService.getStationDates(id, timePeriodIndicators, true);
        setIndicatorsDates(datesIndicators);

        // Obtener la fecha mínima y máxima entre ambos objetos
        const minDate = new Date(dates.minDate) < new Date(datesIndicators.minDate) ? dates.minDate : datesIndicators.minDate;
        const maxDate = new Date(dates.maxDate) > new Date(datesIndicators.maxDate) ? dates.maxDate : datesIndicators.maxDate;

        setStationDates({ minDate, maxDate });
        // Inicializar filtros para datos climáticos
        if (timePeriod === "climatology") {
          setFilterDatesClimatic({ 
            start: dateToMonthFormat(dates.minDate || "2000-01"), 
            end: dateToMonthFormat("2000-12") 
          });
        } else {
          setFilterDatesClimatic({ 
            start: dates.minDate || "", 
            end: dates.maxDate || "" 
          });
        }
        
        // Inicializar filtros para indicadores
        setFilterDatesIndicators({ 
          start: datesIndicators.minDate || "", 
          end: datesIndicators.maxDate || "" 
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading station data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStation();
    }
  }, [id]);

    useEffect(() => {
    const fetchData = async () => {
      try {
        const dates = await monitoryService.getStationDates(id, timePeriod, false);
        setDataClimaticDates(dates);
        const datesIndicators = await monitoryService.getStationDates(id, timePeriodIndicators, true);
        setIndicatorsDates(datesIndicators);

        // Inicializar filtros para datos climáticos
        if (timePeriod === "climatology") {
          setFilterDatesClimatic({ 
            start: dateToMonthFormat(dates.minDate || "2000-01"), 
            end: dateToMonthFormat("2000-12") 
          });
        } else {
          setFilterDatesClimatic({ 
            start: dates.minDate || "", 
            end: dates.maxDate || "" 
          });
        }
        
        // Inicializar filtros para indicadores
        setFilterDatesIndicators({ 
          start: datesIndicators.minDate || "", 
          end: datesIndicators.maxDate || "" 
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading charts data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, timePeriod, timePeriodIndicators]);

  // Efecto para actualizar filtros cuando cambia timePeriod
  useEffect(() => {
    // Limpiar datos anteriores y mostrar carga
    setClimateHistoricalData(null);
    setLoadingCharts(true);
    
    if (timePeriod === "climatology") {
      setFilterDatesClimatic({ 
        start: "2000-01", 
        end: "2000-12" 
      });
    } else if (DataClimaticDates) {
      setFilterDatesClimatic({ 
        start: DataClimaticDates.minDate || "", 
        end: DataClimaticDates.maxDate || "" 
      });
    }
  }, [timePeriod, DataClimaticDates]);

  // Efecto para cargar datos climáticos cuando cambian los filtros
  useEffect(() => {
    const fetchClimateData = async () => {
      try {
        if (!filterDatesClimatic.start || !filterDatesClimatic.end) return;
        
        setLoadingCharts(true);
        const climateHistorical = await monitoryService.getClimateHistorical(
          id, 
          timePeriod, 
          filterDatesClimatic.start, 
          filterDatesClimatic.end
        );
        setClimateHistoricalData(climateHistorical);
      } catch (err) {
        console.error("Error loading climate data:", err);
        setClimateHistoricalData(null);
      } finally {
        setLoadingCharts(false);
      }
    };

    // Agregar un pequeño delay para evitar parpadeo
    const timeoutId = setTimeout(fetchClimateData, 100);
    return () => clearTimeout(timeoutId);
  }, [timePeriod, filterDatesClimatic]);

  // Efecto para cargar datos de indicadores cuando cambian los filtros
  useEffect(() => {
    const fetchIndicatorsData = async () => {
      try {
        if (!filterDatesIndicators.start || !filterDatesIndicators.end) return;
        
        const indicators = await monitoryService.getIndicatorsHistorical(
          id,
          timePeriodIndicators,
          filterDatesIndicators.start,
          filterDatesIndicators.end
        );
        setIndicatorsData(indicators);
      } catch (err) {
        console.error("Error loading indicators data:", err);
        setIndicatorsData(null);
      }
    };

    fetchIndicatorsData();
  }, [timePeriodIndicators, filterDatesIndicators]);

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
  const startDate = stationDates?.minDate;
  const endDate = stationDates?.maxDate;

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
        <header className="bg-white shadow-sm max-w-6xl mx-auto p-6" >
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Monitoreo</h1>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">
              Estación {station?.name || "Desconocida"}
            </h2>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-500 text-sm">
              Ubicación: {station?.country_name || "N/A"},{" "}
              {station?.admin1_name || "N/A"}, {station?.admin2_name || "N/A"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Latitud: {station?.latitude?.toFixed(6) || "N/A"}, Longitud: {station?.longitude?.toFixed(6) || "N/A"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Fuente: {station?.source || "N/A"}
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
              {/* Acordeones para selección de tipo de datos */}
              <div id="accordion-collapse" data-accordion="collapse">
                {/* Acordeón para Datos climáticos */}
                <div id="climatic-accordion">
                  <h2 id="climatic-accordion-trigger">
                    <button
                      type="button"
                      className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-gray-200 hover:bg-gray-100"
                      onClick={() => setIsClimaticOpen(!isClimaticOpen)}
                      aria-expanded={isClimaticOpen}
                    >
                      <span className="text-xl font-semibold text-gray-800">Datos climáticos</span>
                      <svg
                        className={`w-6 h-6 shrink-0 ${isClimaticOpen ? 'rotate-180' : ''}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </h2>
                  <div
                    id="climatic-accordion-content"
                    className={isClimaticOpen ? '' : 'hidden'}
                    aria-labelledby="climatic-accordion-trigger"
                  >
                    <div className="p-5 border border-b-0 border-gray-200">
                      {/* Selector de período de tiempo para datos climáticos */}
                      <div className="flex flex-wrap items-center gap-6 mb-6 border-b border-gray-200 pb-4 justify-between">
                        <p>Explora cómo han variado las principales variables del clima en esta estación. Visualiza la evolución de la 
                            <strong> temperatura</strong>, la <strong>precipitación</strong> y la <strong>radiación solar</strong>. 
                            Utiliza los filtros de fecha para ajustar la información a tu interés.</p>
                        <div className="flex items-center gap-6">
                          {/* Selector de período */}
                          <div>
                            <label htmlFor="period-climatic" className="block text-xs font-medium text-gray-700 mb-1">
                              Período
                            </label>
                            <select
                              id="period-climatic"
                              value={timePeriod}
                              onChange={(e) => setTimePeriod(e.target.value)}
                              className="px-4 py-2 text-gray-900 bg-transparent focus:outline-none"
                            >
                              <option value="daily">Diario</option>
                              <option value="monthly">Mensual</option>
                              <option value="climatology">Climatología</option>
                            </select>
                          </div>
                        </div>

                        {/* Selector de fechas alineado a la derecha */}
                        <div className="flex gap-4">
                          {timePeriod === "climatology" ? (
                            <>
                              <div>
                                <label htmlFor="start-month" className="block text-xs font-medium text-gray-700 mb-1">
                                  Mes inicial
                                </label>
                                <select
                                  id="start-month"
                                  value={filterDatesClimatic.start.split('-')[1]}
                                  onChange={(e) => setFilterDatesClimatic(prev => ({
                                    ...prev, 
                                    start: monthToDateFormat(e.target.value)
                                  }))}
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                                >
                                  {MONTHS.map(month => (
                                    <option key={month.value} value={month.value}>
                                      {month.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label htmlFor="end-month" className="block text-xs font-medium text-gray-700 mb-1">
                                  Mes final
                                </label>
                                <select
                                  id="end-month"
                                  value={filterDatesClimatic.end.split('-')[1]}
                                  onChange={(e) => setFilterDatesClimatic(prev => ({
                                    ...prev, 
                                    end: monthToDateFormat(e.target.value)
                                  }))}
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                                >
                                  {MONTHS.map(month => (
                                    <option key={month.value} value={month.value}>
                                      {month.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label htmlFor="start-date" className="block text-xs font-medium text-gray-700 mb-1">
                                  Fecha inicial
                                </label>
                                <input
                                  type="date"
                                  id="start-date"
                                  value={filterDatesClimatic.start || ""}
                                  min={stationDates?.minDate || ""}
                                  max={stationDates?.maxDate || ""}
                                  onChange={(e) => setFilterDatesClimatic(prev => ({ ...prev, start: e.target.value }))}
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                                />
                              </div>
                              <div>
                                <label htmlFor="end-date" className="block text-xs font-medium text-gray-700 mb-1">
                                  Fecha final
                                </label>
                                <input
                                  type="date"
                                  id="end-date"
                                  value={filterDatesClimatic.end}
                                  min={filterDatesClimatic.start || stationDates?.minDate || ""}
                                  max={stationDates?.maxDate || ""}
                                  onChange={(e) => setFilterDatesClimatic(prev => ({ ...prev, end: e.target.value }))}
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Gráficas de datos climáticos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {loadingCharts ? (
                        // Mostrar esqueletos de carga
                        Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 h-80 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                          </div>
                        ))
                      ) : (
                        <>
                        <ClimateChart 
                          title="Temperatura máxima" 
                          unit="°C"
                          datasets={[
                            { 
                              label: "Temperatura", 
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
                              label: "Precipitación", 
                              color: "#2196F3",
                              data: climateHistoricalData?.Prec?.values || [],
                              dates: climateHistoricalData?.Prec?.dates || []
                            }
                          ]}
                          period={timePeriod}
                          chartType="bar"
                        />
                        <ClimateChart 
                          title="Temperatura mínima" 
                          unit="°C"
                          datasets={[
                            { 
                              label: "Temperatura", 
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
                              label: "Radiación solar", 
                              color: "#F44336",
                              data: climateHistoricalData?.Rad?.values || [],
                              dates: climateHistoricalData?.Rad?.dates || []
                            }
                          ]}
                          period={timePeriod}
                        />
                        </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acordeón para Indicadores climáticos */}
                <div id="indicators-accordion">
                  <h2 id="indicators-accordion-trigger">
                    <button
                      type="button"
                      className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 hover:bg-gray-100"
                      onClick={() => setIsIndicatorsOpen(!isIndicatorsOpen)}
                      aria-expanded={isIndicatorsOpen}
                    >
                      <span className="text-xl font-semibold text-gray-800">Indicadores climáticos</span>
                      <svg
                        className={`w-6 h-6 shrink-0 ${isIndicatorsOpen ? 'rotate-180' : ''}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </h2>
                  <div
                    id="indicators-accordion-content"
                    className={isIndicatorsOpen ? '' : 'hidden'}
                    aria-labelledby="indicators-accordion-trigger"
                  >
                    <div className="p-5 border border-t-0 border-gray-200">
                      {/* Selector de período de tiempo para indicadores */}
                      <div className="flex flex-wrap items-center gap-6 mb-6 border-b border-gray-200 pb-4 justify-between">
                        <p>Consulta la evolución de los <strong>indicadores climáticos</strong> de esta estación y descubre patrones relevantes. 
                          Filtra fácilmente por <strong>categoría</strong> y <strong>rango de fechas</strong> para personalizar tu análisis.</p>
                        <div className="flex items-center gap-6">
                          {/* Selector de período */}
                          <div>
                            <label htmlFor="period-indicators" className="block text-xs font-medium text-gray-700 mb-1">
                              Período
                            </label>
                            <select
                              id="period-indicators"
                              value={timePeriodIndicators}
                              onChange={(e) => setTimePeriodIndicators(e.target.value)}
                              className="px-4 py-2 text-gray-900 bg-transparent focus:outline-none"
                            >
                              {indicatorPeriodOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Selector de fechas alineado a la derecha */}
                        <div className="flex gap-4">
                          <div>
                            <label htmlFor="start-date-indicators" className="block text-xs font-medium text-gray-700 mb-1">
                              Fecha inicial
                            </label>
                            <input
                              type="date"
                              id="start-date-indicators"
                              value={filterDatesIndicators.start}
                              min={stationDates?.minDate || ""}
                              max={stationDates?.maxDate || ""}
                              onChange={(e) => setFilterDatesIndicators(prev => ({ ...prev, start: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="end-date-indicators" className="block text-xs font-medium text-gray-700 mb-1">
                              Fecha final
                            </label>
                            <input
                              type="date"
                              id="end-date-indicators"
                              value={filterDatesIndicators.end}
                              min={filterDatesIndicators.start || stationDates?.minDate || ""}
                              max={stationDates?.maxDate || ""}
                              onChange={(e) => setFilterDatesIndicators(prev => ({ ...prev, end: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Gráficas de indicadores climáticos */}
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
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </main>

      
              {/* Botón de descarga */}
              <div className="max-w-6xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-sm p-6 mt-4 flex justify-center">
                  <PDFDownloadLink
                    document={
                      <ReportDocument 
                        station={station}
                        climateHistoricalData={climateHistoricalData}
                        indicatorsData={indicatorsData}
                        startDate={startDate}
                        endDate={endDate}
                      />
                    }
                    fileName={`reporte_estacion_${station?.name || "desconocida"}.pdf`}
                    className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {({ blob, url, loading, error }) =>
                      loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                          ...
                        </>
                      ) : (
                        "Descargar datos de gráficas (PDF)"
                      )
                    }
                  </PDFDownloadLink>
                </div>
              </div>
    </div>
  );
}