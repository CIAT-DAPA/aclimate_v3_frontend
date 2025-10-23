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
//import "leaflet/dist/leaflet.css";
import TimelineController from "./TimeLineController";
import MapLegend from "./MapLegend";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/app/hooks/useAuth";
import { addUserStation, deleteUserStation, getUserStations } from "@/app/services/userService";
import { faTemperatureArrowUp } from '@fortawesome/free-solid-svg-icons';
import { faTemperatureArrowDown } from '@fortawesome/free-solid-svg-icons';
import { faCloudRain } from '@fortawesome/free-solid-svg-icons';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';


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
  showAdminLayer?: boolean;
  stationData?: Record<string, any[]>;
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
  showAdminLayer = false,
  stationData = {},
  
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
  const { userValidatedInfo, authenticated } = useAuth();

  // Estado para controlar favoritos
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set());

  // Cargar favoritos del usuario autenticado
  useEffect(() => {
    const loadUserFavorites = async () => {
      if (!authenticated || !userValidatedInfo) {
        return;
      }

      try {
        let userId = userValidatedInfo.id;
        const userStations = await getUserStations(userId);
        const favoriteIds = new Set(userStations.map(station => station.ws_ext_id?.toString() || ''));
        setFavorites(favoriteIds);
      } catch (error) {
        console.error('Error al cargar favoritos:', error);
        setFavorites(new Set());
      }
    };

    loadUserFavorites();
  }, [authenticated, userValidatedInfo]);

  const toggleFavorite = async (stationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!authenticated || !userValidatedInfo) {
      alert('Debe iniciar sesión para gestionar favoritos');
      return;
    }

    // Encontrar userId de la misma manera que en loadUserFavorites
    let userId = null;
    if (userValidatedInfo.user?.id) {
      userId = userValidatedInfo.user.id;
    } else if (userValidatedInfo.id) {
      userId = userValidatedInfo.id;
    } else {
      console.error('No se pudo encontrar userId para toggleFavorite');
      alert('Error: No se pudo identificar al usuario');
      return;
    }

    // Añadir a loading state
    const newLoadingFavorites = new Set(loadingFavorites);
    newLoadingFavorites.add(stationId);
    setLoadingFavorites(newLoadingFavorites);

    try {
      const isFavorite = favorites.has(stationId);

      if (isFavorite) {
        // Eliminar de favoritos
        await deleteUserStation(userId, stationId);
        const newFavorites = new Set(favorites);
        newFavorites.delete(stationId);
        setFavorites(newFavorites);
      } else {
        // Agregar a favoritos
        try {
          await addUserStation(userId, {
            ws_ext_id: stationId,
            notification: {
              email: true,
              push: false
            }
          });
          const newFavorites = new Set(favorites);
          newFavorites.add(stationId);
          setFavorites(newFavorites);
        } catch (addError) {
          // Si el error es porque ya existe, actualizar el estado local
          if (addError instanceof Error && addError.message.includes('favoritos')) {
            const newFavorites = new Set(favorites);
            newFavorites.add(stationId);
            setFavorites(newFavorites);
            alert('Esta estación ya está en favoritos');
          } else {
            throw addError;
          }
        }
      }
    } catch (error) {
      console.error('Error al gestionar favorito:', error);
      alert('Error al actualizar favoritos. Por favor, intente de nuevo.');
    } finally {
      // Remover del loading state
      const newLoadingFavorites = new Set(loadingFavorites);
      newLoadingFavorites.delete(stationId);
      setLoadingFavorites(newLoadingFavorites);
    }
  };

   // Función para formatear los datos de la estación para mostrar en el popup
  const renderStationData = (stationId: string) => {
    const data = stationData[stationId];
    if (!data || data.length === 0) {
      return <p className="text-gray-500 text-sm">No hay datos disponibles</p>;
    }

    // Agrupar datos por medida
    const measures: Record<string, any> = {};
    data.forEach(item => {
      measures[item.measure_short_name] = item;
    });

    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-3 font-medium">
          Datos para: {new Date(data[0].date).toLocaleDateString()}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Temperatura máxima */}
          {measures.Tmax && (
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faTemperatureArrowUp} 
                className="text-xl text-black-500 mr-2" // Aumentado a xl y color rojo
              />
              <div>
                <p className="text-xs text-gray-500">Temperatura máxima</p>
                <p className="text-sm font-semibold">{measures.Tmax.value.toFixed(1)}°C</p>
              </div>
            </div>
          )}
          
          {/* Temperatura mínima */}
          {measures.Tmin && (
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faTemperatureArrowDown} 
                className="text-xl text-black-500 mr-2" // Aumentado a xl y color azul
              />
              <div>
                <p className="text-xs text-gray-500">Temperatura mínima</p>
                <p className="text-sm font-semibold">{measures.Tmin.value.toFixed(1)}°C</p>
              </div>
            </div>
          )}
          
          {/* Precipitación */}
          {measures.Prec && (
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faCloudRain} 
                className="text-xl text-black-400 mr-2" // Aumentado a xl y color azul claro
              />
              <div>
                <p className="text-xs text-gray-500">Precipitación</p>
                <p className="text-sm font-semibold">{measures.Prec.value.toFixed(1)}mm</p>
              </div>
            </div>
          )}
          
          {/* Radiación solar */}
          {measures.Rad && (
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faSun} 
                className="text-xl text-black-500 mr-2" // Aumentado a xl y color amarillo
              />
              <div>
                <p className="text-xs text-gray-500">Radiación</p>
                <p className="text-sm font-semibold">{measures.Rad.value.toFixed(1)}MJ/m²</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        zoomControl={false}
        ref={mapRef}
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
            position="bottomleft"
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
              <div className="p-4 min-w-[280px]">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-brand-green">
                    Estación {station.name}
                  </h3>
                  <button
                    onClick={(e) => toggleFavorite(station.id.toString(), e)}
                    disabled={loadingFavorites.has(station.id.toString())}
                    className={`p-1 rounded-full ${
                      favorites.has(station.id.toString()) 
                        ? "text-red-500 bg-red-50" 
                        : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                    } transition-colors ${
                      loadingFavorites.has(station.id.toString()) 
                        ? "opacity-50 cursor-not-allowed" 
                        : ""
                    }`}
                    aria-label="Agregar a favoritos"
                  >
                    {loadingFavorites.has(station.id.toString()) ? (
                      <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        viewBox="0 0 20 20" 
                        fill={favorites.has(station.id.toString()) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <p className="text-gray-600">
                    <span className="font-medium">Ubicación:</span>{" "}
                    {station.admin2_name}, {station.admin1_name}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">País:</span>{" "}
                    {station.country_name}
                  </p>
                  
                  {/* Mostrar datos de la última fecha disponible */}
                  {renderStationData(station.id.toString())}
                  
                  <p className="text-xs text-gray-400 mt-3 pt-2 border-t">
                    Coordenadas: {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                  </p>
                </div>
                
                <div className="flex justify-between gap-2">
                  <button
                    onClick={(e) => toggleFavorite(station.id.toString(), e)}
                    disabled={loadingFavorites.has(station.id.toString()) || !authenticated}
                    className={`flex items-center justify-center text-xs px-3 py-2 border rounded-md transition-colors ${
                      favorites.has(station.id.toString())
                        ? "text-red-600 border-red-300 bg-red-50 hover:bg-red-100"
                        : "text-gray-600 border-gray-300 hover:text-gray-800 hover:bg-gray-50"
                    } ${
                      loadingFavorites.has(station.id.toString()) || !authenticated
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {loadingFavorites.has(station.id.toString()) ? (
                      <div className="animate-spin h-4 w-4 mr-1 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                    {!authenticated 
                      ? "Inicie sesión" 
                      : favorites.has(station.id.toString()) 
                        ? "Quitar favorito" 
                        : "Agregar favorito"
                    }
                  </button>
                  
                  <Link
                    className="bg-brand-green text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
                    href={`/monitory/${station.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FontAwesomeIcon icon={faChartSimple} />
                    Monitoreo
                  </Link>
                </div>
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