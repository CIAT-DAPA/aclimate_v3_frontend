// app/components/MapComponent.tsx
"use client";

import {  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  WMSTileLayer,
  LayersControl,
  useMapEvents,
  useMap
} from "react-leaflet";
import { Icon, LatLngExpression, DivIcon } from "leaflet";
import L from "leaflet";
import { Station } from "@/app/types/Station";
import Link from "next/link";
//import "leaflet/dist/leaflet.css";
import TimelineController from "./TimeLineController";
import MapLegend from "./MapLegend";

import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "@/app/hooks/useAuth";
import { addUserStation, deleteUserStation, getUserStations } from "@/app/services/userService";
import { faTemperatureArrowUp } from '@fortawesome/free-solid-svg-icons';
import { faTemperatureArrowDown } from '@fortawesome/free-solid-svg-icons';
import { faCloudRain } from '@fortawesome/free-solid-svg-icons';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faMapPin } from '@fortawesome/free-solid-svg-icons';

// Paleta de colores accesibles con buen contraste
const ACCESSIBLE_COLORS = [
  '#1f77b4', // Azul
  '#ff7f0e', // Naranja
  '#2ca02c', // Verde
  '#d62728', // Rojo
  '#9467bd', // Púrpura
  '#8c564b', // Marrón
  '#e377c2', // Rosa
  '#7f7f7f', // Gris
  '#bcbd22', // Amarillo oliva
  '#17becf', // Cyan
  '#aec7e8', // Azul claro
  '#ffbb78', // Naranja claro
  '#98df8a', // Verde claro
  '#ff9896', // Rojo claro
  '#c5b0d5', // Púrpura claro
];


// Función para crear íconos con color dinámico
const createColoredIcon = (color: string): DivIcon => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="position: relative; width: 48px; height: 48px;">
        <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                fill="${color}" 
                stroke="#ffffff" 
                stroke-width="0.5"/>
        </svg>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });
};

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
  title?: string;
  unit?: string;
}

