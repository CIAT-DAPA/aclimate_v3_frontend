"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import { Icon } from "leaflet";
import { Station } from "@/app/types/Station";
import "leaflet/dist/leaflet.css";

const customIcon = new Icon({
  iconUrl: "/assets/img/marker.png",
  iconSize: [48, 48],
});

const MapComponent = ({
  center = [4.6097, -74.0817],
  zoom = 6,
  stations = [],
}: {
  center?: [number, number];
  zoom?: number;
  stations?: Station[];
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ZoomControl position="topright" />

      {/* Renderizar solo las estaciones visibles */}
      {stations
        .filter((station) => station.visible)
        .map((station) => (
          <Marker
            key={station.id}
            position={[station.lat, station.lon]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg text-brand-green mb-2">
                  {station.name}
                </h3>

                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Ubicación:</span>{" "}
                    {station.admin2_name}, {station.admin1_name}
                  </p>

                  <p className="text-gray-600">
                    <span className="font-medium">País:</span>{" "}
                    {station.country_name} ({station.country_iso2})
                  </p>

                  <p className="text-gray-600">
                    <span className="font-medium">ID Externo:</span>{" "}
                    {station.ext_id}
                  </p>

                  <p className="text-xs text-gray-400 mt-2 pt-2 border-t">
                    Coordenadas: {station.lat.toFixed(4)},{" "}
                    {station.lon.toFixed(4)}
                  </p>
                </div>

                <button className="mt-3 bg-brand-green text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                  Ver detalles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};

export default MapComponent;
