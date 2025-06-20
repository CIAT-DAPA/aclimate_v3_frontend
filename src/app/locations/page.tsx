"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MapSearch from "../components/MapSearch";
import { stationService } from "@/app/services/stationService";
import { Station } from "@/app/types/Station";

const MapComponent = dynamic(() => import("../components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  ),
});

export default function LocationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const data = await stationService.getAll();
        setStations(data);

        // Log para debugging
        console.log("Estaciones cargadas:", data.length);
        console.log("Primera estación:", data[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading stations");
        console.error("Error fetching stations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
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

  return (
    <div className="relative h-screen w-full">
      {/* Componente del mapa con las estaciones */}
      <MapComponent center={[4.6097, -74.0817]} zoom={6} stations={stations} />

      {/* Buscador superpuesto */}
      <MapSearch stations={stations} />

      {/* Indicador de carga */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1001]">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando estaciones...</p>
          </div>
        </div>
      )}
    </div>
  );
}
