"use client";

import { useEffect, useState } from "react";
import { GEOSERVER_URL } from "@/app/config";
import {
  spatialService,
  IndicatorCategory,
  Indicator,
} from "@/app/services/spatialService";
import HydrologicalIndicatorCard from "./HydrologicalIndicatorCard";
import type { CustomCommunityMarker } from "@/app/components/MapComponent";

interface RasterFileInfo {
  url: string;
  layer: string;
  time: string;
  title: string;
}

interface AdminLayer {
  name: string;
  workspace: string;
  store: string;
  layer: string;
}

interface HydrologicalIndicatorsSectionProps {
  countryId: string | null;
  adminLayers: AdminLayer[];
  countryCenter: [number, number];
  countryZoom: number;
  communityMarkers?: CustomCommunityMarker[];
  onTimeChange: (time: string, layerName: string, layerTitle: string) => void;
  getCurrentRasterFile: (
    layerName: string,
    layerTitle: string,
    wmsUrl: string,
  ) => Promise<RasterFileInfo | null>;
  downloadRasterFile: (fileInfo: RasterFileInfo) => void;
}

const departments = [
  { id: "amazonas", label: "Amazonas" },
  { id: "caqueta", label: "Caquetá" },
];

const departmentCommunities: Record<
  string,
  Array<{ id: string; label: string }>
> = {
  amazonas: [
    { id: "leticia", label: "Leticia" },
    { id: "puerto_nariño", label: "Puerto Nariño" },
  ],
  caqueta: [{ id: "san_jose_del_fragua", label: "San José del Fragua" }],
};

const hydrologicalCommunityCoordinates: Record<
  string,
  { center: [number, number]; zoom: number }
> = {
  leticia: {
    center: [-3.997, -70.11],
    zoom: 12,
  },
  puerto_nariño: {
    center: [-3.592, -70.595],
    zoom: 10,
  },
  san_jose_del_fragua: {
    center: [1.266, -76.2],
    zoom: 10,
  },
};

const hydrologicalScenarios = [
  { id: "baseline", label: "Línea Base" },
  { id: "invierno", label: "Invierno" },
  { id: "normal", label: "Normal" },
  { id: "verano", label: "Verano" },
];

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isScenarioCategory = (category: IndicatorCategory) => {
  const categoryName = normalizeText(category.name || "");
  return categoryName.includes("escenario");
};

const isMeteorologicalAgriculturalDroughtCategory = (
  category: IndicatorCategory,
) => {
  const categoryName = normalizeText(category.name || "");
  const categoryDescription = normalizeText(category.description || "");

  return (
    categoryName.includes("sequia meteorologica y agricola") ||
    categoryDescription.includes("sequia meteorologica y agricola")
  );
};

