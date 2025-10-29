// app/contexts/CountryContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { API_URL, COUNTRY_NAME } from '@/app/config';

interface CountryContextType {
  countryId: string | null;
  countryName: string;
  isLoading: boolean;
  error: string | null;
}

const CountryContext = createContext<CountryContextType>({
  countryId: null,
  countryName: COUNTRY_NAME,
  isLoading: true,
  error: null
});

interface CountryProviderProps {
  children: ReactNode;
}

export function CountryProvider({ children }: CountryProviderProps) {
  const [countryId, setCountryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountryId = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(
          `${API_URL}/countries/by-name?name=${encodeURIComponent(COUNTRY_NAME)}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch country: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Asumir que la API devuelve un objeto con id o un array con el primer elemento
        const id = Array.isArray(data) ? data[0]?.id : data?.id;
        
        if (!id) {
          throw new Error('Country ID not found in API response');
        }
        
        setCountryId(String(id));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching country';
        console.error('Error fetching country ID:', errorMessage);
        setError(errorMessage);
        
        // Fallback: intentar usar el ID del .env si existe
        const fallbackId = process.env.NEXT_PUBLIC_ACLIMATE_COUNTRY_ID;
        if (fallbackId) {
          console.warn(`Using fallback country ID from env: ${fallbackId}`);
          setCountryId(fallbackId);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountryId();
  }, []);

  return (
    <CountryContext.Provider value={{ countryId, countryName: COUNTRY_NAME, isLoading, error }}>
      {children}
    </CountryContext.Provider>
  );
}

/**
 * Hook para acceder al país actual
 * @returns {CountryContextType} Información del país actual
 * @example
 * const { countryId, countryName, isLoading } = useCountry();
 */
export function useCountry(): CountryContextType {
  const context = useContext(CountryContext);
  
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  
  return context;
}
