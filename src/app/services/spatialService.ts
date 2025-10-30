import axios from "axios";

interface LayerInfo {
  name: string;
  title: string;
  variable: string;
  available: boolean;
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
    }
}
