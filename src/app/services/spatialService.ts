import axios from "axios";
import { API_URL } from "@/app/config";
import { getClientToken } from "@/app/services/clientTokenService";

// Cache para almacenar las promises de GetCapabilities y evitar peticiones duplicadas
const capabilitiesCache: Record<string, Promise<Document>> = {};

/**
 * Obtiene y cachea el documento XML de capacidades de un servicio WMS
 * @param wmsUrl URL base del servicio WMS
 * @returns Promise<Document> Documento XML parseado
 */
const fetchCapabilities = async (wmsUrl: string): Promise<Document> => {
  // Normalizar URL eliminando slash final si existe
  const baseUrl = wmsUrl.endsWith("/") ? wmsUrl.slice(0, -1) : wmsUrl;
  const cacheKey = `${baseUrl}?service=WMS&version=1.3.0&request=GetCapabilities`;

  if (!capabilitiesCache[cacheKey]) {
    // Si no está en cache, crear la promesa
    capabilitiesCache[cacheKey] = axios
      .get(cacheKey, { responseType: "text" })
      .then((response) => {
        const parser = new DOMParser();
        return parser.parseFromString(response.data, "text/xml");
      })
      .catch((error) => {
        // En caso de error, eliminar del cache para permitir reintentos
        delete capabilitiesCache[cacheKey];
        throw error;
      });
  }

  return capabilitiesCache[cacheKey];
};

interface ParsedLayer {
  name: string;
  title: string;
  dimension?: string;
  bounds?: [number, number, number, number];
}

const parsedLayersCache: Record<string, ParsedLayer[]> = {};

/**
 * Obtiene la lista parseada de capas de un servicio WMS
 * @param wmsUrl URL base del servicio WMS
 * @returns Promise<ParsedLayer[]> Lista de capas con sus metadatos básicos
 */
const getParsedLayers = async (wmsUrl: string): Promise<ParsedLayer[]> => {
  if (parsedLayersCache[wmsUrl]) {
    return parsedLayersCache[wmsUrl];
  }

  const xmlDoc = await fetchCapabilities(wmsUrl);
  const layers = xmlDoc.getElementsByTagName("Layer");
  const parsed: ParsedLayer[] = [];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const nameElement = layer.getElementsByTagName("Name")[0];

    if (nameElement && nameElement.textContent) {
      const name = nameElement.textContent;

      const titleElement = layer.getElementsByTagName("Title")[0];
      const title = titleElement ? titleElement.textContent || "" : "";

      const dimensionElement = layer.getElementsByTagName("Dimension")[0];
      const dimension = dimensionElement
        ? dimensionElement.textContent || undefined
        : undefined;

      // Extract BoundingBox
      let bounds: [number, number, number, number] | undefined;
      const bboxElement = layer.getElementsByTagName(
        "EX_GeographicBoundingBox",
      )[0];
      if (bboxElement) {
        const west = parseFloat(
          bboxElement.getElementsByTagName("westBoundLongitude")[0]
            ?.textContent || "0",
        );
        const east = parseFloat(
          bboxElement.getElementsByTagName("eastBoundLongitude")[0]
            ?.textContent || "0",
        );
        const south = parseFloat(
          bboxElement.getElementsByTagName("southBoundLatitude")[0]
            ?.textContent || "0",
        );
        const north = parseFloat(
          bboxElement.getElementsByTagName("northBoundLatitude")[0]
            ?.textContent || "0",
        );
        if (!isNaN(west) && !isNaN(east) && !isNaN(south) && !isNaN(north)) {
          bounds = [south, west, north, east];
        }
      }

      parsed.push({ name, title, dimension, bounds });
    }
  }

  parsedLayersCache[wmsUrl] = parsed;
  return parsed;
};

