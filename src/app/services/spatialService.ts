import axios from "axios";
import { API_URL } from "@/app/config";

export interface LayerInfo {
  name: string;
  title: string;
  variable: string;
  available: boolean;
}

export interface IndicatorCategory {
  id: number;
  name: string;
  description: string;
  enable: boolean;
  registered_at: string;
  updated_at: string;
}

export interface Indicator {
  id: number;
  name: string;
  short_name: string;
  unit: string;
  type: string;
  temporality: string;
  indicator_category_id: number;
  description: string;
  enable: boolean;
  registered_at: string;
  updated_at: string;
}

export interface PointDataRequest {
  coordinates: number[][];
  start_date: string;
  end_date: string;
  workspace: string;
  store: string;
  temporality: string;
}

export interface PointDataResult {
  coordinate: number[];
  date: string;
  value: number;
}

export const spatialService = {
    getDatesFromGeoserver: async (wmsUrl: string, layer: string) => {
        try {
        const url = `${wmsUrl}?service=WMS&version=1.3.0&request=GetCapabilities`;
        const response = await axios.get(url);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");
        const layers = xmlDoc.getElementsByTagName("Layer");
        let dates: string[] = [];

        for (let i = 0; i < layers.length; i++) {
            const layerName = layers[i].getElementsByTagName("Name")[0].textContent;
            if (layerName === layer.split(":")[1]) {
            const dimension = layers[i].getElementsByTagName("Dimension")[0].textContent;
                if (dimension) {
                            const timeInterval = dimension.split(",");
                            dates = timeInterval.map((date) => {
                                const datePart = date.split("T")[0];
                                // Validar que la fecha tenga el formato correcto
                                if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                                    return datePart;
                                } else {
                                    console.warn("Invalid date format:", datePart);
                                    return null;
                                }
                            }).filter(date => date !== null) as string[];
                            break;
                        }
            }
        }
        return dates;
        } catch (error) {
        console.error("Error fetching dates from GeoServer:", error);
        return [];
        }
    },

    /**
     * Obtiene las capas disponibles de un workspace específico en Geoserver
     * @param geoserverBaseUrl - URL base del geoserver (ej: https://geo.aclimate.org/geoserver)
     * @param workspace - Nombre del workspace (ej: climate_historical_daily, climate_historical_monthly)
     * @param countryCode - Código del país (ej: hn, co)
     * @param timePeriod - Período de tiempo (daily, monthly, climatology)
     * @returns Array con información de capas disponibles
     */
    getAvailableLayers: async (
        geoserverBaseUrl: string,
        workspace: string,
        countryCode: string,
        timePeriod: string
    ): Promise<LayerInfo[]> => {
        try {
            const wmsUrl = `${geoserverBaseUrl}/${workspace}/wms`;
            const url = `${wmsUrl}?service=WMS&version=1.3.0&request=GetCapabilities`;
                        
            const response = await axios.get(url);

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response.data, "text/xml");
            const layers = xmlDoc.getElementsByTagName("Layer");


            // Variables que buscamos (en orden de preferencia para visualización)
            const desiredVariables = ['prec', 'tmax', 'tmin', 'rad', 'et0'];
            const variableLabels: Record<string, string> = {
                'prec': 'Precipitación',
                'tmax': 'Temperatura máxima',
                'tmin': 'Temperatura mínima',
                'rad': 'Radiación solar',
                'et0': 'Evapotranspiración'
            };

            const availableLayers: LayerInfo[] = [];

            // Recorrer las variables deseadas y buscar si existen en las capas del geoserver
            for (const variable of desiredVariables) {
                // Patrón completo de la capa: climate_historical_{timePeriod}_{countryCode}_{variable}
                const layerPattern = `climate_historical_${timePeriod}_${countryCode}_${variable}`;
                let found = false;

                for (let i = 0; i < layers.length; i++) {
                    const nameElement = layers[i].getElementsByTagName("Name")[0];
                    
                    if (nameElement) {
                        const layerName = nameElement.textContent || "";
                        
                        
                        // Verificar si el nombre de la capa coincide exactamente con el patrón
                        if (layerName === layerPattern) {
                            // Asegurar que el nombre incluya el prefijo del workspace
                            const fullLayerName = `${workspace}:${layerPattern}`;
                            availableLayers.push({
                                name: fullLayerName,
                                title: variableLabels[variable] || variable.toUpperCase(),
                                variable: variable,
                                available: true
                            });
                            found = true;
                            break;
                        } else if (layerName === `${workspace}:${layerPattern}`) {
                            // Ya tiene el prefijo
                            availableLayers.push({
                                name: layerName,
                                title: variableLabels[variable] || variable.toUpperCase(),
                                variable: variable,
                                available: true
                            });
                            found = true;
                            break;
                        }
                    }
                }

                // Si no se encontró la capa, agregarla como no disponible
                if (!found) {
                    availableLayers.push({
                        name: `${workspace}:${layerPattern}`,
                        title: variableLabels[variable] || variable.toUpperCase(),
                        variable: variable,
                        available: false
                    });
                }
            }

            return availableLayers;
        } catch (error) {
            console.error("Error fetching available layers from GeoServer:", error);
            // En caso de error, devolver todas las variables como no disponibles
            return ['prec', 'tmax', 'tmin', 'rad', 'et0'].map(variable => ({
                name: `${workspace}:${countryCode}_${variable}`,
                title: variable.toUpperCase(),
                variable: variable,
                available: false
            }));
        }
    },

    /**
     * Obtiene las categorías de indicadores para un país específico
     * @param countryId - ID del país
     * @returns Array de categorías de indicadores
     */
    getIndicatorCategories: async (countryId: string): Promise<IndicatorCategory[]> => {
        try {
            const url = `${API_URL}/indicator-category-mng/by-country?country_id=${countryId}`;
            const response = await axios.get(url);
            return response.data.filter((category: IndicatorCategory) => category.enable);
        } catch (error) {
            console.error("Error fetching indicator categories:", error);
            return [];
        }
    },

    /**
     * Obtiene los indicadores climáticos filtrados por país, temporalidad y categoría
     * @param countryId - ID del país
     * @param temporality - Período de tiempo (daily, monthly, annual, etc.)
     * @param categoryId - ID de la categoría de indicador
     * @returns Array de indicadores
     */
    getIndicators: async (
        countryId: string,
        temporality: string,
        categoryId: number
    ): Promise<Indicator[]> => {
        try {
            const url = `${API_URL}/indicator-mng/by-country?country_id=${countryId}&temporality=${temporality}&category_id=${categoryId}&type=CLIMATE`;
            const response = await axios.get(url);
            return response.data.filter((indicator: Indicator) => indicator.enable);
        } catch (error) {
            console.error("Error fetching indicators:", error);
            return [];
        }
    },

    /**
     * Obtiene las capas administrativas disponibles para un país desde GeoServer
     * @param geoserverBaseUrl - URL base del geoserver
     * @param countryCode - Código del país (ej: hn, co, st)
     * @returns Array con información de capas administrativas disponibles
     */
    getAdminLayers: async (
        geoserverBaseUrl: string,
        countryCode: string
    ): Promise<Array<{name: string, workspace: string, store: string, layer: string}>> => {
        try {
            const workspace = "administrative";
            const wmsUrl = `${geoserverBaseUrl}/${workspace}/wms`;
            const url = `${wmsUrl}?service=WMS&version=1.3.0&request=GetCapabilities`;
            
            const response = await axios.get(url);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response.data, "text/xml");
            const layers = xmlDoc.getElementsByTagName("Layer");

            const adminLayers: Array<{name: string, workspace: string, store: string, layer: string}> = [];
            
            // Mapeo de códigos de país a nombres usados en las capas
            const countryNames: Record<string, string> = {
                "hn": "honduras",
                "co": "colombia",
                "st": "sat_amazonia"
            };
            
            const countryName = countryNames[countryCode] || countryCode;

            // Buscar capas que coincidan con el patrón del país
            for (let i = 0; i < layers.length; i++) {
                const nameElement = layers[i].getElementsByTagName("Name")[0];
                
                if (nameElement) {
                    const layerName = nameElement.textContent || "";
                    
                    // Buscar capas que contengan el nombre del país y nivel administrativo
                    // Patrón: {countryName}_adm{level} o administrative:{countryName}_adm{level}
                    const pattern = new RegExp(`${countryName}_adm(\\d+)$`);
                    const match = layerName.match(pattern);
                    
                    if (match) {
                        const level = match[1];
                        const storeName = `${countryName}_adm${level}`;
                        const fullLayerName = layerName.includes(":") ? layerName : `${workspace}:${storeName}`;
                        
                        adminLayers.push({
                            name: `Nivel Administrativo ${level}`,
                            workspace: workspace,
                            store: storeName,
                            layer: fullLayerName
                        });
                    }
                }
            }

            // Ordenar por nivel administrativo
            adminLayers.sort((a, b) => {
                const levelA = parseInt(a.store.match(/adm(\d+)$/)?.[1] || "0");
                const levelB = parseInt(b.store.match(/adm(\d+)$/)?.[1] || "0");
                return levelA - levelB;
            });

            return adminLayers;
        } catch (error) {
            console.error("Error fetching admin layers from GeoServer:", error);
            return [];
        }
    },

    getPointData: async (request: PointDataRequest): Promise<{ data: PointDataResult[] }> => {
        try {
            const response = await axios.post(`${API_URL}/geoserver/point-data`, request);
            return response.data;
        } catch (error) {
            console.error("Error fetching point data:", error);
            throw new Error("Error obteniendo datos satelitales");
        }
    }
}
