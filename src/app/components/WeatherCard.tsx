"use client";

import { MapPin, Thermometer, CloudRain, Sun, Star } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useCountry } from "@/app/contexts/CountryContext";
import { SHOW_USERS_MODULE } from "@/app/config";
import { useEffect, useState } from "react";
import { getUserStations } from "@/app/services/userService";
import { stationService } from "@/app/services/stationService";
import { monitoryService } from "@/app/services/monitoryService";
import { Station } from "@/app/types/Station";
import Link from "next/link";

interface StationData {
  id: string;
  name: string;
  machine_name: string;
  admin1_name: string;
  admin2_name: string;
  country_name: string;
  latestData?: {
    date: string;
    tmin?: number;
    tmax?: number;
    prec?: number;
    rad?: number;
  };
}

const WeatherCard = () => {
  const { authenticated, userValidatedInfo } = useAuth();
  const { countryId } = useCountry();
  const [favoriteStations, setFavoriteStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFavoriteStations = async () => {
      if (!authenticated || !userValidatedInfo || !countryId) {
        setFavoriteStations([]);
        return;
      }

      try {
        setLoading(true);
        const userId = userValidatedInfo.id;

        // Obtener IDs de estaciones favoritas
        const userStations = await getUserStations(userId);

        if (userStations.length === 0) {
          setFavoriteStations([]);
          return;
        }

        // Obtener información completa de cada estación
        const allStations = await stationService.getAll(countryId);
        const favoriteStationIds = new Set(
          userStations.map((s) => s.ws_ext_id),
        );

        const stationsWithData = await Promise.all(
          allStations
            .filter((station: Station) =>
              favoriteStationIds.has(station.id.toString()),
            )
            .slice(0, 3) // Mostrar máximo 3 estaciones
            .map(async (station: Station) => {
              try {
                const latestData = await monitoryService.getLatestDailyData(
                  station.id.toString(),
                );

                const dataByMeasure: Record<string, number> = {};
                latestData.forEach((item: any) => {
                  dataByMeasure[item.measure_short_name] = item.value;
                });

                return {
                  id: station.id.toString(),
                  name: station.name,
                  machine_name: station.machine_name,
                  admin1_name: station.admin1_name,
                  admin2_name: station.admin2_name,
                  country_name: station.country_name,
                  latestData:
                    latestData.length > 0
                      ? {
                          date: latestData[0].date,
                          tmin: dataByMeasure["Tmin"],
                          tmax: dataByMeasure["Tmax"],
                          prec: dataByMeasure["Prec"],
                          rad: dataByMeasure["Rad"],
                        }
                      : undefined,
                };
              } catch (error) {
                console.warn(
                  `Error loading data for station ${station.id}:`,
                  error,
                );
                return {
                  id: station.id.toString(),
                  name: station.name,
                  machine_name: station.machine_name,
                  admin1_name: station.admin1_name,
                  admin2_name: station.admin2_name,
                  country_name: station.country_name,
                };
              }
            }),
        );

        setFavoriteStations(stationsWithData);
      } catch (error) {
        console.error("Error loading favorite stations:", error);
        setFavoriteStations([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteStations();
  }, [authenticated, userValidatedInfo, countryId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin datos";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Si el módulo de usuarios está deshabilitado, no mostrar nada
  if (!SHOW_USERS_MODULE) {
    return null;
  }

  if (!authenticated) {
    return (
      <div className="relative overflow-hidden bg-[#283618] text-amber-50 p-6 rounded-2xl shadow-lg max-w-sm">
        <div className="relative z-10 text-center py-8">
          <Star className="mx-auto mb-4 text-amber-50" size={48} />
          <p className="text-lg font-medium">
            Inicia sesión para ver tus estaciones favoritas
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-[#283618] text-amber-50 p-6 rounded-2xl shadow-lg max-w-sm">
        <div className="relative z-10 text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-50 mx-auto mb-4"></div>
          <p>Cargando estaciones favoritas...</p>
        </div>
      </div>
    );
  }

  if (favoriteStations.length === 0) {
    return (
      <div className="relative overflow-hidden bg-[#283618] text-amber-50 p-6 rounded-2xl shadow-lg max-w-sm">
        <div className="relative z-10 text-center py-8">
          <Star className="mx-auto mb-4 text-amber-50" size={48} />
          <p className="text-lg font-medium mb-2">
            No tienes estaciones favoritas
          </p>
          <Link
            href="/locations"
            className="text-sm text-amber-200 hover:text-amber-100 underline"
          >
            Explora el mapa para agregar favoritos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6">
      {favoriteStations.map((station) => (
        <Link
          key={station.id}
          href={`/m/${station.machine_name}`}
          className="block transition-transform hover:scale-105 flex-grow md:flex-grow-0 w-full md:w-auto"
        >
          <div className="relative overflow-hidden bg-[#283618] text-amber-50 p-5 rounded-2xl shadow-lg min-w-full md:min-w-[300px] md:max-w-[400px] flex flex-col h-full">
            <div className="absolute top-0 right-0 w-[200px] h-[120px] z-0">
              <svg
                className="absolute -top-5 -right-4"
                width="177"
                height="95"
                viewBox="0 0 355 190"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M385.398 12.4147L0 4.31812C14.6818 32.8181 56.8561 96.2594 104.446 99.3181C141.061 103.276 257.166 119.359 282.031 136.832C311.989 157.883 368.035 187.301 385.398 190V12.4147Z"
                  fill="#364110"
                />
                <path
                  d="M434.517 9.71582L444.503 158.963C357.599 136.832 302.812 121.449 256.932 89.3323C211.051 57.2158 149.787 82.0454 103.097 71.2499C65.7443 62.6135 54.0672 29.6874 52.8977 14.3039L434.517 9.71582Z"
                  fill="#758D33"
                />
                <path
                  d="M398.082 0H32.926C47.6078 28.5 146.458 41.7424 194.048 44.8011C230.663 48.7595 308.102 62.1818 324.943 84.2046C341.784 106.227 380.72 117.131 398.082 119.83V0Z"
                  fill="#C0D259"
                />
              </svg>
            </div>

            <div className="relative z-10 flex-1 flex flex-col h-full">
              <div className="flex justify-between items-start gap-3 mb-3">
                <h3
                  className="font-bold text-lg leading-tight break-words pr-2"
                  title={station.name}
                >
                  {station.name}
                </h3>
                <div className="text-right text-[10px] font-medium text-amber-200 shrink-0 whitespace-nowrap mt-1 bg-black/20 rounded-full px-2 py-0.5">
                  {station.latestData
                    ? formatDate(station.latestData.date)
                    : "Sin datos"}
                </div>
              </div>

              {station.latestData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {(station.latestData.tmin !== undefined ||
                      station.latestData.tmax !== undefined) && (
                      <div className="col-span-2 flex items-center justify-between bg-white/10 p-2.5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Thermometer
                            className="text-amber-300 shrink-0"
                            size={18}
                          />
                          <span className="text-[10px] text-amber-100 uppercase font-semibold">
                            T. Min/Max
                          </span>
                        </div>
                        <span className="text-base font-bold whitespace-nowrap">
                          {station.latestData.tmin?.toFixed(1) || "--"}{" "}
                          <span className="text-xs font-normal text-amber-200">
                            /
                          </span>{" "}
                          {station.latestData.tmax?.toFixed(1) || "--"}{" "}
                          <span className="text-xs font-normal text-amber-200">
                            °C
                          </span>
                        </span>
                      </div>
                    )}

                    {station.latestData.prec !== undefined && (
                      <div className="flex flex-col items-center justify-center bg-white/10 p-2.5 rounded-lg text-center">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <CloudRain className="text-blue-300" size={16} />
                          <span className="text-[10px] text-amber-100 uppercase font-semibold">
                            Precip.
                          </span>
                        </div>
                        <span className="text-base font-bold whitespace-nowrap">
                          {station.latestData.prec.toFixed(1)}{" "}
                          <span className="text-[10px] font-normal text-amber-200">
                            mm
                          </span>
                        </span>
                      </div>
                    )}

                    {station.latestData.rad !== undefined && (
                      <div className="flex flex-col items-center justify-center bg-white/10 p-2.5 rounded-lg text-center">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Sun className="text-yellow-300" size={16} />
                          <span className="text-[10px] text-amber-100 uppercase font-semibold">
                            Rad.
                          </span>
                        </div>
                        <span className="text-base font-bold whitespace-nowrap">
                          {station.latestData.rad.toFixed(1)}{" "}
                          <span className="text-[10px] font-normal text-amber-200">
                            MJ/m²
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 bg-white/5 rounded-lg border border-white/10 mt-3">
                  <div className="text-amber-200 italic text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
                    Sin datos recientes
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-white/5 flex items-end">
                <div className="flex items-center text-amber-100 text-xs gap-1.5 font-medium w-full truncate">
                  <MapPin size={14} className="shrink-0 text-amber-300" />
                  <span
                    className="truncate"
                    title={`${station.admin2_name}, ${station.admin1_name}`}
                  >
                    {station.admin2_name}, {station.admin1_name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default WeatherCard;