interface ParsedLayer {
  name: string;
  title: string;
  dimension?: string;
  bounds?: [number, number, number, number];
}

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
      const parsedLayers = await getParsedLayers(wmsUrl);
      const targetLayerName = layer.split(":")[1] || layer;

      const foundLayer = parsedLayers.find(
        (l) =>
          l.name === layer ||
          l.name === targetLayerName ||
          (l.name.includes(":") && l.name.split(":")[1] === targetLayerName),
      );

      if (foundLayer && foundLayer.dimension) {
        const dates = foundLayer.dimension.split(",");
        const parsedDates = dates
          .map((date) => {
            const datePart = date.split("T")[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
            return null;
          })
          .filter(Boolean) as string[];

        // Ordenar fechas para asegurar consistencia
        return parsedDates.sort();
      }
      return [];
    } catch (error) {
      console.error("Error fetching dates from GeoServer:", error);
      return [];
    }
  },

  getLayerBounds: async (
    wmsUrl: string,
    layer: string,
  ): Promise<[[number, number], [number, number]] | null> => {
    try {
      const parsedLayers = await getParsedLayers(wmsUrl);
      const targetLayerName = layer.split(":")[1] || layer;

      const foundLayer = parsedLayers.find(
        (l) =>
          l.name === layer ||
          l.name === targetLayerName ||
          (l.name.includes(":") && l.name.split(":")[1] === targetLayerName),
      );

      if (foundLayer && foundLayer.bounds) {
        // bounds: [south, west, north, east]
        // return: [[south, west], [north, east]]
        return [
          [foundLayer.bounds[0], foundLayer.bounds[1]],
          [foundLayer.bounds[2], foundLayer.bounds[3]],
        ];
      }
      return null;
    } catch (error) {
      console.error("Error fetching layer bounds:", error);
      return null;
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
    timePeriod: string,
  ): Promise<LayerInfo[]> => {
    try {
      const wmsUrl = `${geoserverBaseUrl}/${workspace}/wms`;
      const parsedLayers = await getParsedLayers(wmsUrl);

      // Variables que buscamos (en orden de preferencia para visualización)
      const desiredVariables = ["prec", "tmax", "tmin", "rad", "et0"];
      const variableLabels: Record<string, string> = {
        prec: "Precipitación",
        tmax: "Temperatura máxima",
        tmin: "Temperatura mínima",
        rad: "Radiación solar",
        et0: "Evapotranspiración",
      };

      const availableLayers: LayerInfo[] = [];

      // Recorrer las variables deseadas y buscar si existen en las capas del geoserver
      for (const variable of desiredVariables) {
        // Patrón completo de la capa: climate_historical_{timePeriod}_{countryCode}_{variable}
        const layerPattern = `climate_historical_${timePeriod}_${countryCode}_${variable}`;
        const layerPatternWithWorkspace = `${workspace}:${layerPattern}`;

        let found = false;

        const foundLayer = parsedLayers.find(
          (l) =>
            l.name === layerPattern || l.name === layerPatternWithWorkspace,
        );

        if (foundLayer) {
          const nameToUse = foundLayer.name.includes(":")
            ? foundLayer.name
            : layerPatternWithWorkspace;
          availableLayers.push({
            name: nameToUse,
            title: variableLabels[variable] || variable.toUpperCase(),
            variable: variable,
            available: true,
          });
          found = true;
        }

        // Si no se encontró la capa, agregarla como no disponible
        if (!found) {
          availableLayers.push({
            name: `${workspace}:${layerPattern}`,
            title: variableLabels[variable] || variable.toUpperCase(),
            variable: variable,
            available: false,
          });
        }
      }

      return availableLayers;
    } catch (error) {
      console.error("Error fetching available layers from GeoServer:", error);
      // En caso de error, devolver todas las variables como no disponibles
      return ["prec", "tmax", "tmin", "rad", "et0"].map((variable) => ({
        name: `${workspace}:${countryCode}_${variable}`,
        title: variable.toUpperCase(),
        variable: variable,
        available: false,
      }));
    }
  },

  /**
   * Obtiene las categorías de indicadores para un país específico
   * @param countryId - ID del país
   * @returns Array de categorías de indicadores
   */
  getIndicatorCategories: async (
    countryId: string,
  ): Promise<IndicatorCategory[]> => {
    try {
      const url = `${API_URL}/indicator-category-mng/by-country?country_id=${countryId}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${await getClientToken()}` },
      });
      return response.data.filter(
        (category: IndicatorCategory) => category.enable,
      );
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
    categoryId: number,
  ): Promise<Indicator[]> => {
    try {
      const url = `${API_URL}/indicator-mng/by-country?country_id=${countryId}&temporality=${temporality}&category_id=${categoryId}&type=CLIMATE`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${await getClientToken()}` },
      });
      return response.data.filter((indicator: Indicator) => indicator.enable);
    } catch (error) {
      console.error("Error fetching indicators:", error);
      return [];
    }
  },

  /**
   * Obtiene los indicadores por ID de categoría
   * @param categoryId - ID de la categoría
   * @returns Array de indicadores
   */
  getIndicatorsByCategory: async (categoryId: number): Promise<Indicator[]> => {
    try {
      const url = `${API_URL}/indicator-mng/by-category-id?category_id=${categoryId}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${await getClientToken()}` },
      });
      return response.data.filter((indicator: Indicator) => indicator.enable);
    } catch (error) {
      console.error("Error fetching indicators by category:", error);
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
    countryCode: string,
  ): Promise<
    Array<{ name: string; workspace: string; store: string; layer: string }>
  > => {
    try {
      const workspace = "administrative";
      const wmsUrl = `${geoserverBaseUrl}/${workspace}/wms`;

      const parsedLayers = await getParsedLayers(wmsUrl);

      const adminLayers: Array<{
        name: string;
        workspace: string;
        store: string;
        layer: string;
      }> = [];

      // Mapeo de códigos de país a nombres usados en las capas
      const countryNames: Record<string, string> = {
        hn: "honduras",
        co: "colombia",
        st: "sat_amazonia",
        ni: "nicaragua",
        sv: "salvador",
      };

      const countryName = countryNames[countryCode] || countryCode;
      const pattern = new RegExp(`${countryName}_adm(\\d+)$`);

      // Buscar capas que coincidan con el patrón del país
      for (const layer of parsedLayers) {
        const layerName = layer.name;
        const match = layerName.match(pattern);

        if (match) {
          const level = match[1];
          // Extraer el nombre de la capa (store) sin workspace
          const storeName = `${countryName}_adm${level}`;
          const fullLayerName = layerName.includes(":")
            ? layerName
            : `${workspace}:${storeName}`;

          adminLayers.push({
            name: `Nivel Administrativo ${level}`,
            workspace: workspace,
            store: storeName,
            layer: fullLayerName,
          });
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

  getPointData: async (
    request: PointDataRequest,
  ): Promise<{ data: PointDataResult[] }> => {
    try {
      const response = await axios.post(
        `${API_URL}/geoserver/point-data`,
        request,
        { headers: { Authorization: `Bearer ${await getClientToken()}` } },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching point data:", error);
      throw new Error("Error obteniendo datos satelitales");
    }
  },

  /**
   * Obtiene las temporalidades disponibles para indicadores climáticos de un país
   * @param geoserverBaseUrl - URL base del geoserver
   * @param countryCode - Código del país (ej: hn, co, st)
   * @returns Array de temporalidades disponibles (daily, monthly, annual, etc.)
   */
  getAvailableTemporalities: async (
    geoserverBaseUrl: string,
    countryCode: string,
  ): Promise<string[]> => {
    try {
      const wmsUrl = `${geoserverBaseUrl}/climate_index/wms`;
      const parsedLayers = await getParsedLayers(wmsUrl);

      const foundTemporalities = new Set<string>();

      // Todas las temporalidades posibles
      const allTemporalities = [
        "daily",
        "monthly",
        "annual",
        "seasonal",
        "decadal",
        "other",
      ];

      for (const layer of parsedLayers) {
        const layerName = layer.name;

        // Buscar capas que coincidan con el patrón: climate_index_{temporality}_{country}_*
        allTemporalities.forEach((temp) => {
          const pattern = `climate_index_${temp}_${countryCode}_`;
          if (layerName.includes(pattern)) {
            foundTemporalities.add(temp);
          }
        });
      }

      return Array.from(foundTemporalities);
    } catch (error) {
      console.error(
        "Error fetching available temporalities from GeoServer:",
        error,
      );
      // En caso de error, devolver todas las opciones
      return ["daily", "monthly", "annual", "seasonal", "decadal", "other"];
    }
  },
};
