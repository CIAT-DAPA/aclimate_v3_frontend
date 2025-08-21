// page.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

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

export default function SpatialDataPage() {
  const [activeTab, setActiveTab] = useState<'climatic' | 'indicators'>('climatic');
  const [selectedTime, setSelectedTime] = useState<string>("");
  const rasterFilesRef = useRef<Record<string, RasterFileInfo>>({});
  const [downloadReady, setDownloadReady] = useState(false);

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
    setSelectedTime(time);
    const bbox = "-89.5,12.9,-83.1,16.5"; // Límites aproximados para Honduras
    
    // Crear URL para la capa específica
    const url = `${wmsBaseUrl}?service=WMS&request=GetMap&version=1.3.0&layers=${layerName}&styles=&format=image/tiff&transparent=true&time=${time}&bbox=${bbox}&width=512&height=512`;
    
    // Actualizar la referencia sin causar rerender
    rasterFilesRef.current[layerName] = { url, layer: layerName, time };
    setDownloadReady(true);
    
    console.log("Tiempo seleccionado:", time, "para la capa:", layerName);
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
            Esta herramienta interactiva te permite consultar información histórica sobre indicadores climáticos en Honduras.
          </p>
          <div className="mt-3">
            <p className="text-gray-600">Puedes usarla para:</p>
            <ul className="list-disc list-inside text-gray-600 mt-1">
              <li>Ver cómo varían estos indicadores en diferentes regiones</li>
              <li>Identificar zonas agrícolas con mayor riesgo climático</li>
            </ul>
          </div>
          {selectedTime && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-blue-700">
                Tiempo seleccionado: <strong>{selectedTime}</strong>
              </p>
            </div>
          )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wmsLayers.map((layer, index) => (
                  <div key={index} className="h-80 flex flex-col">
                    <h3 className="font-semibold text-gray-800 mb-2">{layer.title}</h3>
                    <MapComponent
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
                      onTimeChange={(time) => handleTimeChange(time, layer.layer)}
                    />
                  </div>
                ))}
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