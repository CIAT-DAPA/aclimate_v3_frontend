// page.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { COUNTRY_NAME } from "@/app/config";

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

// Información de tooltip para cada variable climática
const variableInfo = {
  "Temperatura máxima": "La temperatura máxima representa el valor más alto de temperatura del aire en un día, medido en grados Celsius (°C).",
  "Precipitación": "La precipitación es la cantidad total de agua que cae sobre la superficie, medida en milímetros (mm). Incluye lluvia, nieve, granizo, etc.",
  "Temperatura mínima": "La temperatura mínima representa el valor más bajo de temperatura del aire en un día, medido en grados Celsius (°C).",
  "Radiación solar": "La radiación solar es la cantidad de energía radiante recibida del sol por unidad de área, medida en megajulios por metro cuadrado (MJ/m²)."
};

export default function SpatialDataPage() {
  const [isClimaticOpen, setIsClimaticOpen] = useState(true);
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
  const rasterFilesRef = useRef<Record<string, RasterFileInfo>>({});
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

   // Inicializar tooltips de Flowbite
  useEffect(() => {
    // Cargar e inicializar Flowbite solo en el cliente
    const initFlowbite = async () => {
      const { initTooltips } = await import('flowbite');
      initTooltips();
    };
    
    initFlowbite();
  }, []);

  // Configuración de capas WMS
  const wmsBaseUrl = "https://geo.aclimate.org/geoserver/historical_climate_hn/wms";
  const wmsLayers = [
    {
      title: "Temperatura máxima",
      layer: "historical_climate_hn:TMAX",
      center: [14.5, -86.5] as [number, number],
      zoom: 7
    },
    {
      title: "Precipitación",
      layer: "historical_climate_hn:PREC",
      center: [14.5, -86.5] as [number, number],
      zoom: 7
    },
    {
      title: "Temperatura mínima",
      layer: "historical_climate_hn:TMIN",
      center: [14.5, -86.5] as [number, number],
      zoom: 7
    },
    {
      title: "Radiación solar",
      layer: "historical_climate_hn:SRAD",
      center: [14.5, -86.5] as [number, number],
      zoom: 7
    }
  ];

  const handleTimeChange = useCallback((time: string, layerName: string, layerTitle: string) => {
    const bbox = "-89.5,12.9,-83.1,16.5"; // Límites aproximados para Honduras
    
    // Crear URL para la capa específica
    const url = `${wmsBaseUrl}?service=WMS&request=GetMap&version=1.3.0&layers=${layerName}&styles=&format=image/tiff&transparent=true&time=${time}&bbox=${bbox}&width=512&height=512`;
    
    // Actualizar la referencia sin causar rerender
    rasterFilesRef.current[layerName] = { url, layer: layerName, time, title: layerTitle };
    setDownloadReady(Object.keys(rasterFilesRef.current).length > 0);
  }, [wmsBaseUrl]);

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm max-w-6xl mx-auto p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">Datos espaciales</h1>
          <p className="text-gray-600 mt-2">
            Esta herramienta interactiva te permite consultar información histórica sobre indicadores climáticos en {COUNTRY_NAME}.
          </p>
          <div className="mt-3">
            <p className="text-gray-600">Puedes usarla para:</p>
            <ul className="list-disc list-inside text-gray-600 mt-1">
              <li>Ver cómo varían estos indicadores en diferentes regiones</li>
              <li>Identificar zonas agrícolas con mayor riesgo climático</li>
              <li>Descargar datos raster para análisis especializados</li>
            </ul>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
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
                    <p>Explora cómo se comportan las principales variables climáticas en todo el territorio de {COUNTRY_NAME}. Observa la distribución y evolución de la <strong>temperatura</strong>, la <strong>precipitación</strong> y la <strong>radiación solar</strong>. 
                    Ajusta la visualización con los filtros de fecha para obtener la información que necesites.</p>
                    {wmsLayers.map((layer, index) => {
                      let unidad = "";
                      if (layer.title.toLowerCase().includes("temperatura")) {
                        unidad = "°C";
                      } else if (layer.title.toLowerCase().includes("precipitación")) {
                        unidad = "mm";
                      } else if (layer.title.toLowerCase().includes("radiación")) {
                        unidad = "MJ/m²";
                      }

                      const tooltipId = `tooltip-${layer.title.replace(/\s+/g, '-').toLowerCase()}`;

                      return (
                        <div key={layer.layer} className="h-80 flex flex-col">
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
                              {variableInfo[layer.title as keyof typeof variableInfo]}
                              <div className="tooltip-arrow" data-popper-arrow></div>
                            </div>
                          </div>
                          <div className="h-96 w-full rounded-lg overflow-hidden">
                            <MapComponent
                              key={layer.layer}
                              center={layer.center}
                              zoom={layer.zoom}
                              wmsLayers={[{
                                url: wmsBaseUrl,
                                layers: layer.layer,
                                opacity: 0.7,
                                transparent: true
                              }]}
                              showMarkers={false}
                              showZoomControl={true}
                              showTimeline={true}
                              showLegend={true}
                              showAdminLayer={true}
                              onTimeChange={(time) => handleTimeChange(time, layer.layer, layer.title)}
                            />
                          </div>
                        </div>
                      );
                    })}
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
                  <p>Analiza la evolución de los indicadores climáticos en {COUNTRY_NAME} y detecta tendencias clave. Filtra por <strong>categoría</strong> y <strong>rango de fechas</strong> para profundizar en los datos que más te interesen.</p>
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">No hay datos para mostrar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col items-start gap-4">
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