// page.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";

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
}

// Información de tooltip para cada variable climática
const variableInfo = {
  "Temperatura máxima": "La temperatura máxima representa el valor más alto de temperatura del aire en un día, medido en grados Celsius (°C).",
  "Precipitación": "La precipitación es la cantidad total de agua que cae sobre la superficie, medida en milímetros (mm). Incluye lluvia, nieve, granizo, etc.",
  "Temperatura mínima": "La temperatura mínima representa el valor más bajo de temperatura del aire en un día, medido en grados Celsius (°C).",
  "Radiación solar": "La radiación solar es la cantidad de energía radiante recibida del sol por unidad de área, medida en megajulios por metro cuadrado (MJ/m²)."
};

export default function SpatialDataPage() {
  const [activeTab, setActiveTab] = useState<'climatic' | 'indicators'>('climatic');
  const rasterFilesRef = useRef<Record<string, RasterFileInfo>>({});
  const [downloadReady, setDownloadReady] = useState(false);

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

  const handleTimeChange = useCallback((time: string, layerName: string) => {
    const bbox = "-89.5,12.9,-83.1,16.5"; // Límites aproximados para Honduras
    
    // Crear URL para la capa específica
    const url = `${wmsBaseUrl}?service=WMS&request=GetMap&version=1.3.0&layers=${layerName}&styles=&format=image/tiff&transparent=true&time=${time}&bbox=${bbox}&width=512&height=512`;
    
    // Actualizar la referencia sin causar rerender
    rasterFilesRef.current[layerName] = { url, layer: layerName, time };
    setDownloadReady(true);
  }, [wmsBaseUrl]);

  // Función para descargar todos los archivos
  const downloadAllData = () => {
    const files = Object.values(rasterFilesRef.current);
    
    if (files.length === 0) {
      alert("No hay datos para descargar. Por favor, selecciona un tiempo primero.");
      return;
    }

    files.forEach(fileInfo => {
      const link = document.createElement('a');
      link.href = fileInfo.url;
      link.download = `${fileInfo.layer.split(':')[1]}_${fileInfo.time}.tiff`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm max-w-6xl mx-auto p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">Datos espaciales</h1>
          <p className="text-gray-600 mt-2">
            Esta herramienta interactiva te permite consultar información histórica sobre indicadores climáticos en País.
          </p>
          <div className="mt-3">
            <p className="text-gray-600">Puedes usarla para:</p>
            <ul className="list-disc list-inside text-gray-600 mt-1">
              <li>Ver cómo varían estos indicadores en diferentes regiones</li>
              <li>Identificar zonas agrícolas con mayor riesgo climático</li>
            </ul>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
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

          <div className="mt-6">
            {activeTab === 'climatic' ? (
              <div className="flex flex-col gap-8">
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
                          onTimeChange={(time) => handleTimeChange(time, layer.layer)}
                        />

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500">Selecciona un indicador para ver los datos</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button 
              className="bg-brand-green text-black py-3 rounded hover:bg-green-700 transition-colors font-medium"
              onClick={downloadAllData}
              disabled={!downloadReady}
            >
              Descargar todos los datos
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}