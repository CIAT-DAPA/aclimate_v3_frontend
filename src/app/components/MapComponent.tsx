// app/components/MapComponent.tsx
"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  WMSTileLayer,
  LayersControl,
  useMapEvents,
  useMap,
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
import {
  addUserStation,
  deleteUserStation,
  getUserStations,
} from "@/app/services/userService";
import { faTemperatureArrowUp } from "@fortawesome/free-solid-svg-icons";
import { faTemperatureArrowDown } from "@fortawesome/free-solid-svg-icons";
import { faCloudRain } from "@fortawesome/free-solid-svg-icons";
import { faSun } from "@fortawesome/free-solid-svg-icons";
import { faChartPie } from "@fortawesome/free-solid-svg-icons";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { faMapPin } from "@fortawesome/free-solid-svg-icons";
import { faTint } from "@fortawesome/free-solid-svg-icons";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { faWaveSquare } from "@fortawesome/free-solid-svg-icons";

// Paleta de colores accesibles con buen contraste
const ACCESSIBLE_COLORS = [
  "#1f77b4", // Azul
  "#ff7f0e", // Naranja
  "#2ca02c", // Verde
  "#d62728", // Rojo
  "#9467bd", // Púrpura
  "#8c564b", // Marrón
  "#e377c2", // Rosa
  "#7f7f7f", // Gris
  "#bcbd22", // Amarillo oliva
  "#17becf", // Cyan
  "#aec7e8", // Azul claro
  "#ffbb78", // Naranja claro
  "#98df8a", // Verde claro
  "#ff9896", // Rojo claro
  "#c5b0d5", // Púrpura claro
];

// Función para crear íconos con color dinámico
const createColoredIcon = (color: string): DivIcon => {
  return L.divIcon({
    className: "custom-marker-icon",
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
    popupAnchor: [0, -48],
  });
};

