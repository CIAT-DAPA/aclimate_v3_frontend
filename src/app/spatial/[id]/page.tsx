// page.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { COUNTRY_NAME, GEOSERVER_URL } from "@/app/config";
import { useCountry } from "@/app/contexts/CountryContext";
import { spatialService, IndicatorCategory, Indicator } from "@/app/services/spatialService";

// Cargar el mapa dinámicamente sin SSR
const MapComponent = dynamic(() => import("@/app/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
    </div>
  ),
});

interface RasterFileInfo {
  url: string;
  layer: string;
  time: string;
  title: string;
}

interface LayerInfo {
  name: string;
  title: string;
  variable: string;
  available: boolean;
}

// Información de tooltip para cada variable climática
const variableInfo: Record<string, string> = {
  "Temperatura máxima": "La temperatura máxima representa el valor más alto de temperatura del aire en un día, medido en grados Celsius (°C).",
  "Precipitación": "La precipitación es la cantidad total de agua que cae sobre la superficie, medida en milímetros (mm). Incluye lluvia, nieve, granizo, etc.",
  "Temperatura mínima": "La temperatura mínima representa el valor más bajo de temperatura del aire en un día, medido en grados Celsius (°C).",
  "Radiación solar": "La radiación solar es la cantidad de energía radiante recibida del sol por unidad de área, medida en megajulios por metro cuadrado (MJ/m²).",
  "Evapotranspiración": "La evapotranspiración es la pérdida de agua del suelo por evaporación y transpiración de las plantas, medida en milímetros (mm)."
};

// Mapeo de códigos de país a códigos usados en geoserver
const countryCodeMap: Record<string, string> = {
  "1": "co", // Colombia
  "2": "hn"  // Honduras
};

// Opciones de período para indicadores
const indicatorPeriodOptions = [
  { value: "daily", label: "Diario" },
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
  { value: "seasonal", label: "Estacional" },
  { value: "decadal", label: "Decadal" },
  { value: "other", label: "Otro" },
];