interface AdminLayer {
  name: string;
  workspace: string;
  store: string;
  layer: string;
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
  adminLayers?: AdminLayer[];
  stationData?: Record<string, any[]>;
  selectedStation?: Station | null;
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
  adminLayers = [],
  stationData = {},
  selectedStation = null,
}: MapComponentProps) => {
  const activeStations = stations.filter(station => station.enable);
  const hasStations = activeStations.length > 0;
  const singleStationMode = activeStations.length === 1;
  const noStationsMode = activeStations.length === 0;
  

  const mapCenter: LatLngExpression = singleStationMode
    ? [activeStations[0].latitude, activeStations[0].longitude]
    : center;

  const mapZoom = singleStationMode ? 13 : zoom;

  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const { userValidatedInfo, authenticated } = useAuth();

  // Estado para controlar favoritos
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set());
  
  // Usar ref para evitar múltiples cargas de favoritos
  const favoritesLoadedRef = useRef(false);

  // Calcular el mapeo de fuentes a colores usando useMemo
  const sourceColorMap = useMemo(() => {
    const uniqueSources = new Set<string>();
    activeStations.forEach(station => {
      if (station.source_name) {
        uniqueSources.add(station.source_name);
      }
    });
    
    const colorMap: Record<string, string> = {};
    Array.from(uniqueSources).forEach((source, index) => {
      colorMap[source] = ACCESSIBLE_COLORS[index % ACCESSIBLE_COLORS.length];
    });
    
    return colorMap;
  }, [activeStations]);

  // Efecto para centrar el mapa cuando se selecciona una estación desde la búsqueda
  useEffect(() => {
    if (selectedStation && mapRef.current) {
      const map = mapRef.current;
      const marker = markersRef.current.get(selectedStation.id.toString());
      
      // Centrar el mapa en la estación con animación
      map.setView([selectedStation.latitude, selectedStation.longitude], 12, {
        animate: true,
        duration: 1
      });
      
      // Abrir el popup del marcador si existe
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 500);
      }
    }
  }, [selectedStation]);

  // Cargar favoritos del usuario autenticado
  useEffect(() => {
    const loadUserFavorites = async () => {
      // Solo cargar una vez cuando el usuario esté autenticado
      if (!authenticated || !userValidatedInfo || favoritesLoadedRef.current) {
        return;
      }

      try {
        favoritesLoadedRef.current = true;
        const userId = userValidatedInfo.id;
        const userStations = await getUserStations(userId);
        const favoriteIds = new Set(userStations.map(station => station.location_id?.toString() || station.ws_ext_id?.toString() || ''));
        setFavorites(favoriteIds);
      } catch (error) {
        console.error('Error al cargar favoritos:', error);
        setFavorites(new Set());
        favoritesLoadedRef.current = false; // Permitir reintentar si falla
      }
    };

    loadUserFavorites();
  }, [authenticated]);

  const toggleFavorite = async (stationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!authenticated || !userValidatedInfo) {
      alert('Debe iniciar sesión para gestionar favoritos');
      return;
    }

    // Encontrar userId de la misma manera que en loadUserFavorites
    const userId = userValidatedInfo.user?.id ?? userValidatedInfo.id;
    if (!userId) {
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

  // Componente para manejar clics en el mapa (solo para datos espaciales)
  const MapClickHandler = () => {
    const map = useMap();
    
    useMapEvents({
      click: async (e) => {
        // Solo procesar clics si hay capas WMS y no estamos en modo de estaciones
        if (wmsLayers.length === 0 || showMarkers) {
          return;
        }

        const { lat, lng } = e.latlng;

        // Crear contenido HTML para el popup con estado de carga
        const popupContent = document.createElement('div');
        popupContent.className = 'p-2';
        popupContent.innerHTML = `
          <h3 class="font-semibold text-sm mb-2">Valor del píxel</h3>
          <div class="text-xs text-gray-600 mb-2 flex items-center gap-1">
            <span class="text-sm">📍</span>
            <p>${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
          </div>
          <p class="text-sm text-gray-500">Cargando...</p>
        `;

        // Mostrar popup inmediatamente
        const popup = L.popup()
          .setLatLng([lat, lng])
          .setContent(popupContent)
          .openOn(map);

        // Obtener el valor del píxel
        try {
          const layer = wmsLayers[0];
          const bounds = map.getBounds();
          const size = map.getSize();
          
          // Construir la URL de GetFeatureInfo
          const point = map.latLngToContainerPoint(e.latlng);
          
          const params = new URLSearchParams({
            SERVICE: 'WMS',
            VERSION: layer.version || '1.3.0',
            REQUEST: 'GetFeatureInfo',
            FORMAT: 'image/png',
            TRANSPARENT: 'true',
            QUERY_LAYERS: layer.layers,
            LAYERS: layer.layers,
            INFO_FORMAT: 'application/json',
            I: Math.floor(point.x).toString(),
            J: Math.floor(point.y).toString(),
            WIDTH: size.x.toString(),
            HEIGHT: size.y.toString(),
            CRS: 'EPSG:4326',
            BBOX: `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`,
          });

          // Agregar parámetros adicionales si existen
          if (layer.time) {
            params.append('TIME', layer.time);
          }
          if (layer.styles) {
            params.append('STYLES', layer.styles);
          }

          const url = `${layer.url}?${params.toString()}`;
          const response = await fetch(url);
          const data = await response.json();

          // Extraer el valor del píxel
          let pixelValue = 'Sin datos';
          if (data.features && data.features.length > 0) {
            const properties = data.features[0].properties;
            // Buscar la propiedad que contiene el valor
            const valueKey = Object.keys(properties).find(key => 
              key.toLowerCase().includes('gray') || 
              key.toLowerCase().includes('value') ||
              key === 'GRAY_INDEX'
            );
            
            if (valueKey && properties[valueKey] !== null && properties[valueKey] !== undefined) {
              pixelValue = Number(properties[valueKey]).toFixed(2);
            }
          }

          // Determinar la unidad a mostrar
          const unit = layer.unit || '';

          // Actualizar el contenido del popup
          popupContent.innerHTML = `
            <h3 class="font-semibold text-sm mb-2">Valor del píxel</h3>
            <div class="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <span class="text-sm">📍</span>
              <p>${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
            </div>
            <p class="text-sm font-medium text-gray-800">
              Valor: ${pixelValue}${unit ? ' ' + unit : ''}
            </p>
          `;
        } catch (error) {
          console.error('Error al obtener información del píxel:', error);
          popupContent.innerHTML = `
            <h3 class="font-semibold text-sm mb-2">Valor del píxel</h3>
            <div class="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <span class="text-sm">📍</span>
              <p>${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
            </div>
            <p class="text-sm text-red-600">Error al cargar datos</p>
          `;
        }
      }
    });
    
    return null;
  };

   // Función para formatear los datos de la estación para mostrar en el popup
  const renderStationData = (stationId: string) => {
    const data = stationData[stationId];
    if (!data || data.length === 0) {
      return <p className="text-gray-500 text-sm">No hay datos disponibles</p>;
    }

    // Agrupar datos por medida
    type Measure = { value: number };
    const measures: Record<string, Measure> = {};
    data.forEach((item: { measure_short_name: string; value: number }) => {
      measures[item.measure_short_name] = { value: item.value };
    });

    return (
      <div className="">
        <p className="text-xs text-gray-500 mb-3 font-medium">
          Datos actuales: {new Date(data[0].date).toLocaleDateString()}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Temperatura máxima */}
          {measures.Tmax && (
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faTemperatureArrowUp} 
                className="text-xl text-black-500 mr-2"
              />
              <div>
                <p className="text-xs text-gray-500">Temperatura máxima</p>
                <p className="text-sm font-semibold">{Number(measures.Tmax.value).toFixed(1)}°C</p>
              </div>
            </div>
          )}
          
          {/* Temperatura mínima */}
          {measures.Tmin && (
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faTemperatureArrowDown} 
                className="text-xl text-black-500 mr-2"
              />
              <div>
                <p className="text-xs text-gray-500">Temperatura mínima</p>
                <p className="text-sm font-semibold">{Number(measures.Tmin.value).toFixed(1)}°C</p>
              </div>
            </div>
          )}
          
          {/* Precipitación */}
          {measures.Prec && (
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faCloudRain} 
                className="text-xl text-black-400 mr-2"
              />
              <div>
                <p className="text-xs text-gray-500">Precipitación</p>
                <p className="text-sm font-semibold">{Number(measures.Prec.value).toFixed(1)}mm</p>
              </div>
            </div>
          )}
          
          {/* Radiación solar */}
          {measures.Rad && (
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faSun} 
                className="text-xl text-black-500 mr-2"
              />
              <div>
                <p className="text-xs text-gray-500">Radiación</p>
                <p className="text-sm font-semibold">{Number(measures.Rad.value).toFixed(1)}MJ/m²</p>
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
        style={{ cursor: wmsLayers.length > 0 && !showMarkers ? 'crosshair' : 'grab' }}
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

        {/* Capas WMS climáticas (raster) - se dibujan primero */}
        {/* Solo renderizar WMSTileLayer si showTimeline es false, ya que el timeline crea su propia capa */}
        {wmsLayers.length > 0 && !showTimeline && wmsLayers.map((layer, index) => (
          <WMSTileLayer
            key={`wms-${index}`}
            url={layer.url}
            layers={layer.layers}
            format={layer.format || "image/png"}
            transparent={layer.transparent !== false}
            version={layer.version || "1.3.0"}
            opacity={layer.opacity || 0.7}
            styles={layer.styles || ""}
            attribution={layer.attribution || ""}
            params={{
              ...(layer.time && { time: layer.time }),
              ...(layer.cql_filter && { cql_filter: layer.cql_filter })
            } as any}
          />
        ))}

        {/* Control de capas con las capas administrativas dinámicas */}
        {wmsLayers.length > 0 && showAdminLayer && adminLayers.length > 0 && (
          <LayersControl position="topright">
            {adminLayers.map((adminLayer, index) => (
              <LayersControl.Overlay 
                key={`admin-${index}`}
                name={adminLayer.name}
                checked={true}
              >
                <WMSTileLayer
                  url={`https://geo.aclimate.org/geoserver/${adminLayer.workspace}/wms`}
                  layers={adminLayer.layer}
                  format="image/png"
                  transparent={true}
                  version="1.1.1"
                  opacity={1}
                  styles="line"
                  attribution=""
                  zIndex={1000 + index}
                />
              </LayersControl.Overlay>
            ))}
          </LayersControl>
        )}

        {/* Manejador de clics para datos espaciales */}
        {wmsLayers.length > 0 && !showMarkers && <MapClickHandler />}

        {showTimeline && wmsLayers.length > 0 && (
          <TimelineController
            dimensionName="time"
            layer={wmsLayers[0].layers}
            onTimeChange={onTimeChange}
            wmsUrl={wmsLayers[0].url}
            opacity={wmsLayers[0].opacity || 0.7}
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

        {showMarkers && hasStations && !singleStationMode && activeStations.map((station) => {
          const markerColor = station.source_name ? sourceColorMap[station.source_name] : ACCESSIBLE_COLORS[0];
          
          return (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude] as LatLngExpression}
            icon={createColoredIcon(markerColor)}
            ref={(ref) => {
              if (ref) {
                markersRef.current.set(station.id.toString(), ref);
              }
            }}
          >
            <Popup>
              <div className="p-4 min-w-[280px]">
                <div className="mb-3">
                  <h3 className="font-bold text-lg text-brand-green">
                    Estación {station.name}
                  </h3>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <p className="text-gray-600 flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-sm mr-2" />
                    {station.admin1_name}, {station.admin2_name} 
                  </p>
                  {station.source_name && (
                    <p className="text-xs text-gray-500">
                      Fuente: <span className="font-medium">{station.source_name}</span>
                      {station.source_type && ` (${station.source_type === 'MA' ? 'Manual' : station.source_type === 'AU' ? 'Automática' : station.source_type})`}
                    </p>
                  )}
                  
                  {/* Mostrar datos de la última fecha disponible */}
                  {renderStationData(station.id.toString())}
                  
                  <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-200">
                  </p>
                </div>
                
                <div className="flex justify-between gap-2">
                  <button
                    onClick={(e) => toggleFavorite(station.id.toString(), e)}
                    disabled={loadingFavorites.has(station.id.toString()) || !authenticated}
                    className={`flex items-center justify-center text-xs px-3 py-2 border rounded-md transition-colors ${
                      favorites.has(station.id.toString())
                        ? "text-yellow-600 border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
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
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 mr-1" 
                        viewBox="0 0 20 20" 
                        fill={favorites.has(station.id.toString()) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
                    className="flex items-center justify-center text-xs px-3 py-2 border border-gray-300 text-gray-600 bg-white rounded-md hover:text-gray-800 hover:bg-gray-50 transition-colors"
                    href={`/monitory/${station.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FontAwesomeIcon icon={faChartSimple} className="mr-1" />
                    Monitoreo
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );})}

        {showMarkers && singleStationMode && activeStations.map((station) => {
          const markerColor = station.source_name ? sourceColorMap[station.source_name] : ACCESSIBLE_COLORS[0];
          
          return (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude] as LatLngExpression}
            icon={createColoredIcon(markerColor)}
            ref={(ref) => {
              if (ref) {
                markersRef.current.set(station.id.toString(), ref);
              }
            }}
          />
        );})}

        {/* Leyenda de fuentes - solo mostrar cuando hay estaciones con marcadores */}
        {showMarkers && hasStations && Object.keys(sourceColorMap).length > 0 && (
          <MapLegend position="topright" title="Fuentes de datos " maxHeight="200px">
            <div className="space-y-1">
              {Object.entries(sourceColorMap).map(([source, color]) => (
                <div key={source} className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                          fill={color} 
                          stroke="#ffffff" 
                          strokeWidth="0.5"/>
                  </svg>
                  <span className="text-xs text-gray-600">{source}</span>
                </div>
              ))}
            </div>
          </MapLegend>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;