const rasterLayers = [
  {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    name: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
  {
    name: "Topográfico",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
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
  bounds?: [[number, number], [number, number]];
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
  displayFormat?: string;
}

const MapComponent = ({
  center = [4.6097, -74.0817],
  zoom = 6,
  bounds,
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
  displayFormat = "YYYY-MM-DD",
}: MapComponentProps) => {
  const activeStations = stations.filter((station) => station.enable);
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

  // Fix for "Map container is being reused by another instance" error during HMR/Strict Mode
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Estado para controlar favoritos
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(
    new Set(),
  );

  // Estado para guardar el tiempo actual de la capa
  const [currentTime, setCurrentTime] = useState<string>("");

  // Usar ref para evitar múltiples cargas de favoritos
  const favoritesLoadedRef = useRef(false);

  // Calcular el mapeo de fuentes a colores usando useMemo
  const sourceColorMap = useMemo(() => {
    const uniqueSources = new Set<string>();
    activeStations.forEach((station) => {
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
        duration: 1,
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
        const favoriteIds = new Set(
          userStations.map((station) => station.ws_ext_id?.toString() || ""),
        );
        setFavorites(favoriteIds);
      } catch (error) {
        console.error("Error al cargar favoritos:", error);
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
      alert("Debe iniciar sesión para gestionar favoritos");
      return;
    }

    // Encontrar userId de la misma manera que en loadUserFavorites
    const userId = userValidatedInfo.user?.id ?? userValidatedInfo.id;
    if (!userId) {
      console.error("No se pudo encontrar userId para toggleFavorite");
      alert("Error: No se pudo identificar al usuario");
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
              push: false,
            },
          });
          const newFavorites = new Set(favorites);
          newFavorites.add(stationId);
          setFavorites(newFavorites);
        } catch (addError) {
          // Si el error es porque ya existe, actualizar el estado local
          if (
            addError instanceof Error &&
            addError.message.includes("favoritos")
          ) {
            const newFavorites = new Set(favorites);
            newFavorites.add(stationId);
            setFavorites(newFavorites);
            alert("Esta estación ya está en favoritos");
          } else {
            throw addError;
          }
        }
      }
    } catch (error) {
      console.error("Error al gestionar favorito:", error);
      alert("Error al actualizar favoritos. Por favor, intente de nuevo.");
    } finally {
      // Remover del loading state
      const newLoadingFavorites = new Set(loadingFavorites);
      newLoadingFavorites.delete(stationId);
      setLoadingFavorites(newLoadingFavorites);
    }
  };

  // Wrapper para onTimeChange que también actualiza el estado local
  const handleTimeChange = (time: string) => {
    setCurrentTime(time);
    onTimeChange(time);
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
        const popupContent = document.createElement("div");
        popupContent.className = "p-2";
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

          // Para WMS 1.3.0 con EPSG:4326, el orden del BBOX es: miny,minx,maxy,maxx (lat,lon,lat,lon)
          const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

          // Verificar que tengamos el tiempo (desde el estado o desde la capa)
          const timeToUse = currentTime || layer.time;

          const params = new URLSearchParams({
            SERVICE: "WMS",
            VERSION: layer.version || "1.3.0",
            REQUEST: "GetFeatureInfo",
            LAYERS: layer.layers,
            QUERY_LAYERS: layer.layers,
            STYLES: layer.styles || "",
            BBOX: bbox,
            WIDTH: size.x.toString(),
            HEIGHT: size.y.toString(),
            CRS: "EPSG:4326",
            FORMAT: "image/png",
            TRANSPARENT: "true",
            INFO_FORMAT: "application/json",
            FEATURE_COUNT: "1",
            I: Math.floor(point.x).toString(),
            J: Math.floor(point.y).toString(),
          });

          // Agregar parámetros adicionales si existen
          if (timeToUse) {
            params.append("TIME", timeToUse);
          }

          const url = `${layer.url}?${params.toString()}`;
          const response = await fetch(url);
          const data = await response.json();

          let pixelValue = "Sin datos";

          if (data.features && data.features.length > 0) {
            const properties = data.features[0].properties;
            const grayIndex = properties.GRAY_INDEX;

            if (grayIndex !== null && grayIndex !== undefined) {
              // GRAY_INDEX contiene el valor real del pixel
              pixelValue = Number(grayIndex).toFixed(2);
            }
          }

          // Determinar la unidad a mostrar
          const unit = layer.unit || "";

          // Actualizar el contenido del popup
          popupContent.innerHTML = `
            <h3 class="font-semibold text-sm mb-2">Valor del píxel</h3>
            <div class="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <span class="text-sm">📍</span>
              <p>${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
            </div>
            <p class="text-sm font-medium text-gray-800">
              Valor: ${pixelValue}${unit ? " " + unit : ""}
            </p>
          `;
        } catch (error) {
          console.error("Error al obtener información del píxel:", error);
          popupContent.innerHTML = `
            <h3 class="font-semibold text-sm mb-2">Valor del píxel</h3>
            <div class="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <span class="text-sm">📍</span>
              <p>${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
            </div>
            <p class="text-sm text-red-600">Error al cargar datos</p>
          `;
        }
      },
    });

    return null;
  };

  // Función para formatear los datos de la estación para mostrar en el popup
  const renderStationData = (station: Station) => {
    const data = stationData[station.id.toString()];
    const hasData = data && data.length > 0;

    // Obtener la fecha formateada si hay datos
    const dateFormatted = hasData
      ? new Date(data[0].date).toLocaleDateString()
      : "N/A";

    // Mapeo de medidas a iconos y configuración
    const measureConfig: Record<
      string,
      { label?: string; unit?: string; icon?: any }
    > = {
      Tmax: {
        label: "Temperatura máxima",
        unit: "°C",
        icon: faTemperatureArrowUp,
      },
      Tmin: {
        label: "Temperatura mínima",
        unit: "°C",
        icon: faTemperatureArrowDown,
      },
      Prec: { label: "Precipitación", unit: "mm", icon: faCloudRain },
      Rad: { label: "Radiación solar", unit: "MJ/m²", icon: faSun },
      Cmax: { label: "Caudal máximo diario", unit: "mm³/seg", icon: faWater },
      Cmin: { label: "Caudal mínimo diario", unit: "mm³/seg", icon: faTint },
      Cmed: {
        label: "Caudal medio diario",
        unit: "mm³/seg",
        icon: faWaveSquare,
      },
    };

    // Helper map to translate english names when short names don't match
    const englishToSpanish: Record<string, string> = {
      "maximum temperature": "Temperatura máxima",
      "minimum temperature": "Temperatura mínima",
      precipitation: "Precipitación",
      "solar radiation": "Radiación solar",
      "caudal mínimo diario": "Caudal mínimo diario",
      "caudal máximo diario": "Caudal máximo diario",
      "caudal medio diario": "Caudal medio diario",
    };

    // Get the icon matching a text description if the short name didn't match via config
    const getFallbackIcon = (label: string): any => {
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes("caudal máximo")) return faWater;
      if (lowerLabel.includes("caudal mínimo")) return faTint;
      if (lowerLabel.includes("caudal medio")) return faWaveSquare;
      if (lowerLabel.includes("caudal")) return faWater;
      if (lowerLabel.includes("temperatur") && lowerLabel.includes("mínim"))
        return faTemperatureArrowDown;
      if (lowerLabel.includes("temperatur")) return faTemperatureArrowUp;
      if (lowerLabel.includes("precipita") || lowerLabel.includes("lluvia"))
        return faCloudRain;
      if (lowerLabel.includes("radiac")) return faSun;
      return null;
    };

    return (
      <div className="flex flex-col">
        <div className="flex justify-between items-center text-sm text-gray-700 mb-2">
          <span>
            Última fecha: <span className="font-medium">{dateFormatted}</span>
          </span>
        </div>

        <h4 className="font-semibold text-sm text-brand-green mb-1 uppercase tracking-wider">
          Resumen de datos
        </h4>

        <div className="flex flex-col gap-1">
          {!hasData ? (
            <p className="text-gray-500 text-sm italic">
              No hay datos disponibles
            </p>
          ) : (
            data.map((item: any, index: number) => {
              const config = measureConfig[item.measure_short_name];
              let label =
                config?.label || item.measure_name || item.measure_short_name;
              let unit = config?.unit || item.measure_unit || "";
              let icon = config?.icon;

              // Force translation if needed
              if (englishToSpanish[label.toLowerCase()]) {
                label = englishToSpanish[label.toLowerCase()];
              }

              // Try fallback icon if not found by short name
              if (!icon) {
                icon = getFallbackIcon(label);
              }

              // Override unit specifically for caudal to be formatted correctly
              if (
                label.toLowerCase().includes("caudal") &&
                (unit.includes("m^3") || unit.includes("mm^3"))
              ) {
                unit = unit.replace("^3", "³");
              }

              return (
                <div key={index} className="flex items-center text-sm mt-1">
                  <div className="w-5 flex-shrink-0 flex justify-center text-brand-green opacity-80 mr-2">
                    {icon ? (
                      <FontAwesomeIcon icon={icon} className="text-sm" />
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-brand-green opacity-40"></span>
                    )}
                  </div>
                  <div className="flex justify-between w-full">
                    <span className="text-gray-700">{label}:</span>
                    <span className="font-medium ml-2 text-right">
                      {Number(item.value).toFixed(1)} {unit}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative h-full w-full"
      style={{
        cursor: wmsLayers.length > 0 && !showMarkers ? "crosshair" : "grab",
      }}
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        bounds={bounds}
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

        {/* Capas WMS climáticas (raster) - se dibujan primero */}
        {/* Solo renderizar WMSTileLayer si showTimeline es false, ya que el timeline crea su propia capa */}
        {wmsLayers.length > 0 &&
          !showTimeline &&
          wmsLayers.map((layer, index) => (
            <WMSTileLayer
              key={`wms-${index}`}
              url={layer.url}
              layers={layer.layers}
              format={layer.format || "image/png"}
              transparent={layer.transparent !== false}
              version={layer.version || "1.3.0"}
              opacity={layer.opacity !== undefined ? layer.opacity : 1.0}
              styles={layer.styles || ""}
              attribution={layer.attribution || ""}
              params={
                {
                  ...(layer.time && { time: layer.time }),
                  ...(layer.cql_filter && { cql_filter: layer.cql_filter }),
                } as any
              }
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
            onTimeChange={handleTimeChange}
            wmsUrl={wmsLayers[0].url}
            opacity={
              wmsLayers[0].opacity !== undefined ? wmsLayers[0].opacity : 1.0
            }
            displayFormat={displayFormat}
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

        {showMarkers &&
          hasStations &&
          !singleStationMode &&
          activeStations.map((station) => {
            const markerColor = station.source_name
              ? sourceColorMap[station.source_name]
              : ACCESSIBLE_COLORS[0];

            return (
              <Marker
                key={station.id}
                position={
                  [station.latitude, station.longitude] as LatLngExpression
                }
                icon={createColoredIcon(markerColor)}
                ref={(ref) => {
                  if (ref) {
                    markersRef.current.set(station.id.toString(), ref);
                  }
                }}
              >
                <Popup>
                  <div className="p-4 min-w-[280px]">
                    <div className="border-b border-gray-200">
                      <h3 className="font-semibold text-lg text-brand-green">
                        {station.name}
                      </h3>
                      <p className="text-gray-600 flex items-center text-sm !m-0 !p-0">
                        <FontAwesomeIcon
                          icon={faMapMarkerAlt}
                          className="text-sm mr-1"
                        />
                        {station.admin1_name}, {station.admin2_name}
                      </p>
                    </div>

                    <div className="mb-3">
                      {/* Mostrar datos de la última fecha disponible */}
                      {renderStationData(station)}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2">
                      <button
                        onClick={(e) =>
                          toggleFavorite(station.id.toString(), e)
                        }
                        disabled={
                          loadingFavorites.has(station.id.toString()) ||
                          !authenticated
                        }
                        className={`flex items-center justify-center text-xs px-3 py-2 border rounded-md transition-colors ${
                          favorites.has(station.id.toString())
                            ? "text-yellow-600 border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
                            : "text-gray-600 border-gray-300 hover:text-gray-800 hover:bg-gray-50"
                        } ${
                          loadingFavorites.has(station.id.toString()) ||
                          !authenticated
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
                            fill={
                              favorites.has(station.id.toString())
                                ? "currentColor"
                                : "none"
                            }
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                        {!authenticated
                          ? "Iniciar sesión"
                          : favorites.has(station.id.toString())
                            ? "Guardado"
                            : "Favorito"}
                      </button>

                      <Link
                        className="flex items-center justify-center text-sm px-4 py-2 bg-[#C27830] !text-white rounded-lg hover:bg-[#A96627] transition-colors font-medium"
                        href={`/m/${station.machine_name}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FontAwesomeIcon icon={faChartPie} className="mr-2" />
                        Datos
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {showMarkers &&
          singleStationMode &&
          activeStations.map((station) => {
            const markerColor = station.source_name
              ? sourceColorMap[station.source_name]
              : ACCESSIBLE_COLORS[0];

            return (
              <Marker
                key={station.id}
                position={
                  [station.latitude, station.longitude] as LatLngExpression
                }
                icon={createColoredIcon(markerColor)}
                ref={(ref) => {
                  if (ref) {
                    markersRef.current.set(station.id.toString(), ref);
                  }
                }}
              />
            );
          })}

        {/* Leyenda de fuentes - solo mostrar cuando hay estaciones con marcadores */}
        {showMarkers &&
          hasStations &&
          Object.keys(sourceColorMap).length > 0 && (
            <MapLegend
              position="topright"
              title="Fuentes de datos "
              maxHeight="200px"
            >
              <div className="space-y-1">
                {Object.entries(sourceColorMap).map(([source, color]) => (
                  <div key={source} className="flex items-center gap-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth="0.5"
                      />
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
