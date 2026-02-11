// app/m/[machine_name]/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { stationService } from "@/app/services/stationService";
import { monitoryService } from "@/app/services/monitoryService";
import { spatialService } from "@/app/services/spatialService";
import { Station } from "@/app/types/Station";
import Link from "next/link";
import ClimateChart from "@/app/components/ClimateChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faMapPin,
  faStar as faStarSolid,
  faFileArrowDown,
  faSatellite,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { useAuth } from "@/app/hooks/useAuth";
import { useCountry } from "@/app/contexts/CountryContext";
import {
  addUserStation,
  deleteUserStation,
  getUserStations,
} from "@/app/services/userService";
import {
  VARIABLE_CONFIG,
  countryCodeMap,
  MONTHS,
  indicatorPeriodOptions,
  getIndicatorColor,
} from "./config";

// Cargar el mapa dinámicamente sin SSR
const MapComponent = dynamic(() => import("@/app/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
    </div>
  ),
});

export default function StationDetailPage() {
  const params = useParams();
  const machine_name = params?.machine_name as string;
  const { countryId } = useCountry();
  const [isClimaticOpen, setIsClimaticOpen] = useState(true);
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(true);
  const [timePeriod, setTimePeriod] = useState<string>("daily");
  const [timePeriodIndicators, setTimePeriodIndicators] =
    useState<string>("monthly");

  // Estados independientes para cada acordeón
  const [filterDatesClimatic, setFilterDatesClimatic] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });
  const [filterDatesIndicators, setFilterDatesIndicators] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });

  const [station, setStation] = useState<Station | null>(null);
  const [stationDates, setStationDates] = useState<any>(null);
  const [DataClimaticDates, setDataClimaticDates] = useState<any>(null);
  const [IndicatorsDates, setIndicatorsDates] = useState<any>(null);

  // Estados para favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  // Estados para comparación satelital
  const [isSatelliteActive, setIsSatelliteActive] = useState(false);
  const [loadingSatellite, setLoadingSatellite] = useState(false);
  const [satelliteData, setSatelliteData] = useState<any>(null);

  const { authenticated, userValidatedInfo } = useAuth();

  // Datos completos sin filtrar (cargados una sola vez)
  const [climateHistoricalDataFull, setClimateHistoricalDataFull] =
    useState<any>(null);
  const [indicatorsDataFull, setIndicatorsDataFull] = useState<any>(null);

  // Datos filtrados para visualización
  const [climateHistoricalData, setClimateHistoricalData] = useState<any>(null);
  const [indicatorsData, setIndicatorsData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Estados para control de búsqueda manual
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Convertir fecha a formato de mes (para climatología)
  const dateToMonthFormat = useCallback((date: string) => {
    if (!date) return "2000-01-01";
    const month = date.split("-")[1];
    return `2000-${month}-01`;
  }, []);

  const monthToDateFormat = useCallback((monthValue: string) => {
    return `2000-${monthValue}-01`;
  }, []);

  // Función para limitar el rango de fechas a máximo 3 años
  const limitDateRangeToYears = useCallback(
    (startDate: string, endDate: string, maxYears: number = 3) => {
      if (!startDate || !endDate) return { start: startDate, end: endDate };

      const start = new Date(startDate);
      const end = new Date(endDate);
      const yearsDiff = end.getFullYear() - start.getFullYear();

      if (yearsDiff <= maxYears) {
        return { start: startDate, end: endDate };
      }

      // Limitar a los últimos 3 años
      const limitedStart = new Date(end);
      limitedStart.setFullYear(end.getFullYear() - maxYears);

      return {
        start: limitedStart.toISOString().split("T")[0],
        end: endDate,
      };
    },
    [],
  );

  const getLast30Days = useCallback((endDate: string) => {
    if (!endDate) return { start: "", end: "" };

    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(end.getDate() - 30);

    return {
      start: start.toISOString().split("T")[0],
      end: endDate,
    };
  }, []);

  // Función para verificar si el rango de fechas es mayor a 3 años
  const isDateRangeTooLarge = useCallback(
    (startDate: string, endDate: string) => {
      if (!startDate || !endDate) return false;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const yearsDiff = end.getFullYear() - start.getFullYear();

      return yearsDiff > 3;
    },
    [],
  );

  // Función para filtrar datos climáticos en el cliente
  const filterClimateData = useCallback(
    (data: any, startDate: string, endDate: string, period: string) => {
      if (!data) return null;

      const filtered: any = {};
      // Para climatología, filtrar por mes (formato 2000-MM-01)
      if (period === "climatology") {
        const startMonth = parseInt(startDate.split("-")[1]);
        const endMonth = parseInt(endDate.split("-")[1]);

        Object.keys(data).forEach((key) => {
          const dates = data[key].dates;
          const values = data[key].values;

          if (!Array.isArray(dates) || !Array.isArray(values)) return;

          // Para climatología, las fechas vienen en formato "2000-MM-01"
          const filteredIndices = dates
            .map((date: string, index: number) => {
              // Extraer el mes de la fecha formato "2000-MM-01"
              const monthIndex = parseInt(date.split("-")[1]);
              return { date, index, monthIndex };
            })
            .filter(({ monthIndex }: { monthIndex: number }) => {
              // Manejar casos donde el rango puede cruzar el año (ej: Oct-Feb)
              if (startMonth <= endMonth) {
                return monthIndex >= startMonth && monthIndex <= endMonth;
              } else {
                return monthIndex >= startMonth || monthIndex <= endMonth;
              }
            });

          filtered[key] = {
            dates: filteredIndices.map(({ date }: { date: string }) => date),
            values: filteredIndices.map(
              ({ index }: { index: number }) => values[index],
            ),
          };
        });
      } else {
        // Para daily y monthly, filtrar por fecha
        Object.keys(data).forEach((key) => {
          const dates = data[key].dates;
          const values = data[key].values;

          if (!Array.isArray(dates) || !Array.isArray(values)) return;

          const filteredIndices = dates
            .map((date: string, index: number) => ({ date, index }))
            .filter(
              ({ date }: { date: string }) =>
                date >= startDate && date <= endDate,
            );

          filtered[key] = {
            dates: filteredIndices.map(({ date }: { date: string }) => date),
            values: filteredIndices.map(
              ({ index }: { index: number }) => values[index],
            ),
          };
        });
      }

      return filtered;
    },
    [],
  );

  // Función para filtrar datos de indicadores en el cliente
  const filterIndicatorsData = useCallback(
    (data: any, startDate: string, endDate: string) => {
      if (!data) return null;

      const filtered: any = {};
      Object.keys(data).forEach((key) => {
        const indicator = data[key];
        const dates = indicator.dates;
        const values = indicator.values;

        const filteredIndices = dates
          .map((date: string, index: number) => ({ date, index }))
          .filter(
            ({ date }: { date: string }) =>
              date >= startDate && date <= endDate,
          );

        filtered[key] = {
          name: indicator.name,
          unit: indicator.unit,
          dates: filteredIndices.map(({ date }: { date: string }) => date),
          values: filteredIndices.map(
            ({ index }: { index: number }) => values[index],
          ),
        };
      });

      return filtered;
    },
    [],
  );

  // Función para obtener datos satelitales
  const toggleSatelliteComparison = useCallback(async () => {
    if (!station || !filterDatesClimatic.start || !filterDatesClimatic.end) {
      return;
    }

    setLoadingSatellite(true);

    try {
      if (isSatelliteActive) {
        // Desactivar comparación
        setIsSatelliteActive(false);
        setSatelliteData(null);
      } else {
        // Al activar comparación satelital, limitar a máximo 3 años
        const limitedDates = limitDateRangeToYears(
          filterDatesClimatic.start,
          filterDatesClimatic.end,
          3,
        );

        // Actualizar las fechas del filtro climático a este rango limitado
        setFilterDatesClimatic({
          start: limitedDates.start,
          end: limitedDates.end,
        });

        // Obtener código de país dinámicamente
        const countryCode = countryCodeMap[countryId || "2"] || "hn";

        // Construir workspace dinámico basado en el período
        const workspace = `climate_historical_${timePeriod}`;

        // Obtener datos satelitales para todas las variables disponibles EN PARALELO
        const satelliteDataByVariable: any = {};

        // Mapeo de variables a sufijos espaciales
        const variableMapping: { [key: string]: string } = {
          prec: "prec",
          Prec: "prec",
          precipitation: "prec",
          t_max: "tmax",
          tmax: "tmax",
          T_Max: "tmax",
          t_min: "tmin",
          tmin: "tmin",
          T_Min: "tmin",
          sol_rad: "srad",
          srad: "srad",
          Solar_Rad: "srad",
        };

        // Obtener las variables que actualmente tienen datos climáticos
        const availableVariables = climateHistoricalDataFull
          ? Object.keys(climateHistoricalDataFull)
          : [];

        // Crear todas las promesas para llamadas en paralelo
        const satellitePromises = availableVariables
          .map((varKey) => {
            const spatialVar = variableMapping[varKey];
            if (spatialVar) {
              // Construir store dinámico para esta variable
              const store = `climate_historical_${timePeriod}_${countryCode}_${spatialVar}`;

              return spatialService
                .getPointData({
                  coordinates: [[station.longitude, station.latitude]],
                  start_date: limitedDates.start,
                  end_date: limitedDates.end,
                  workspace: workspace,
                  store: store,
                  temporality:
                    timePeriod === "climatology" ? "monthly" : timePeriod,
                })
                .then((response) => ({
                  varKey,
                  data: response.data,
                }))
                .catch((error) => {
                  console.warn(
                    `No hay datos satelitales disponibles para ${varKey}:`,
                    error,
                  );
                  return { varKey, data: null };
                });
            }
            return Promise.resolve({ varKey, data: null });
          })
          .filter(Boolean); // Filtrar nulls

        // Ejecutar todas las llamadas en paralelo
        const results = await Promise.all(satellitePromises);

        // Procesar resultados
        results.forEach((result) => {
          if (result.data && result.data.length > 0) {
            satelliteDataByVariable[result.varKey] = result.data;
          }
        });

        setSatelliteData(satelliteDataByVariable);
        setIsSatelliteActive(true);
      }
    } catch (error) {
      console.error("Error en comparación satelital:", error);
      setIsSatelliteActive(false);
      setSatelliteData(null);
    } finally {
      setLoadingSatellite(false);
    }
  }, [
    station,
    filterDatesClimatic.start,
    filterDatesClimatic.end,
    timePeriod,
    isSatelliteActive,
    countryId,
    limitDateRangeToYears,
    climateHistoricalDataFull,
  ]);

  // Datos de gráficos climáticos procesados y limitados
  const climateChartsData = useMemo(() => {
    if (!climateHistoricalData) return null;

    const maxPoints = 1000; // Limitar a 1000 puntos para rendimiento
    const charts: any = {};

    // Procesar todas las variables que existen en los datos
    Object.keys(climateHistoricalData).forEach((varKey) => {
      const varData = climateHistoricalData[varKey];
      const config = VARIABLE_CONFIG[varKey];

      if (varData && varData.dates && varData.values && config) {
        let { dates, values } = varData;

        // Obtener el rango total de fechas de los datos completos (no filtrados)
        const fullVarData = climateHistoricalDataFull?.[varKey];
        const totalMinDate =
          fullVarData?.dates?.length > 0 ? fullVarData.dates[0] : null;
        const totalMaxDate =
          fullVarData?.dates?.length > 0
            ? fullVarData.dates[fullVarData.dates.length - 1]
            : null;

        // Si hay demasiados datos, hacer muestreo uniforme
        if (dates.length > maxPoints) {
          const step = Math.floor(dates.length / maxPoints);
          const sampledDates = [];
          const sampledValues = [];

          for (let i = 0; i < dates.length; i += step) {
            sampledDates.push(dates[i]);
            sampledValues.push(values[i]);
          }

          // Asegurar que se incluya el último punto
          if (
            sampledDates[sampledDates.length - 1] !== dates[dates.length - 1]
          ) {
            sampledDates.push(dates[dates.length - 1]);
            sampledValues.push(values[values.length - 1]);
          }

          dates = sampledDates;
          values = sampledValues;
        }

        // Preparar datasets base
        const datasets = [
          {
            label: "Datos estación",
            color: config.color,
            data: values,
            dates: dates,
          },
        ];

        // Agregar datos satelitales si están disponibles para esta variable
        if (isSatelliteActive && satelliteData && satelliteData[varKey]) {
          // Crear un mapa de fechas de la estación para matching rápido
          const stationDateMap = new Set(dates);

          // Obtener el rango de valores de la estación para referencia
          const stationValues = values.filter((v) => v != null && isFinite(v));
          const maxStationValue = Math.max(...stationValues, 0);
          const minStationValue = Math.min(...stationValues, 0);
          const avgStationValue =
            stationValues.length > 0
              ? stationValues.reduce((a, b) => a + b, 0) / stationValues.length
              : 0;

          // Filtrar y mapear datos satelitales que coincidan con las fechas de la estación
          const matchedSatelliteData = satelliteData[varKey]
            .filter((item: any) => {
              if (
                !stationDateMap.has(item.date) ||
                typeof item.value !== "number" ||
                !isFinite(item.value)
              ) {
                return false;
              }

              let value = Number(item.value);

              // Filtros específicos por tipo de variable
              if (
                varKey === "prec" ||
                varKey === "Prec" ||
                varKey === "precipitation"
              ) {
                // Para precipitación: valores no negativos y razonables
                return value >= 0 && value < 1000;
              } else if (
                varKey.includes("temp") ||
                varKey.includes("t_max") ||
                varKey.includes("t_min") ||
                varKey.includes("T_Max") ||
                varKey.includes("T_Min")
              ) {
                // Para temperatura: rango razonable (-50°C a 60°C)
                return value >= -50 && value <= 60;
              } else if (
                varKey.includes("sol_rad") ||
                varKey.includes("srad") ||
                varKey.includes("Solar_Rad")
              ) {
                // Para radiación solar: valores no negativos y razonables
                return value >= 0 && value <= 50;
              } else {
                // Para otras variables: filtro general
                return isFinite(value);
              }
            })
            .sort(
              (a: any, b: any) =>
                new Date(a.date).getTime() - new Date(b.date).getTime(),
            );

          if (matchedSatelliteData.length > 0) {
            // Crear arrays paralelos para fechas y valores satelitales
            const satelliteDates = matchedSatelliteData.map(
              (item: any) => item.date,
            );
            const satelliteValues = matchedSatelliteData.map((item: any) => {
              let value = Number(item.value);

              // Procesamiento específico por tipo de variable
              if (
                varKey === "prec" ||
                varKey === "Prec" ||
                varKey === "precipitation"
              ) {
                // Para precipitación: conversión de unidades si es necesario
                while (value > 1000 && value > maxStationValue * 10) {
                  value = value / 1000;
                }
                // Si después de la conversión el valor sigue siendo muy alto
                if (value > maxStationValue * 5) {
                  value = value / 1000;
                }
                value = Math.max(0, value);
              }

              // Redondear para evitar decimales excesivos
              return Math.round(value * 100) / 100;
            });

            // Solo agregar si hay valores válidos después del procesamiento
            if (satelliteValues.length > 0) {
              datasets.push({
                label: "Datos satelitales",
                color: "#FF6B6B",
                data: satelliteValues,
                dates: satelliteDates,
              });
            }
          }
        }

        charts[varKey] = {
          title: config.title,
          unit: config.unit,
          color: config.color,
          chartType: config.chartType || "line",
          totalDateRange: { minDate: totalMinDate, maxDate: totalMaxDate }, // Rango total disponible
          datasets: datasets,
        };
      }
    });

    return Object.keys(charts).length > 0 ? charts : null;
  }, [
    climateHistoricalData,
    climateHistoricalDataFull,
    isSatelliteActive,
    satelliteData,
  ]);

  // Efecto para cargar datos de la estación (solo una vez al montar)
  useEffect(() => {
    const fetchStation = async () => {
      try {
        setLoading(true);
        const stationData = await stationService.getByMachineName(machine_name);
        setStation(stationData[0]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error loading station data",
        );
      } finally {
        setLoading(false);
      }
    };

    if (machine_name) {
      fetchStation();
    }
  }, [machine_name]);

  // Efecto para cargar estado de favorito
  useEffect(() => {
    const checkFavorite = async () => {
      if (!authenticated || !userValidatedInfo || !station) {
        return;
      }

      try {
        const userId = userValidatedInfo.id;
        const userStations = await getUserStations(userId);
        // Usar el mismo ID que MapComponent: station.id (location_id en backend)
        const stationId = station.id?.toString() || "";
        const isFav = userStations.some(
          (s) =>
            (s.location_id?.toString() || s.ws_ext_id?.toString() || "") ===
            stationId,
        );
        setIsFavorite(isFav);
      } catch (error) {
        console.error("Error al verificar favorito:", error);
      }
    };

    checkFavorite();
  }, [authenticated, userValidatedInfo, station]);

  // Handler para agregar/eliminar favorito
  const toggleFavorite = async () => {
    if (!authenticated || !userValidatedInfo) {
      return;
    }

    if (!station) {
      return;
    }

    setLoadingFavorite(true);

    try {
      const userId = userValidatedInfo.id;
      // Usar station.id igual que MapComponent
      const stationId = station.id?.toString() || "";

      if (isFavorite) {
        await deleteUserStation(userId, stationId);
        setIsFavorite(false);
      } else {
        await addUserStation(userId, {
          ws_ext_id: stationId,
          notification: {
            email: true,
            push: false,
          },
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error al gestionar favorito:", error);
      // Si el error es porque ya existe, actualizar el estado
      if (error instanceof Error && error.message.includes("favoritos")) {
        setIsFavorite(true);
      }
    } finally {
      setLoadingFavorite(false);
    }
  };

  // Efecto para cargar rangos de fechas cuando cambia el período
  useEffect(() => {
    if (station) {
      const fetchDates = async () => {
        try {
          const dates = await monitoryService.getStationDates(
            station.id.toString(),
            timePeriod,
            false,
          );
          setDataClimaticDates({ ...dates, _period: timePeriod });

          const datesIndicators = await monitoryService.getStationDates(
            station.id.toString(),
            timePeriodIndicators,
            true,
          );
          setIndicatorsDates({
            ...datesIndicators,
            _period: timePeriodIndicators,
          });

          // Obtener la fecha mínima y máxima entre ambos objetos
          if (
            dates.minDate &&
            dates.maxDate &&
            datesIndicators.minDate &&
            datesIndicators.maxDate
          ) {
            const minDate =
              new Date(dates.minDate) < new Date(datesIndicators.minDate)
                ? dates.minDate
                : datesIndicators.minDate;
            const maxDate =
              new Date(dates.maxDate) > new Date(datesIndicators.maxDate)
                ? dates.maxDate
                : datesIndicators.maxDate;
            setStationDates({ minDate, maxDate });
          }

          // SIEMPRE resetear filtros cuando cambia el período
          if (timePeriod === "climatology") {
            const start = dateToMonthFormat(dates.minDate || "2000-01-01");
            const end = dateToMonthFormat("2000-12-01");
            setFilterDatesClimatic({ start, end });
          } else {
            // Cargar inicialmente los últimos 30 días del dato disponible
            const last30Days = getLast30Days(dates.maxDate || "");
            setFilterDatesClimatic({
              start: last30Days.start,
              end: last30Days.end,
            });
          }

          // Resetear filtros de indicadores - también últimos 30 días para consistencia
          const last30DaysIndicators = getLast30Days(
            datesIndicators.maxDate || "",
          );
          setFilterDatesIndicators({
            start: last30DaysIndicators.start,
            end: last30DaysIndicators.end,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error loading dates");
        }
      };

      fetchDates();
    }
  }, [
    station,
    timePeriod,
    timePeriodIndicators,
    dateToMonthFormat,
    getLast30Days,
  ]);

  // Al cambiar el período climático, limpiar de inmediato los datos para evitar parpadeo de gráficos anteriores
  useEffect(() => {
    setLoadingCharts(true);
    setClimateHistoricalData(null);
    setClimateHistoricalDataFull(null);
  }, [timePeriod]);

  // Al cambiar el período de indicadores, limpiar de inmediato los datos mostrados para evitar parpadeo
  useEffect(() => {
    setIndicatorsData(null);
    setIndicatorsDataFull(null);
  }, [timePeriodIndicators]);

  // Efecto para cargar datos climáticos COMPLETOS cuando cambian las fechas calculadas para el período actual
  useEffect(() => {
    if (station) {
      const fetchClimateData = async () => {
        try {
          if (!DataClimaticDates?.minDate || !DataClimaticDates?.maxDate) {
            return;
          }
          // Evitar llamadas con fechas de un período distinto al seleccionado
          if (DataClimaticDates?._period !== timePeriod) {
            return;
          }

          setLoadingCharts(true);

          const climateHistorical = await monitoryService.getClimateHistorical(
            station.id.toString(),
            timePeriod,
            DataClimaticDates.minDate,
            DataClimaticDates.maxDate,
          );

          setClimateHistoricalDataFull(climateHistorical);
        } catch (err) {
          console.error("Error loading climate data:", err);
          setClimateHistoricalDataFull(null);
        } finally {
          setLoadingCharts(false);
        }
      };
      fetchClimateData();
    }

    
  }, [
    station,
    DataClimaticDates?.minDate,
    DataClimaticDates?.maxDate,
    DataClimaticDates?._period,
    timePeriod,
  ]);

  // Efecto para filtrar datos climáticos cuando se hace búsqueda manual O cuando hay datos completos iniciales
  useEffect(() => {
    if (
      !climateHistoricalDataFull ||
      !filterDatesClimatic.start ||
      !filterDatesClimatic.end
    ) {
      setClimateHistoricalData(null);
      return;
    }

    // Para búsquedas manuales (no carga inicial), aplicar límite de 3 años
    if (searchTrigger > 0) {
      const limitedDates = limitDateRangeToYears(
        filterDatesClimatic.start,
        filterDatesClimatic.end,
      );
      if (
        limitedDates.start !== filterDatesClimatic.start ||
        limitedDates.end !== filterDatesClimatic.end
      ) {
        setFilterDatesClimatic(limitedDates);
        return;
      }
    }

    // Añadir un pequeño delay para evitar actualizaciones muy rápidas
    const timeoutId = setTimeout(() => {
      const filtered = filterClimateData(
        climateHistoricalDataFull,
        filterDatesClimatic.start,
        filterDatesClimatic.end,
        timePeriod,
      );
      setClimateHistoricalData(filtered);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    climateHistoricalDataFull,
    searchTrigger,
    timePeriod,
    filterClimateData,
    limitDateRangeToYears,
  ]);

  // Efecto para cargar datos de indicadores COMPLETOS cuando cambian las fechas calculadas para el período actual
  useEffect(() => {
    const fetchIndicatorsData = async () => {
      try {
        if (!IndicatorsDates?.minDate || !IndicatorsDates?.maxDate) return;
        if (IndicatorsDates?._period !== timePeriodIndicators) return;

        const indicators = await monitoryService.getIndicatorsHistorical(
          machine_name,
          timePeriodIndicators,
          IndicatorsDates.minDate,
          IndicatorsDates.maxDate,
        );
        setIndicatorsDataFull(indicators);
      } catch (err) {
        console.error("Error loading indicators data:", err);
        setIndicatorsDataFull(null);
      }
    };

    fetchIndicatorsData();
  }, [
    machine_name,
    IndicatorsDates?.minDate,
    IndicatorsDates?.maxDate,
    IndicatorsDates?._period,
    timePeriodIndicators,
  ]);

  // Efecto para filtrar datos de indicadores cuando cambian los filtros
  useEffect(() => {
    if (
      !indicatorsDataFull ||
      !filterDatesIndicators.start ||
      !filterDatesIndicators.end
    ) {
      setIndicatorsData(null);
      return;
    }

    // Añadir un pequeño delay para evitar actualizaciones muy rápidas
    const timeoutId = setTimeout(() => {
      const filtered = filterIndicatorsData(
        indicatorsDataFull,
        filterDatesIndicators.start,
        filterDatesIndicators.end,
      );
      setIndicatorsData(filtered);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    indicatorsDataFull,
    filterDatesIndicators.start,
    filterDatesIndicators.end,
    filterIndicatorsData,
  ]);

  // Función para ejecutar búsqueda manual
  const handleSearch = useCallback(() => {
    setSearchTrigger((prev) => prev + 1);
  }, []);

  // Formatear fechas (calcular antes de useEffect/useMemo)
  const startDate = stationDates?.minDate;
  const endDate = stationDates?.maxDate;

  // Generar y descargar PDF bajo demanda cuando el usuario hace clic
  const handleDownloadPDF = async () => {
    if (!station || !hasDataForPDF || pdfLoading) return;
    try {
      setPdfLoading(true);
      // Usar la funcionalidad nativa de impresión del navegador
      // Esto abrirá el diálogo de impresión donde el usuario puede guardar como PDF
      window.print();
    } catch (e) {
      console.error("Error al abrir el diálogo de impresión:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  // Verificar si hay datos suficientes para mostrar el botón PDF
  const hasDataForPDF = useMemo(() => {
    // Verificación exhaustiva de todos los datos necesarios
    if (!station || !startDate || !endDate) return false;

    // Verificar que climateHistoricalData existe y tiene datos válidos
    if (!climateHistoricalData || typeof climateHistoricalData !== "object")
      return false;
    const climateKeys = Object.keys(climateHistoricalData);
    if (climateKeys.length === 0) return false;

    // Verificar que al menos una variable climática tiene datos
    const hasClimateData = climateKeys.some((key) => {
      const item = climateHistoricalData[key];
      return (
        item &&
        Array.isArray(item.dates) &&
        Array.isArray(item.values) &&
        item.dates.length > 0
      );
    });
    if (!hasClimateData) return false;

    // Verificar que indicatorsData existe y tiene datos válidos
    if (!indicatorsData || typeof indicatorsData !== "object") return false;
    const indicatorKeys = Object.keys(indicatorsData);
    if (indicatorKeys.length === 0) return false;

    // Verificar que al menos un indicador tiene datos
    const hasIndicatorData = indicatorKeys.some((key) => {
      const item = indicatorsData[key];
      return (
        item &&
        Array.isArray(item.dates) &&
        Array.isArray(item.values) &&
        item.dates.length > 0
      );
    });
    if (!hasIndicatorData) return false;

    return true;
  }, [station, climateHistoricalData, indicatorsData, startDate, endDate]);

  // Early returns DESPUÉS de todos los hooks
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
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

  if (!station) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Estación no encontrada</p>
          <Link
            href="/"
            className="bg-[#bc6c25] text-white cursor-pointer px-4 py-2 rounded hover:bg-amber-700 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-4 px-2 sm:px-4">
      {/* Encabezado */}
      <header className="bg-white rounded-lg shadow-sm max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Monitoreo
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
            Estación {station?.name || "Desconocida"}
          </h2>
        </div>

        <div className="mb-4">
          <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-2">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-sm" />
            {station?.admin1_name || "N/A"}, {station?.admin2_name || "N/A"}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 flex items-center gap-2">
            <FontAwesomeIcon icon={faMapPin} className="text-sm" />
            {station?.latitude?.toFixed(6) || "N/A"},{" "}
            {station?.longitude?.toFixed(6) || "N/A"}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ms-1">
            Fuente: {station?.source || "N/A"}
          </p>
        </div>

        {/* Línea divisora */}
        <div className="border-t border-gray-200"></div>

        {/* Descripción de la estación */}
        <div className="mt-4 mb-4 text-sm sm:text-base text-gray-700">
          <p>
            La estación meteorológica{" "}
            <strong>{station?.name || "Desconocida"}</strong> está ubicada en{" "}
            <strong>
              {station?.admin2_name || "N/A"}, {station?.country_name || "N/A"}
            </strong>{" "}
            en la latitud{" "}
            <strong>{station?.latitude?.toFixed(4) || "N/A"}</strong> y longitud{" "}
            <strong>{station?.longitude?.toFixed(4) || "N/A"}</strong>, ha
            registrado datos desde el <strong>{startDate}</strong> hasta el{" "}
            <strong>{endDate}</strong>, cubriendo variables clave para el
            monitoreo agroclimático.
          </p>
        </div>

        {/* Mapa */}
        <div className="h-80 rounded-lg overflow-hidden border border-gray-200">
          <MapComponent
            center={[station.latitude, station.longitude]}
            zoom={13}
            stations={[station]}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-4">
        {/* Segunda card - Gráficas y datos */}
        <div>
          <div className="bg-white rounded-lg shadow-sm">
            {/* Acordeones para selección de tipo de datos */}
            <div id="accordion-collapse" data-accordion="collapse">
              {/* Acordeón para Datos climáticos */}
              <div id="climatic-accordion">
                <h2 id="climatic-accordion-trigger">
                  <button
                    type="button"
                    className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-gray-200 hover:bg-gray-100"
                    onClick={() => setIsClimaticOpen(!isClimaticOpen)}
                    aria-expanded={isClimaticOpen}
                  >
                    <span className="text-xl font-semibold text-gray-800">
                      Datos climáticos
                    </span>
                    <svg
                      className={`w-6 h-6 shrink-0 ${isClimaticOpen ? "rotate-180" : ""}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </h2>
                <div
                  id="climatic-accordion-content"
                  className={isClimaticOpen ? "" : "hidden"}
                  aria-labelledby="climatic-accordion-trigger"
                >
                  <div className="p-5 border border-b-0 border-gray-200">
                    {/* Selector de período de tiempo para datos climáticos */}
                    <div className="mb-6 border-b border-gray-200 pb-4">
                      <p className="mb-4 text-gray-700">
                        Explora cómo han variado las principales variables del
                        clima en esta estación. Visualiza la evolución de la
                        <strong> temperatura</strong>, la{" "}
                        <strong>precipitación</strong> y la{" "}
                        <strong>radiación solar</strong>. Utiliza los filtros de
                        fecha para ajustar la información a tu interés.
                      </p>

                      {/* Controles en línea */}
                      <div className="flex items-end gap-12">
                        {/* Selector de período */}
                        <div>
                          <label
                            htmlFor="period-climatic"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Período
                          </label>
                          <select
                            id="period-climatic"
                            value={timePeriod}
                            onChange={(e) => setTimePeriod(e.target.value)}
                            className="px-4 py-2 text-gray-900 bg-transparent focus:outline-none"
                          >
                            <option value="daily">Diario</option>
                            <option value="monthly">Mensual</option>
                            <option value="climatology">Climatología</option>
                          </select>
                        </div>

                        {/* Selector de fechas */}
                        {timePeriod === "climatology" ? (
                          <>
                            <div>
                              <label
                                htmlFor="start-month"
                                className="block text-xs font-medium text-gray-700 mb-1"
                              >
                                Mes inicial
                              </label>
                              <select
                                id="start-month"
                                value={filterDatesClimatic.start.split("-")[1]}
                                onChange={(e) =>
                                  setFilterDatesClimatic((prev) => ({
                                    ...prev,
                                    start: monthToDateFormat(e.target.value),
                                  }))
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                              >
                                {MONTHS.map((month) => (
                                  <option key={month.value} value={month.value}>
                                    {month.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label
                                htmlFor="end-month"
                                className="block text-xs font-medium text-gray-700 mb-1"
                              >
                                Mes final
                              </label>
                              <select
                                id="end-month"
                                value={filterDatesClimatic.end.split("-")[1]}
                                onChange={(e) =>
                                  setFilterDatesClimatic((prev) => ({
                                    ...prev,
                                    end: monthToDateFormat(e.target.value),
                                  }))
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                              >
                                {MONTHS.map((month) => (
                                  <option key={month.value} value={month.value}>
                                    {month.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <button
                                onClick={handleSearch}
                                disabled={
                                  !filterDatesClimatic.start ||
                                  !filterDatesClimatic.end
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              >
                                Buscar
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label
                                htmlFor="start-date"
                                className="block text-xs font-medium text-gray-700 mb-1"
                              >
                                Fecha inicial
                              </label>
                              <input
                                type="date"
                                id="start-date"
                                value={filterDatesClimatic.start || ""}
                                min={stationDates?.minDate || ""}
                                max={stationDates?.maxDate || ""}
                                onChange={(e) =>
                                  setFilterDatesClimatic((prev) => ({
                                    ...prev,
                                    start: e.target.value,
                                  }))
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="end-date"
                                className="block text-xs font-medium text-gray-700 mb-1"
                              >
                                Fecha final
                              </label>
                              <input
                                type="date"
                                id="end-date"
                                value={filterDatesClimatic.end}
                                min={
                                  filterDatesClimatic.start ||
                                  stationDates?.minDate ||
                                  ""
                                }
                                max={stationDates?.maxDate || ""}
                                onChange={(e) =>
                                  setFilterDatesClimatic((prev) => ({
                                    ...prev,
                                    end: e.target.value,
                                  }))
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <button
                                onClick={handleSearch}
                                disabled={
                                  !filterDatesClimatic.start ||
                                  !filterDatesClimatic.end ||
                                  isDateRangeTooLarge(
                                    filterDatesClimatic.start,
                                    filterDatesClimatic.end,
                                  )
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              >
                                Buscar
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Mensaje de advertencia debajo de los rangos */}
                      {timePeriod !== "climatology" &&
                        isDateRangeTooLarge(
                          filterDatesClimatic.start,
                          filterDatesClimatic.end,
                        ) && (
                          <div className="mt-3">
                            <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                              ⚠️ El rango seleccionado es muy grande (más de 3
                              años). Por favor, selecciona un período menor.
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Gráficas de datos climáticos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {loadingCharts ? (
                        // Mostrar esqueletos de carga
                        Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 h-80 flex items-center justify-center"
                          >
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                          </div>
                        ))
                      ) : climateChartsData ? (
                        // Renderizar gráficas dinámicamente
                        Object.entries(climateChartsData).map(
                          ([varKey, chartData]: [string, any]) => (
                            <ClimateChart
                              key={`climate-${varKey}-${timePeriod}`}
                              title={chartData.title}
                              unit={chartData.unit}
                              datasets={chartData.datasets}
                              period={timePeriod}
                              chartType={chartData.chartType}
                              description={`Rango total disponible: ${chartData.totalDateRange?.minDate || "N/A"} hasta ${chartData.totalDateRange?.maxDate || "N/A"}`}
                            />
                          ),
                        )
                      ) : (
                        // Mostrar mensaje cuando no hay datos
                        <div className="col-span-full text-center text-gray-500 py-8">
                          No hay datos climáticos disponibles para el período
                          seleccionado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Acordeón para Indicadores climáticos */}
              <div id="indicators-accordion">
                <h2 id="indicators-accordion-trigger">
                  <button
                    type="button"
                    className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 hover:bg-gray-100"
                    onClick={() => setIsIndicatorsOpen(!isIndicatorsOpen)}
                    aria-expanded={isIndicatorsOpen}
                  >
                    <span className="text-xl font-semibold text-gray-800">
                      Indicadores climáticos
                    </span>
                    <svg
                      className={`w-6 h-6 shrink-0 ${isIndicatorsOpen ? "rotate-180" : ""}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </h2>
                <div
                  id="indicators-accordion-content"
                  className={isIndicatorsOpen ? "" : "hidden"}
                  aria-labelledby="indicators-accordion-trigger"
                >
                  <div className="p-5 border border-t-0 border-gray-200">
                    {/* Selector de período de tiempo para indicadores */}
                    <div className="flex flex-wrap items-center gap-6 mb-6 border-b border-gray-200 pb-4 justify-between">
                      <p className="text-gray-700">
                        Consulta la evolución de los{" "}
                        <strong>indicadores climáticos</strong> de esta estación
                        y descubre patrones relevantes. Filtra fácilmente por{" "}
                        <strong>categoría</strong> y{" "}
                        <strong>rango de fechas</strong> para personalizar tu
                        análisis.
                      </p>
                      <div className="flex items-center gap-6">
                        {/* Selector de período */}
                        <div>
                          <label
                            htmlFor="period-indicators"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Período
                          </label>
                          <select
                            id="period-indicators"
                            value={timePeriodIndicators}
                            onChange={(e) =>
                              setTimePeriodIndicators(e.target.value)
                            }
                            className="px-4 py-2 text-gray-900 bg-transparent focus:outline-none"
                          >
                            {indicatorPeriodOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Selector de fechas alineado a la derecha */}
                      <div className="flex gap-4">
                        <div>
                          <label
                            htmlFor="start-date-indicators"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Fecha inicial
                          </label>
                          <input
                            type="date"
                            id="start-date-indicators"
                            value={filterDatesIndicators.start}
                            min={stationDates?.minDate || ""}
                            max={stationDates?.maxDate || ""}
                            onChange={(e) =>
                              setFilterDatesIndicators((prev) => ({
                                ...prev,
                                start: e.target.value,
                              }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="end-date-indicators"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Fecha final
                          </label>
                          <input
                            type="date"
                            id="end-date-indicators"
                            value={filterDatesIndicators.end}
                            min={
                              filterDatesIndicators.start ||
                              stationDates?.minDate ||
                              ""
                            }
                            max={stationDates?.maxDate || ""}
                            onChange={(e) =>
                              setFilterDatesIndicators((prev) => ({
                                ...prev,
                                end: e.target.value,
                              }))
                            }
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green text-gray-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gráficas de indicadores climáticos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {indicatorsData &&
                      Object.keys(indicatorsData).length > 0 ? (
                        Object.entries(indicatorsData).map(
                          ([key, indicator]) => {
                            const typedIndicator = indicator as {
                              name: string;
                              unit: string;
                              dates: string[];
                              values: number[];
                            };
                            return (
                              <ClimateChart
                                key={key}
                                title={typedIndicator.name}
                                unit={typedIndicator.unit}
                                datasets={[
                                  {
                                    label: "Datos estación",
                                    color: getIndicatorColor(key),
                                    data: typedIndicator.values,
                                    dates: typedIndicator.dates,
                                  },
                                ]}
                                period={timePeriodIndicators}
                              />
                            );
                          },
                        )
                      ) : (
                        <div className="col-span-2 flex items-center justify-center">
                          <p className="text-gray-500">
                            No hay datos disponibles
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Botón flotante para comparación satelital */}
      <button
        onClick={toggleSatelliteComparison}
        disabled={!station || loadingSatellite}
        className={`fixed bottom-40 right-8 text-white font-medium rounded-full p-4 shadow-lg no-print z-[9999] transition-all hover:scale-110 ${
          !station
            ? "bg-gray-400 cursor-not-allowed"
            : isSatelliteActive
              ? "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300"
              : "bg-gray-600 hover:bg-gray-700 focus:ring-gray-400"
        } focus:outline-none focus:ring-4`}
        title={
          !station
            ? "Estación no disponible"
            : isSatelliteActive
              ? "Desactivar comparación satelital"
              : "Activar comparación satelital"
        }
      >
        {loadingSatellite ? (
          <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white inline-block"></span>
        ) : (
          <FontAwesomeIcon icon={faSatellite} className="h-6 w-6" />
        )}
      </button>

      {/* Botón flotante de favoritos */}
      <button
        onClick={toggleFavorite}
        disabled={!authenticated || loadingFavorite}
        className={`fixed bottom-24 right-8 text-white font-medium rounded-full p-4 shadow-lg no-print z-[9999] transition-all hover:scale-110 ${
          !authenticated
            ? "bg-gray-400 cursor-not-allowed"
            : isFavorite
              ? "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300"
              : "bg-gray-600 hover:bg-gray-700 focus:ring-gray-400"
        } focus:outline-none focus:ring-4`}
        title={
          !authenticated
            ? "Debe iniciar sesión para agregar a favoritos"
            : isFavorite
              ? "Quitar de favoritos"
              : "Agregar a favoritos"
        }
      >
        {loadingFavorite ? (
          <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white inline-block"></span>
        ) : (
          <FontAwesomeIcon
            icon={isFavorite ? faStarSolid : faStarRegular}
            className="h-6 w-6"
          />
        )}
      </button>

      {/* Botón flotante de descarga PDF */}
      {hasDataForPDF && (
        <button
          onClick={handleDownloadPDF}
          disabled={!hasDataForPDF || pdfLoading}
          className="fixed bottom-8 right-8 text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full p-4 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed no-print z-[9999] transition-all hover:scale-110"
          title="Descargar como PDF"
        >
          {pdfLoading ? (
            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white inline-block"></span>
          ) : (
            <FontAwesomeIcon icon={faFileArrowDown} className="h-6 w-6" />
          )}
        </button>
      )}
    </div>
  );
}
