"use client";

import { MapPin, Thermometer, CloudRain, Sun, Heart } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useCountry } from "@/app/contexts/CountryContext";
import { useEffect, useState } from "react";
import { getUserStations } from "@/app/services/userService";
import { stationService } from "@/app/services/stationService";
import { monitoryService } from "@/app/services/monitoryService";
import { Station } from "@/app/types/Station";
import Link from "next/link";

interface StationData {
  id: string;
  name: string;
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
        const favoriteStationIds = new Set(userStations.map(s => s.ws_ext_id));
        
        const stationsWithData = await Promise.all(
          allStations
            .filter((station: Station) => favoriteStationIds.has(station.id.toString()))
            .slice(0, 3) // Mostrar máximo 3 estaciones
            .map(async (station: Station) => {
              try {
                const latestData = await monitoryService.getLatestDailyData(station.id.toString());
                
                const dataByMeasure: Record<string, number> = {};
                latestData.forEach((item: any) => {
                  dataByMeasure[item.measure_short_name] = item.value;
                });

                return {
                  id: station.id.toString(),
                  name: station.name,
                  admin1_name: station.admin1_name,
                  admin2_name: station.admin2_name,
                  country_name: station.country_name,
                  latestData: latestData.length > 0 ? {
                    date: latestData[0].date,
                    tmin: dataByMeasure['Tmin'],
                    tmax: dataByMeasure['Tmax'],
                    prec: dataByMeasure['Prec'],
                    rad: dataByMeasure['Rad'],
                  } : undefined
                };
              } catch (error) {
                console.warn(`Error loading data for station ${station.id}:`, error);
                return {
                  id: station.id.toString(),
                  name: station.name,
                  admin1_name: station.admin1_name,
                  admin2_name: station.admin2_name,
                  country_name: station.country_name,
                };
              }
            })
        );

        setFavoriteStations(stationsWithData);
      } catch (error) {
        console.error('Error loading favorite stations:', error);
        setFavoriteStations([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteStations();
  }, [authenticated, userValidatedInfo, countryId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin datos';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  if (!authenticated) {
    return (
      <div className="relative overflow-hidden bg-[#283618] text-amber-50 p-6 rounded-2xl shadow-lg max-w-sm">
        <div className="relative z-10 text-center py-8">
          <Heart className="mx-auto mb-4 text-amber-50" size={48} />
          <p className="text-lg font-medium">Inicia sesión para ver tus estaciones favoritas</p>
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
          <Heart className="mx-auto mb-4 text-amber-50" size={48} />
          <p className="text-lg font-medium mb-2">No tienes estaciones favoritas</p>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {favoriteStations.map((station) => (
        <Link
          key={station.id}
          href={`/monitory/${station.id}`}
          className="block transition-transform hover:scale-105"
        >
          <div className="relative overflow-hidden bg-[#283618] text-amber-50 p-6 rounded-2xl shadow-lg">
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

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{station.name}</h3>
                  <div className="flex items-center text-amber-50 text-sm gap-1">
                    <MapPin size={14} />
                    <span>{station.admin2_name}, {station.admin1_name}</span>
                  </div>
                </div>
                <div className="text-right text-sm text-amber-50">
                  {station.latestData ? formatDate(station.latestData.date) : 'Sin datos'}
                </div>
              </div>

              {station.latestData ? (
                <div className="space-y-2">
                    {(station.latestData.tmin !== undefined || station.latestData.tmax !== undefined) && (
                      <div className="flex items-center gap-3">
                        <Thermometer className="text-amber-50" size={18} />
                        <span className="text-sm">
                          {station.latestData.tmin?.toFixed(1) || '--'} °C - {station.latestData.tmax?.toFixed(1) || '--'} °C
                        </span>
                      </div>
                    )}
                    {station.latestData.prec !== undefined && (
                      <div className="flex items-center gap-3">
                        <CloudRain className="text-amber-50" size={18} />
                        <span className="text-sm">{station.latestData.prec.toFixed(1)} mm</span>
                      </div>
                    )}
                    {station.latestData.rad !== undefined && (
                      <div className="flex items-center gap-3">
                        <Sun className="text-amber-50" size={18} />
                        <span className="text-sm">{station.latestData.rad.toFixed(1)} MJ/m²</span>
                      </div>
                    )}
                  </div>
              ) : (
                <div className="text-sm text-amber-200 mt-4">
                  Sin datos disponibles
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default WeatherCard;
