"use client";

import { useState, useMemo } from "react";
import { Frown, MapPin, Search } from "lucide-react";
import { Station } from "../types/Station";

const MapSearch = ({ stations }: { stations?: Station[] }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStations = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();

    return (stations ?? [])
      .filter((station) => station.enable)
      .filter(
        (station) =>
          station.name.toLowerCase().includes(term) ||
          station.admin1_name.toLowerCase().includes(term) ||
          station.admin2_name.toLowerCase().includes(term)
      )
      .slice(0, 5);
  }, [searchTerm, stations]);

  const handleStationClick = (station: Station) => {
    console.log("Estación seleccionada:", station);
    setSearchTerm(station.name);
    // TODO: Implementar función para centrar el mapa
  };

  return (
    <div className="absolute top-4 left-2 right-2 sm:left-4 sm:right-4 z-[1000] max-w-xs sm:max-w-md ">
      <div className="bg-white rounded-lg shadow-lg p-3 mb-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ubicación o estación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm sm:text-base"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {/* Resultados de búsqueda */}
      {searchTerm && (
        <div className="bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredStations.length > 0 ? (
            <>
              {filteredStations.map((station) => (
                <div
                  key={station.id}
                  onClick={() => handleStationClick(station)}
                  className="p-2 sm:p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-brand-green mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                        {station.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {station.admin2_name}, {station.admin1_name},{" "}
                        {station.country_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredStations.length === 5 && (
                <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                  Mostrando primeros 5 resultados
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center">
              <div className="text-gray-400 mb-2">
                <Frown className="h-8 w-8 mx-auto opacity-75" />
              </div>
              <p className="text-sm text-gray-600 font-medium">
                No hay estaciones que coincidan
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Intenta con otro término de búsqueda
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapSearch;
