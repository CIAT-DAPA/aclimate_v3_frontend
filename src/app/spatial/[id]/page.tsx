// page.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { COUNTRY_NAME, GEOSERVER_URL } from "@/app/config";
import { useCountry } from "@/app/contexts/CountryContext";
import { spatialService, IndicatorCategory, Indicator } from "@/app/services/spatialService";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown } from '@fortawesome/free-solid-svg-icons';

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

// Descripciones detalladas para cada variable climática
const variableDescriptions: Record<string, string> = {
  "Precipitación": "Este mapa muestra la distribución de la lluvia en el territorio para la fecha seleccionada. Navega por las zonas coloreadas para conocer los niveles de precipitación y usa la línea de tiempo para explorar otros días.",
  "Temperatura máxima": "Consulta cómo se comporta la temperatura máxima en distintas regiones del país. Desplázate por el mapa para ver los valores en cada zona y ajusta la fecha para comparar cambios a lo largo del tiempo.",
  "Temperatura mínima": "Consulta cómo desciende la temperatura en distintas zonas del país durante la fecha seleccionada. Usa el mapa para identificar áreas con noches más frías y compara cambios moviéndote a otras fechas.",
  "Radiación solar": "Este mapa muestra la cantidad de energía solar que recibe cada región. Explora los colores para reconocer zonas con mayor o menor radiación y ajusta la fecha para ver cómo varía a lo largo del tiempo.",
  "Evapotranspiración": "Observa cuánto vapor de agua se pierde del suelo y la vegetación en cada área. Recorre el mapa para identificar zonas con mayor demanda hídrica y usa la línea de tiempo para analizar patrones diarios."
};

// Descripciones para indicadores climáticos específicos
const indicatorDescriptions: Record<string, string> = {
  "Annual maximum of daily maximum temperature": "Este mapa muestra el valor más alto de temperatura máxima registrado en cada zona durante el año. Recorre las áreas coloreadas para identificar regiones más cálidas y compara distintos años usando la fecha.",
  "Tropical nights": "Consulta cuántas noches del año registran temperaturas elevadas en cada región. Usa el mapa para identificar zonas donde las noches cálidas son más frecuentes y ajusta la fecha para analizar su evolución en el tiempo."
};

