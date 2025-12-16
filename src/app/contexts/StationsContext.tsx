"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { Station } from '@/app/types/Station';
import { stationService } from '@/app/services/stationService';
import { useCountry } from './CountryContext';

interface StationsContextType {
  stations: Station[];
  stationData: Record<string, any[]>;
  loading: boolean;
  error: string | null;
  refreshStations: () => Promise<void>;
  lastUpdated: Date | null;
}

const StationsContext = createContext<StationsContextType | undefined>(undefined);

// Tiempo de expiración del caché en milisegundos (1 día)
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

export const StationsProvider = ({ children }: { children: ReactNode }) => {
  const { countryId } = useCountry();
  const [stations, setStations] = useState<Station[]>([]);
  const [stationData, setStationData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Usar refs para evitar ciclos infinitos en useEffect
  const loadedCountryRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadStations = async () => {
    if (!countryId || isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      // Usar el nuevo endpoint optimizado que trae estaciones + datos en una sola llamada
      const stationsWithData = await stationService.getAllWithData(countryId);
      
      // Separar estaciones y datos
      const stationsData: Station[] = [];
      const dataMap: Record<string, any[]> = {};
      
      stationsWithData.forEach((item: any) => {
        // Agregar la estación
        stationsData.push({
          id: item.id,
          name: item.name,
          ext_id: item.ext_id,
          enable: item.enable,
          altitude: item.altitude,
          latitude: item.latitude,
          longitude: item.longitude,
          visible: item.visible,
          admin2_id: item.admin2_id,
          admin2_name: item.admin2_name,
          admin2_ext_id: item.admin2_ext_id,
          admin1_id: item.admin1_id,
          admin1_name: item.admin1_name,
          admin1_ext_id: item.admin1_ext_id,
          country_id: item.country_id,
          country_name: item.country_name,
          country_iso2: item.country_iso2,
        });
        
        // Agregar los datos si existen
        if (item.latest_data && item.latest_data.measures) {
          // Transformar la estructura para que sea compatible con el código existente
          const transformedData = item.latest_data.measures.map((measure: any) => ({
            date: item.latest_data.date,
            measure_id: measure.measure_id,
            measure_name: measure.measure_name,
            measure_short_name: measure.measure_short_name,
            measure_unit: measure.measure_unit,
            value: measure.value
          }));
          dataMap[item.id.toString()] = transformedData;
        } else {
          dataMap[item.id.toString()] = [];
        }
      });
      
      setStations(stationsData);
      setStationData(dataMap);
      setLastUpdated(new Date());
      loadedCountryRef.current = countryId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading stations");
      console.error("Error fetching stations:", err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    const checkAndLoadStations = async () => {
      if (!countryId || isLoadingRef.current) return;
      
      // Si el país cambió o nunca hemos cargado este país, cargar
      if (countryId !== loadedCountryRef.current) {
        await loadStations();
        return;
      }
      
      // Si ya cargamos este país, verificar si el caché ha expirado
      if (lastUpdated) {
        const isCacheExpired = (Date.now() - lastUpdated.getTime()) > CACHE_EXPIRATION_MS;
        if (isCacheExpired) {
          await loadStations();
        }
      }
    };

    checkAndLoadStations();
  }, [countryId]);

  const refreshStations = async () => {
    await loadStations();
  };

  const contextValue = useMemo(() => ({
    stations,
    stationData,
    loading,
    error,
    refreshStations,
    lastUpdated
  }), [stations, stationData, loading, error, lastUpdated]);

  return (
    <StationsContext.Provider value={contextValue}>
      {children}
    </StationsContext.Provider>
  );
};

export const useStations = () => {
  const context = useContext(StationsContext);
  if (!context) {
    throw new Error('useStations must be used within StationsProvider');
  }
  return context;
};