export default function HydrologicalIndicatorsSection({
  countryId,
  adminLayers,
  countryCenter,
  countryZoom,
  communityMarkers = [],
  onTimeChange,
  getCurrentRasterFile,
  downloadRasterFile,
}: HydrologicalIndicatorsSectionProps) {
  const [isHydrologicalOpen, setIsHydrologicalOpen] = useState(true);
  const [selectedHydrologicalDepartment, setSelectedHydrologicalDepartment] =
    useState<string>("amazonas");
  const [selectedHydrologicalCommunity, setSelectedHydrologicalCommunity] =
    useState<string>("leticia");
  const [selectedHydrologicalScenario, setSelectedHydrologicalScenario] =
    useState<string>("baseline");
  const [selectedHydrologicalCategory, setSelectedHydrologicalCategory] =
    useState<IndicatorCategory | null>(null);
  const [hydrologicalCategories, setHydrologicalCategories] = useState<
    IndicatorCategory[]
  >([]);
  const [hydrologicalIndicatorsList, setHydrologicalIndicatorsList] = useState<
    Indicator[]
  >([]);
  const [loadingHydrologicalCategories, setLoadingHydrologicalCategories] =
    useState(false);
  const [loadingHydrologicalIndicators, setLoadingHydrologicalIndicators] =
    useState(false);

  const [hydrologicalBounds, setHydrologicalBounds] = useState<
    Record<string, [[number, number], [number, number]] | undefined>
  >({});

  useEffect(() => {
    const loadHydrologicalCategories = async () => {
      if (!countryId) return;

      setLoadingHydrologicalCategories(true);
      try {
        const categories =
          await spatialService.getIndicatorCategories(countryId);
        const filteredCategories = categories.filter(
          (category) =>
            !isScenarioCategory(category) &&
            !isMeteorologicalAgriculturalDroughtCategory(category),
        );

        setHydrologicalCategories(filteredCategories);
        if (filteredCategories.length > 0) {
          setSelectedHydrologicalCategory(filteredCategories[0]);
        } else {
          setSelectedHydrologicalCategory(null);
        }
      } catch (error) {
        console.error("Error cargando categorías hidrológicas:", error);
        setHydrologicalCategories([]);
        setSelectedHydrologicalCategory(null);
      } finally {
        setLoadingHydrologicalCategories(false);
      }
    };

    if (countryId) {
      loadHydrologicalCategories();
    }
  }, [countryId]);

  useEffect(() => {
    const loadHydrologicalIndicators = async () => {
      if (!selectedHydrologicalCategory) return;

      setLoadingHydrologicalIndicators(true);
      try {
        const fetchedIndicators = await spatialService.getIndicatorsByCategory(
          selectedHydrologicalCategory.id,
        );
        setHydrologicalIndicatorsList(fetchedIndicators);
      } catch (error) {
        console.error("Error cargando indicadores hidrológicos:", error);
        setHydrologicalIndicatorsList([]);
      } finally {
        setLoadingHydrologicalIndicators(false);
      }
    };

    if (selectedHydrologicalCategory) {
      loadHydrologicalIndicators();
    }
  }, [selectedHydrologicalCategory]);

  useEffect(() => {
    const fetchBounds = async () => {
      const newBounds: Record<
        string,
        [[number, number], [number, number]] | undefined
      > = {};
      const workspaceUrl = `${GEOSERVER_URL}/hydrological_index/wms`;

      for (const indicator of hydrologicalIndicatorsList) {
        const layerName = `hydrological_index:hydrological_index_multiyear_monthly_st_${selectedHydrologicalCommunity}_${indicator.short_name}_${selectedHydrologicalScenario}`;
        try {
          const bounds = await spatialService.getLayerBounds(
            workspaceUrl,
            layerName,
          );
          if (bounds) {
            newBounds[indicator.id] = bounds;
          }
        } catch (error) {
          console.error(`Error fetching bounds for ${layerName}`, error);
        }
      }

      setHydrologicalBounds(newBounds);
    };

    if (hydrologicalIndicatorsList.length > 0) {
      fetchBounds();
    }
  }, [
    hydrologicalIndicatorsList,
    selectedHydrologicalCommunity,
    selectedHydrologicalScenario,
  ]);

  const handleDownloadIndicator = async (
    layerName: string,
    layerTitle: string,
    workspaceUrl: string,
  ) => {
    const rasterFile = await getCurrentRasterFile(
      layerName,
      layerTitle,
      workspaceUrl,
    );

    if (rasterFile) {
      downloadRasterFile(rasterFile);
    }
  };

  return (
    <div id="hydrological-accordion">
      <h2 id="hydrological-accordion-trigger">
        <button
          type="button"
          className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 hover:bg-gray-100 rounded-b-xl"
          onClick={() => setIsHydrologicalOpen(!isHydrologicalOpen)}
          aria-expanded={isHydrologicalOpen}
        >
          <span className="text-xl font-semibold text-gray-800">
            Indicadores hidrológicos
          </span>
          <svg
            className={`w-6 h-6 shrink-0 ${isHydrologicalOpen ? "rotate-180" : ""}`}
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
        id="hydrological-accordion-content"
        className={isHydrologicalOpen ? "" : "hidden"}
        aria-labelledby="hydrological-accordion-trigger"
      >
        <div className="p-5 border border-t-0 border-gray-200">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-gray-600 mt-2">
                Explora indicadores hidrológicos específicos a nivel de
                microcuenca para tu comunidad. Selecciona tu ubicación para ver
                los datos disponibles sobre erosión, inundaciones y más.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-64">
                <label
                  htmlFor="hydrologicalDepartment"
                  className="block font-medium text-gray-700 mb-2"
                >
                  Departamento
                </label>
                <select
                  id="hydrologicalDepartment"
                  value={selectedHydrologicalDepartment}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setSelectedHydrologicalDepartment(newDept);
                    const communities = departmentCommunities[newDept] || [];
                    if (communities.length > 0) {
                      setSelectedHydrologicalCommunity(communities[0].id);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green w-full"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-64">
                <label
                  htmlFor="hydrologicalCommunity"
                  className="block font-medium text-gray-700 mb-2"
                >
                  Comunidad
                </label>
                <select
                  id="hydrologicalCommunity"
                  value={selectedHydrologicalCommunity}
                  onChange={(e) =>
                    setSelectedHydrologicalCommunity(e.target.value)
                  }
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green w-full"
                >
                  {(
                    departmentCommunities[selectedHydrologicalDepartment] || []
                  ).map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-64">
                <label
                  htmlFor="hydrologicalScenario"
                  className="block font-medium text-gray-700 mb-2"
                >
                  Escenario
                </label>
                <select
                  id="hydrologicalScenario"
                  value={selectedHydrologicalScenario}
                  onChange={(e) =>
                    setSelectedHydrologicalScenario(e.target.value)
                  }
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green w-full"
                >
                  {hydrologicalScenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 w-full">
              <label
                htmlFor="hydrologicalCategory"
                className="block font-medium text-gray-700 mb-2"
              >
                Categoría
              </label>
              <select
                id="hydrologicalCategory"
                value={selectedHydrologicalCategory?.id || ""}
                onChange={(e) => {
                  const category = hydrologicalCategories.find(
                    (c) => c.id.toString() === e.target.value,
                  );
                  setSelectedHydrologicalCategory(category || null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green w-full sm:w-64"
                disabled={loadingHydrologicalCategories}
              >
                {hydrologicalCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {selectedHydrologicalCategory?.description && (
                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                  {selectedHydrologicalCategory.description}
                </div>
              )}
            </div>

            {loadingHydrologicalIndicators ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-8 mt-4">
                {hydrologicalIndicatorsList.map((indicator) => {
                  const communityCoords = hydrologicalCommunityCoordinates[
                    selectedHydrologicalCommunity
                  ] || {
                    center: countryCenter,
                    zoom: countryZoom,
                  };

                  return (
                    <HydrologicalIndicatorCard
                      key={indicator.id}
                      indicator={indicator}
                      selectedHydrologicalCommunity={
                        selectedHydrologicalCommunity
                      }
                      selectedHydrologicalScenario={
                        selectedHydrologicalScenario
                      }
                      communityCenter={communityCoords.center}
                      communityZoom={communityCoords.zoom}
                      workspaceUrl={`${GEOSERVER_URL}/hydrological_index/wms`}
                      adminLayers={adminLayers}
                      communityMarkers={communityMarkers}
                      bounds={hydrologicalBounds[indicator.id]}
                      onTimeChange={onTimeChange}
                      onDownload={handleDownloadIndicator}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