export default function SpatialDataPage() {
  const { countryId } = useCountry();
  const [isClimaticOpen, setIsClimaticOpen] = useState(true);
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(true);
  const rasterFilesRef = useRef<Record<string, RasterFileInfo>>({});
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  
  // Estados para datos climáticos
  const [timePeriod, setTimePeriod] = useState<string>("daily");
  const [availableLayers, setAvailableLayers] = useState<LayerInfo[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(false);

  // Estados para indicadores
  const [indicatorPeriod, setIndicatorPeriod] = useState<string>("annual");
  const [indicatorCategories, setIndicatorCategories] = useState<IndicatorCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategory | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);

  //const countryId = "2";
  const countryCode = countryCodeMap[countryId || "2"] || "hn";

  
  // Construir workspace y WMS URL dinámicamente
  const workspace = `climate_historical_${timePeriod}`;
  const wmsBaseUrl = `${GEOSERVER_URL}/${workspace}/wms`;

  // Coordenadas por país
  const countryCoordinates: Record<string, { center: [number, number]; zoom: number; bbox: string }> = {
    "hn": {
      center: [14.5, -86.5],
      zoom: 7,
      bbox: "-89.5,12.9,-83.1,16.5"
    },
    "co": {
      center: [4.5, -74.0],
      zoom: 6,
      bbox: "-79.0,-4.2,-66.9,12.5"
    }
  };

  const currentCountry = countryCoordinates[countryCode] || countryCoordinates["hn"];

  // Inicializar tooltips de Flowbite
  useEffect(() => {
    const initFlowbite = async () => {
      const { initTooltips } = await import('flowbite');
      initTooltips();
    };
    
    initFlowbite();
  }, [availableLayers, selectedCategory]);

  // Cargar capas disponibles cuando cambia el período de tiempo
  useEffect(() => {
    const loadLayers = async () => {
      setLoadingLayers(true);
      try {
        const layers = await spatialService.getAvailableLayers(
          GEOSERVER_URL,
          workspace,
          countryCode,
          timePeriod
        );
        setAvailableLayers(layers);
      } catch (error) {
        console.error("Error cargando capas:", error);
        setAvailableLayers([]);
      } finally {
        setLoadingLayers(false);
      }
    };

    loadLayers();
  }, [timePeriod, workspace, countryCode]);

  // Cargar categorías de indicadores
  useEffect(() => {
    const loadCategories = async () => {
      if (!countryId) return;
      
      setLoadingCategories(true);
      try {
        const categories = await spatialService.getIndicatorCategories(countryId);
        setIndicatorCategories(categories);
        // Seleccionar la primera categoría por defecto
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
      } catch (error) {
        console.error("Error cargando categorías:", error);
        setIndicatorCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [countryId]);

  // Cargar indicadores cuando cambia la categoría o el período
  useEffect(() => {
    const loadIndicators = async () => {
      if (!countryId || !selectedCategory) return;
      
      setLoadingIndicators(true);
      try {
        const indicatorsList = await spatialService.getIndicators(
          countryId,
          indicatorPeriod,
          selectedCategory.id
        );
        setIndicators(indicatorsList);
      } catch (error) {
        console.error("Error cargando indicadores:", error);
        setIndicators([]);
      } finally {
        setLoadingIndicators(false);
      }
    };

    loadIndicators();
  }, [countryId, indicatorPeriod, selectedCategory]);

  const handleTimeChange = useCallback((time: string, layerName: string, layerTitle: string) => {
    const bbox = currentCountry.bbox;
    
    // Crear URL para la capa específica
    const url = `${wmsBaseUrl}?service=WMS&request=GetMap&version=1.3.0&layers=${layerName}&styles=&format=image/tiff&transparent=true&time=${time}&bbox=${bbox}&width=512&height=512&crs=EPSG:4326`;
    
    // Actualizar la referencia sin causar rerender
    rasterFilesRef.current[layerName] = { url, layer: layerName, time, title: layerTitle };
    setDownloadReady(Object.keys(rasterFilesRef.current).length > 0);
  }, [wmsBaseUrl, currentCountry.bbox]);

  // Función para descargar todos los archivos
  const downloadAllData = async () => {
    const files = Object.values(rasterFilesRef.current);
    
    if (files.length === 0) {
      alert("No hay datos para descargar. Por favor, selecciona un tiempo para al menos una capa primero.");
      return;
    }

    setDownloadProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        const link = document.createElement('a');
        link.href = fileInfo.url;
        link.download = `${fileInfo.title.replace(/\s+/g, '_')}_${fileInfo.time}.tiff`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Actualizar progreso
        setDownloadProgress(Math.round(((i + 1) / files.length) * 100));
        
        // Pequeña pausa entre descargas para evitar sobrecargar el navegador
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Resetear progreso después de 2 segundos
      setTimeout(() => setDownloadProgress(0), 2000);
    } catch (error) {
      console.error("Error descargando archivos:", error);
      alert("Ocurrió un error al descargar los archivos. Por favor, intenta nuevamente.");
      setDownloadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-4">
      <header className="bg-white rounded-lg shadow-sm max-w-6xl mx-auto p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">Datos espaciales</h1>
          <p className="text-gray-600 mt-2">
            Esta herramienta interactiva te permite consultar información histórica sobre indicadores climáticos en {COUNTRY_NAME}.
          </p>
          <div className="mt-3">
            <p className="text-gray-600">Puedes usarla para:</p>
            <ul className="list-disc list-inside text-gray-600 mt-1 ms-3">
              <li>Ver cómo varían estos indicadores en diferentes regiones</li>
              <li>Identificar zonas agrícolas con mayor riesgo climático</li>
              <li>Descargar datos raster para análisis especializados</li>
            </ul>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-4">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Reemplazo de tabs por acordeones */}
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
                  <div className="flex flex-col gap-8">
                    <div>
                      <p>Explora cómo se comportan las principales variables climáticas en todo el territorio de {COUNTRY_NAME}. Observa la distribución y evolución de la <strong>temperatura</strong>, la <strong>precipitación</strong> y la <strong>radiación solar</strong>. 
                      Ajusta la visualización con los filtros de fecha para obtener la información que necesites.</p>
                      
                      {/* Selector de período de tiempo para datos climáticos */}
                      <div className="mt-4">
                        <label htmlFor="timePeriod" className="block font-medium text-gray-700 mb-2">
                          Período de tiempo
                        </label>
                        <select
                          id="timePeriod"
                          value={timePeriod}
                          onChange={(e) => setTimePeriod(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                        >
                          <option value="daily">Diario</option>
                          <option value="monthly">Mensual</option>
                          <option value="climatology">Climatología</option>
                        </select>
                      </div>
                    </div>
                    
                    {loadingLayers ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                        <span className="ml-3 text-gray-600">Cargando capas disponibles...</span>
                      </div>
                    ) : availableLayers.length === 0 ? (
                      <div className="text-center py-12 text-gray-600">
                        No hay capas disponibles para el período seleccionado.
                      </div>
                    ) : (
                      availableLayers.map((layer) => {
                        let unidad = "";
                        if (layer.variable === "tmax" || layer.variable === "tmin") {
                          unidad = "°C";
                        } else if (layer.variable === "prec") {
                          unidad = "mm";
                        } else if (layer.variable === "rad") {
                          unidad = "MJ/m²";
                        } else if (layer.variable === "et0") {
                          unidad = "mm";
                        }

                        const tooltipId = `tooltip-${layer.variable}`;

                        return (
                          <div key={layer.name} className="h-[600px] flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                              
                              <h3 className="font-semibold text-gray-800 text-lg">
                                {layer.title} <span className="text-gray-500 text-base">({unidad})</span>
                              </h3>
                              
                              {/* Botón con tooltip */}
                              <button 
                                data-tooltip-target={tooltipId}
                                data-tooltip-placement="right"
                                type="button" 
                                className="text-gray-400 hover:text-gray-600 transition-colors focus:ring-0 focus:outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              
                              {/* Tooltip */}
                              <div 
                                id={tooltipId} 
                                role="tooltip" 
                                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip"
                              >
                                {variableInfo[layer.title]}
                                <div className="tooltip-arrow" data-popper-arrow></div>
                              </div>

                              {/* Badge de no disponible */}
                              {!layer.available && (
                                <span className="ml-auto px-3 py-1 text-xs font-medium text-amber-800 bg-amber-100 rounded-full">
                                  Datos no disponibles
                                </span>
                              )}
                            </div>

                            {layer.available ? (
                              <div className="h-[550px] w-full rounded-lg overflow-hidden">
                                <MapComponent
                                  key={layer.name}
                                  center={currentCountry.center}
                                  zoom={currentCountry.zoom}
                                  wmsLayers={[{
                                    url: wmsBaseUrl,
                                    layers: layer.name,
                                    opacity: 0.7,
                                    transparent: true,
                                    title: layer.title,
                                    unit: unidad
                                  }]}
                                  showMarkers={false}
                                  showZoomControl={true}
                                  showTimeline={true}
                                  showLegend={true}
                                  showAdminLayer={true}
                                  onTimeChange={(time) => handleTimeChange(time, layer.name, layer.title)}
                                />
                              </div>
                            ) : (
                              <div className="h-[550px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
                                <div className="text-center">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                  </svg>
                                  <p className="mt-2 text-gray-500">No hay datos disponibles para esta variable</p>
                                  <p className="text-sm text-gray-400">en el período {timePeriod}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
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
                  <div className="flex flex-col gap-4">
                    <div>
                      <p>Analiza la evolución de los indicadores climáticos en {COUNTRY_NAME} y detecta tendencias clave. Filtra por <strong>categoría</strong> y <strong>temporalidad</strong> para profundizar en los datos que más te interesen.</p>
                    </div>

                    {/* Selectores de temporalidad y categoría en la misma fila */}
                    <div className="flex gap-4 items-end">
                      {/* Selector de temporalidad */}
                      <div>
                        <label htmlFor="indicatorPeriod" className="block font-medium text-gray-700 mb-2">
                          Temporalidad
                        </label>
                        <select
                          id="indicatorPeriod"
                          value={indicatorPeriod}
                          onChange={(e) => setIndicatorPeriod(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                        >
                          {indicatorPeriodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selector de categoría */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label htmlFor="indicatorCategory" className="font-medium text-gray-700">
                            Categoría
                          </label>
                          {selectedCategory && (
                            <button
                              data-tooltip-target="category-tooltip"
                              data-tooltip-placement="right"
                              type="button"
                              className="text-gray-400 hover:text-gray-600 transition-colors focus:ring-0 focus:outline-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {loadingCategories ? (
                          <div className="text-gray-500">Cargando categorías...</div>
                        ) : indicatorCategories.length === 0 ? (
                          <div className="text-gray-500">No hay categorías disponibles</div>
                        ) : (
                          <>
                            <select
                              id="indicatorCategory"
                              value={selectedCategory?.id || ''}
                              onChange={(e) => {
                                const category = indicatorCategories.find(cat => cat.id === parseInt(e.target.value));
                                setSelectedCategory(category || null);
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                            >
                              {indicatorCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                            {selectedCategory && (
                              <div
                                id="category-tooltip"
                                role="tooltip"
                                className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip max-w-xs"
                              >
                                {selectedCategory.description}
                                <div className="tooltip-arrow" data-popper-arrow></div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mapas de indicadores */}
                    {loadingIndicators ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                        <span className="ml-3 text-gray-600">Cargando indicadores...</span>
                      </div>
                    ) : indicators.length === 0 ? (
                      <div className="text-center py-12 text-gray-600">
                        No hay datos disponibles para esta combinación de temporalidad y categoría
                      </div>
                    ) : (
                      <div className="flex flex-col gap-8">
                        {indicators.map((indicator) => {
                          const layerName = `climate_index:climate_index_${indicatorPeriod}_${countryCode}_${indicator.short_name}`;
                          const indicatorWmsUrl = `${GEOSERVER_URL}/climate_index/wms`;
                          
                          return (
                            <div key={indicator.id}>
                              <h3 className="font-semibold text-gray-700 mb-2">{indicator.name}</h3>
                              <div className="h-[550px] w-full rounded-lg overflow-hidden">
                                <MapComponent
                                  center={currentCountry.center}
                                  zoom={currentCountry.zoom}
                                  wmsLayers={[{
                                    url: indicatorWmsUrl,
                                    layers: layerName,
                                    opacity: 0.7,
                                    transparent: true,
                                    title: indicator.name,
                                    unit: indicator.unit
                                  }]}
                                  showMarkers={false}
                                  showZoomControl={true}
                                  showTimeline={true}
                                  showLegend={true}
                                  showAdminLayer={true}
                                  onTimeChange={(time) => handleTimeChange(time, layerName, indicator.name)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex flex-col items-start gap-4">
            <button 
              className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              onClick={downloadAllData}
              disabled={!downloadReady}
            >
              {downloadProgress > 0 ? `Descargando... ${downloadProgress}%` : "Descargar todos los datos raster"}
            </button>
            
            {downloadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}