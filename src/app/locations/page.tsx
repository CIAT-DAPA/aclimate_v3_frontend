"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MapSearch from "../components/MapSearch";
import { useStations } from "@/app/contexts/StationsContext";
import { Station } from "@/app/types/Station";
import { useBranchConfig } from "@/app/configs";
import { useI18n } from "@/app/contexts/I18nContext";

function MapLoadingFallback() {
  const { t } = useI18n();

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
        <p className="text-gray-600">{t("locations.loadingMap")}</p>
      </div>
    </div>
  );
}

const MapComponent = dynamic(() => import("../components/MapComponent"), {
  ssr: false,
  loading: () => <MapLoadingFallback />,
});

export default function LocationsPage() {
  const { stations, stationData, loading, error } = useStations();
  const config = useBranchConfig();
  const { t } = useI18n();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showLoading, setShowLoading] = useState(false);

  // Obtener center y zoom de la configuración del país, con fallback por seguridad
  const mapCenter = config.data?.center || [4.6097, -74.0817];
  const mapZoom = config.data?.zoom || 6;

  // Solo mostrar el spinner si la carga dura más de 300ms
  // Esto evita flashes durante Fast Refresh o cargas muy rápidas
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowLoading(true);
      }, 300);
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {t("locations.errorLabel", { error })}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#bc6c25] text-white cursor-pointer px-4 py-2 rounded hover:bg-amber-700 transition-colors"
          >
            {t("locations.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Componente del mapa con las estaciones */}
      <MapComponent
        center={mapCenter}
        zoom={mapZoom}
        stations={stations}
        stationData={stationData}
        selectedStation={selectedStation}
      />

      {/* Buscador superpuesto */}
      <MapSearch
        stations={stations}
        onStationSelect={(station) => setSelectedStation(station)}
      />

      {/* Indicador de carga sobre el mapa */}
      {showLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1001]">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto mb-2"></div>
            <p className="text-gray-600">{t("locations.loadingStations")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