// Mapeo de códigos de país a códigos usados en geoserver
const countryCodeMap: Record<string, string> = {
  "1": "co", // Colombia
  "2": "hn",  // Honduras
  "3": "st",  // SAT AMAZONIA
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
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  
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

  // Estados para capas administrativas dinámicas
  const [adminLayers, setAdminLayers] = useState<Array<{name: string, workspace: string, store: string, layer: string}>>([]);
  const [loadingAdminLayers, setLoadingAdminLayers] = useState(false);

  //const countryId = "2";
  const countryCode = countryCodeMap[countryId || "2"] || "hn";

  
  // Construir workspace y WMS URL dinámicamente
  const workspace = `climate_historical_${timePeriod}`;
  const wmsBaseUrl = `${GEOSERVER_URL}/${workspace}/wms`;

  // Coordenadas por país
  const countryCoordinates: Record<string, { center: [number, number]; zoom: number; bbox: string; bboxWMS13: string }> = {
    "hn": {
      center: [14.5, -86.5],
      zoom: 7,
      bbox: "-89.5,12.9,-83.1,16.5", // WMS 1.1.0 format: minx,miny,maxx,maxy
      bboxWMS13: "12.9,-89.5,16.5,-83.1" // WMS 1.3.0 EPSG:4326 format: miny,minx,maxy,maxx
    },
    "co": {
      center: [4.5, -74.0],
      zoom: 6,
      bbox: "-79.0,-4.2,-66.9,12.5",
      bboxWMS13: "-4.2,-79.0,12.5,-66.9"
    },
    "st": {
      center: [-1.25, -71.25],
      zoom: 6,
      bbox: "-76.0,-5.5,-66.5,3.0",
      bboxWMS13: "-5.5,-76.0,3.0,-66.5"
    }
  };

  const currentCountry = countryCoordinates[countryCode] || countryCoordinates["hn"];

  // Cargar capas administrativas dinámicamente
  useEffect(() => {
    const loadAdminLayers = async () => {
      setLoadingAdminLayers(true);
      try {
        const layers = await spatialService.getAdminLayers(GEOSERVER_URL, countryCode);
        setAdminLayers(layers);
      } catch (error) {
        console.error("Error cargando capas administrativas:", error);
        setAdminLayers([]);
      } finally {
        setLoadingAdminLayers(false);
      }
    };

    loadAdminLayers();
  }, [countryCode]);

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

  // Habilitar botón de descarga solo cuando hay capas disponibles
  useEffect(() => {
    const hasAvailableLayers = availableLayers.some(layer => layer.available);
    const hasIndicators = indicators.length > 0;
    setDownloadReady(hasAvailableLayers || hasIndicators);
  }, [availableLayers, indicators]);

  const handleTimeChange = useCallback((time: string, layerName: string, layerTitle: string) => {
    const bbox = currentCountry.bboxWMS13;
    
    // Extraer el workspace del layerName (ej: "climate_index:climate_index_annual_hn_TXx")
    const workspace = layerName.split(':')[0];
    const wmsUrl = `${GEOSERVER_URL}/${workspace}/wms`;
    
    // Crear URL para la capa específica usando formato GeoTIFF
    const url = `${wmsUrl}?service=WMS&request=GetMap&version=1.3.0&layers=${layerName}&styles=&format=image/geotiff&time=${time}&bbox=${bbox}&width=1024&height=1024&crs=EPSG:4326`;
    
    // Actualizar la referencia sin causar rerender
    rasterFilesRef.current[layerName] = { url, layer: layerName, time, title: layerTitle };
    setDownloadReady(Object.keys(rasterFilesRef.current).length > 0);
  }, [currentCountry.bboxWMS13]);

  // Función para obtener el archivo raster actual de una capa (usada por los botones individuales)
  const getCurrentRasterFile = useCallback(async (layerName: string, layerTitle: string, wmsUrl: string) => {
    try {
      // Si ya existe en la referencia, devolverlo
      if (rasterFilesRef.current[layerName]) {
        return rasterFilesRef.current[layerName];
      }

      // Si no existe, obtener la primera fecha disponible de la capa
      const capabilitiesUrl = `${wmsUrl}?service=WMS&request=GetCapabilities&version=1.3.0`;
      
      const response = await fetch(capabilitiesUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      // Buscar la dimensión de tiempo para esta capa
      const layers = xmlDoc.getElementsByTagName('Layer');
      let timeValue = '';
      
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const nameElement = layer.getElementsByTagName('Name')[0];
        if (nameElement && nameElement.textContent === layerName) {
          const dimension = layer.getElementsByTagName('Dimension')[0];
          if (dimension && dimension.getAttribute('name') === 'time') {
            const times = dimension.textContent?.trim().split(',') || [];
            timeValue = times[times.length - 1] || ''; // Usar la última fecha disponible
          }
          break;
        }
      }

      if (timeValue) {
        const bbox = currentCountry.bboxWMS13;
        // Usar image/geotiff para obtener los valores reales del raster
        // WMS 1.3.0 con EPSG:4326 requiere orden: miny,minx,maxy,maxx (lat,lon,lat,lon)
        const url = `${wmsUrl}?service=WMS&request=GetMap&version=1.3.0&layers=${layerName}&styles=&format=image/geotiff&time=${timeValue}&bbox=${bbox}&width=1024&height=1024&crs=EPSG:4326`;
        const fileInfo = { url, layer: layerName, time: timeValue, title: layerTitle };
        rasterFilesRef.current[layerName] = fileInfo;
        return fileInfo;
      }
      
      return null;
    } catch (error) {
      console.error(`Error obteniendo tiempo de capa ${layerTitle}:`, error);
      return null;
    }
  }, [currentCountry.bboxWMS13]);

  // Función para descargar todos los archivos
  const downloadAllData = async () => {
    if (isPreparingDownload) return; // Evitar múltiples clics
    
    setIsPreparingDownload(true);
    setDownloadProgress(1);
    
    try {
      // Obtener todas las capas disponibles (clima + indicadores)
      const allLayers: Array<{name: string, title: string, wmsUrl: string}> = [];
      
      // Agregar capas climáticas disponibles
      availableLayers.forEach(layer => {
        if (layer.available) {
          allLayers.push({
            name: layer.name,
            title: layer.title,
            wmsUrl: wmsBaseUrl
          });
        }
      });
      
      // Agregar indicadores disponibles
      indicators.forEach(indicator => {
        const layerName = `climate_index:climate_index_${indicatorPeriod}_${countryCode}_${indicator.short_name}`;
        const indicatorWmsUrl = `${GEOSERVER_URL}/climate_index/wms`;
        allLayers.push({
          name: layerName,
          title: indicator.name,
          wmsUrl: indicatorWmsUrl
        });
      });

      if (allLayers.length === 0) {
        alert("No hay capas disponibles para descargar.");
        setDownloadProgress(0);
        setIsPreparingDownload(false);
        return;
      }

      // Obtener los archivos raster para cada capa
      const filesToDownload: RasterFileInfo[] = [];
      for (let i = 0; i < allLayers.length; i++) {
        const layer = allLayers[i];
        const fileInfo = await getCurrentRasterFile(layer.name, layer.title, layer.wmsUrl);
        if (fileInfo) {
          filesToDownload.push(fileInfo);
        }
        // Actualizar progreso de preparación (0-50%)
        setDownloadProgress(Math.round(((i + 1) / allLayers.length) * 50));
      }
      
      if (filesToDownload.length === 0) {
        alert("No se pudieron obtener los archivos para descargar.");
        setDownloadProgress(0);
        setIsPreparingDownload(false);
        return;
      }

      // Descargar todos los archivos usando fetch + blob para evitar bloqueos del navegador
      for (let i = 0; i < filesToDownload.length; i++) {
        const fileInfo = filesToDownload[i];
        
        try {
          // Usar fetch para descargar el archivo
          const response = await fetch(fileInfo.url);
          if (!response.ok) {
            console.error(`Failed to download ${fileInfo.title}: HTTP ${response.status}`);
            continue;
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileInfo.title.replace(/\s+/g, '_')}_${fileInfo.time}.tiff`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Liberar el objeto URL
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error) {
          console.error(`Error downloading ${fileInfo.title}:`, error);
        }
        
        // Actualizar progreso de descarga (50-100%)
        setDownloadProgress(50 + Math.round(((i + 1) / filesToDownload.length) * 50));
        
        // Pequeña pausa entre descargas para dar tiempo al navegador
        if (i < filesToDownload.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Resetear progreso después de 2 segundos
      setTimeout(() => {
        setDownloadProgress(0);
        setIsPreparingDownload(false);
      }, 2000);
    } catch (error) {
      console.error("Error descargando archivos:", error);
      alert("Ocurrió un error al descargar los archivos. Por favor, intenta nuevamente.");
      setDownloadProgress(0);
      setIsPreparingDownload(false);
    }
  };

  // Función para descargar un archivo raster individual
  const downloadRasterFile = (fileInfo: RasterFileInfo) => {
    try {
      const link = document.createElement('a');
      link.href = fileInfo.url;
      link.download = `${fileInfo.title.replace(/\s+/g, '_')}_${fileInfo.time}.tiff`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error descargando archivo:", error);
      alert("Ocurrió un error al descargar el archivo. Por favor, intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-4 px-2 sm:px-4 overflow-x-hidden">
      <header className="bg-white rounded-lg shadow-sm max-w-6xl mx-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Datos espaciales</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Explora datos e indicadores climáticos de {COUNTRY_NAME} y analiza cómo ha sido el cambio a través del tiempo. 
            Usa esta vista para identificar patrones, zonas vulnerables y descargar la información que necesites para tus análisis.
          </p>
          <div className="mt-3">
            <p className="text-sm sm:text-base text-gray-600">Puedes usarla para:</p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 mt-1 ms-3">
              <li>Ver cómo varían estos indicadores en diferentes regiones</li>
              <li>Identificar zonas agrícolas con mayor riesgo climático</li>
              <li>Descargar datos raster para análisis especializados</li>
            </ul>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-4 mb-24">
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
                      <p className="text-gray-600 mt-2">Esta sección reúne las principales variables climáticas del país en formato de mapas interactivos. 
                        Explora cada variable para entender cómo cambian las condiciones en el territorio y usa la fecha para comparar distintos momentos en el tiempo. </p>
                      
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
                          <div key={layer.name} className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              
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

                            {/* Descripción detallada de la variable */}
                            {variableDescriptions[layer.title] && (
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {variableDescriptions[layer.title]}
                              </p>
                            )}

                            {layer.available ? (
                              <div className="relative h-[550px] w-full max-w-full rounded-lg overflow-hidden">
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
                                  adminLayers={adminLayers}
                                  onTimeChange={(time) => handleTimeChange(time, layer.name, layer.title)}
                                />
                                {/* Botón de descarga dentro del mapa - posicionado debajo de zoom */}
                                <button
                                  onClick={async () => {
                                    let rasterFile = rasterFilesRef.current[layer.name];
                                    if (!rasterFile) {
                                      // Si no existe, obtener la fecha actual del mapa
                                      const result = await getCurrentRasterFile(layer.name, layer.title, wmsBaseUrl);
                                      if (result) {
                                        rasterFile = result;
                                      }
                                    }
                                    if (rasterFile) {
                                      downloadRasterFile(rasterFile);
                                    }
                                  }}
                                  className="absolute top-36 right-4 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg p-2 shadow-md transition-colors cursor-pointer z-[1000]"
                                  title="Descargar capa raster"
                                >
                                  <FontAwesomeIcon icon={faFileArrowDown} className="h-4 w-4" />
                                </button>
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
                      <p className="text-gray-600 mt-2">Explora patrones y extremos climáticos del país a lo largo del año. Selecciona la temporalidad y la categoría para visualizar los indicadores que mejor se ajusten a tu análisis.</p>
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
                            <div key={indicator.id} className="flex flex-col gap-3">
                              <div>
                                <h3 className="font-semibold text-gray-700 text-lg mb-2">{indicator.name}</h3>
                                {indicator.description && (
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {indicator.description}
                                  </p>
                                )}
                              </div>
                              <div className="relative h-[550px] w-full max-w-full rounded-lg overflow-hidden">
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
                                  adminLayers={adminLayers}
                                  onTimeChange={(time) => handleTimeChange(time, layerName, indicator.name)}
                                />
                                {/* Botón de descarga dentro del mapa - posicionado debajo de zoom */}
                                <button
                                  onClick={async () => {
                                    let rasterFile = rasterFilesRef.current[layerName];
                                    if (!rasterFile) {
                                      // Si no existe, obtener la fecha actual del mapa
                                      const result = await getCurrentRasterFile(layerName, indicator.name, indicatorWmsUrl);
                                      if (result) {
                                        rasterFile = result;
                                      }
                                    }
                                    if (rasterFile) {
                                      downloadRasterFile(rasterFile);
                                    }
                                  }}
                                  className="absolute top-36 right-4 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg p-2 shadow-md transition-colors cursor-pointer z-[1000]"
                                  title="Descargar capa raster"
                                >
                                  <FontAwesomeIcon icon={faFileArrowDown} className="h-4 w-4" />
                                </button>
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

        </div>
      </main>

      {/* Botón flotante de descarga de todos los rasters */}
      <button
        onClick={downloadAllData}
        disabled={!downloadReady || isPreparingDownload}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full p-3 sm:p-4 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed no-print transition-all hover:scale-110"
        style={{ zIndex: 9999 }}
        title={
          !downloadReady 
            ? "Esperando que las capas se carguen..." 
            : downloadProgress > 0 
              ? `Descargando... ${downloadProgress}%` 
              : "Descargar todos los datos raster"
        }
      >
        {downloadProgress > 0 ? (
          <span className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white inline-block"></span>
        ) : (
          <FontAwesomeIcon icon={faFileArrowDown} className="h-6 w-6 sm:h-8 sm:w-8" />
        )}
      </button>

      {/* Barra de progreso flotante */}
      {downloadProgress > 0 && (
        <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-8 w-56 sm:w-64 bg-white rounded-lg shadow-lg p-3 sm:p-4 no-print" style={{ zIndex: 9999 }}>
          <p className="text-sm text-gray-700 mb-2">Descargando... {downloadProgress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}