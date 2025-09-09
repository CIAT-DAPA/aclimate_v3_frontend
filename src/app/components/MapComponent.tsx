// app/components/MapComponent.tsx
"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  WMSTileLayer,
  LayersControl
} from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import { Station } from "@/app/types/Station";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import TimelineController from "./TimeLineController";
import MapLegend from "./MapLegend";

import { useRef } from "react";
import { useRouter } from "next/navigation";

const customIcon = new Icon({
  iconUrl: "/assets/img/marker.png",
  iconSize: [48, 48],
});

const rasterLayers = [
  {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    name: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
  },
  {
    name: "Topográfico",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
  }
];

interface WMSLayer {
  url: string;
  layers: string;
  format?: string;
  transparent?: boolean;
  version?: string;
  opacity?: number;
  attribution?: string;
  styles?: string;
  time?: string;
  cql_filter?: string;
}

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  stations?: Station[];
  wmsLayers?: WMSLayer[];
  baseLayerIndex?: number;
  showZoomControl?: boolean;
  showMarkers?: boolean;
  showTimeline?: boolean;
  onTimeChange?: (time: string) => void;
  showLegend?: boolean;
  showAdminLayer?: boolean; // Nueva prop para mostrar capa administrativa
}

const MapComponent = ({
  center = [4.6097, -74.0817],
  zoom = 6,
  stations = [],
  wmsLayers = [],
  baseLayerIndex = 0,
  showZoomControl = true,
  showMarkers = true,
  showTimeline = false,
  onTimeChange = () => {},
  showLegend = true,
  showAdminLayer = false // Valor por defecto
}: MapComponentProps) => {
  const activeStations = stations.filter(station => station.enable);
  const hasStations = activeStations.length > 0;
  const singleStationMode = activeStations.length === 1;
  const noStationsMode = activeStations.length === 0;

  const mapCenter: LatLngExpression = singleStationMode
    ? [activeStations[0].latitude, activeStations[0].longitude]
    : center;

  const mapZoom = singleStationMode ? 13 : zoom;

  const mapRef = useRef<any>(null);
  const router = useRouter();

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        zoomControl={false}
        ref={mapRef}
        // Asegura que Leaflet no inicialice automáticamente TimeDimension global
        timeDimension={false as any}
        timeDimensionControl={false as any}
      >
        <TileLayer
          attribution={rasterLayers[baseLayerIndex].attribution}
          url={rasterLayers[baseLayerIndex].url}
        />

        {noStationsMode && !wmsLayers.length && (
          <>
            <TileLayer
              attribution={rasterLayers[1].attribution}
              url={rasterLayers[1].url}
              opacity={0.7}
            />
            <TileLayer
              attribution={rasterLayers[2].attribution}
              url={rasterLayers[2].url}
              opacity={0.3}
            />
          </>
        )}

        {wmsLayers.length > 0 && (
          <LayersControl position="topright">
            {/* Capa administrativa de Honduras */}
            {showAdminLayer && (
              <LayersControl.Overlay 
                name="Límites Departamentales de Honduras" 
                checked={true}
              >
                <WMSTileLayer
                  url="https://geo.aclimate.org/geoserver/fc_cenaos_hn/wms"
                  layers="fc_cenaos_hn:Limite_Departamental_de_Honduras"
                  format="image/png"
                  transparent={true}
                  version="1.1.1"
                  opacity={0.5}
                  styles=""
                  attribution=""
                />
              </LayersControl.Overlay>
            )}
          </LayersControl>
        )}

        {showTimeline && wmsLayers.length > 0 && (
          <TimelineController
            dimensionName="time"
            layer={wmsLayers[0].layers}
            onTimeChange={onTimeChange}
            wmsUrl={wmsLayers[0].url}
          />
        )}

        {showLegend && wmsLayers.length > 0 && (
          <MapLegend
            wmsUrl={wmsLayers[0].url}
            layerName={wmsLayers[0].layers}
            position="bottomright"
          />
        )}

        {showZoomControl && <ZoomControl position="topright" />}

        {showMarkers && hasStations && !singleStationMode && activeStations.map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude] as LatLngExpression}
            icon={customIcon}
          >
            <Popup>
              <div
                className="p-2 min-w-[200px] cursor-pointer"
                onClick={() => router.push(`/monitory/${station.id}`)}
                role="button"
                tabIndex={0}
              >
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
                    Coordenadas: {station.latitude.toFixed(4)},{" "}
                    {station.longitude.toFixed(4)}
                  </p>
                </div>
                <Link 
                  className="mt-3 inline-block text-white px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors" 
                  href={`/monitory/${station.id}`}
                >
                  Ver detalles
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {showMarkers && singleStationMode && activeStations.map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude] as LatLngExpression}
            icon={customIcon}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;