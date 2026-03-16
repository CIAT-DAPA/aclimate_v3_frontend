"use client";

import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { Indicator } from "@/app/services/spatialService";

const MapComponent = dynamic(() => import("@/app/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
    </div>
  ),
});

interface AdminLayer {
  name: string;
  workspace: string;
  store: string;
  layer: string;
}

interface HydrologicalIndicatorCardProps {
  indicator: Indicator;
  selectedHydrologicalCommunity: string;
  selectedHydrologicalScenario: string;
  communityCenter: [number, number];
  communityZoom: number;
  workspaceUrl: string;
  adminLayers: AdminLayer[];
  bounds?: [[number, number], [number, number]];
  onTimeChange: (time: string, layerName: string, layerTitle: string) => void;
  onDownload: (
    layerName: string,
    layerTitle: string,
    workspaceUrl: string,
  ) => Promise<void>;
}

export default function HydrologicalIndicatorCard({
  indicator,
  selectedHydrologicalCommunity,
  selectedHydrologicalScenario,
  communityCenter,
  communityZoom,
  workspaceUrl,
  adminLayers,
  bounds,
  onTimeChange,
  onDownload,
}: HydrologicalIndicatorCardProps) {
  const layerName = `hydrological_index:hydrological_index_multiyear_monthly_st_${selectedHydrologicalCommunity}_${indicator.short_name}_${selectedHydrologicalScenario}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-gray-800 text-lg">
          {indicator.name}{" "}
          {indicator.unit && (
            <span className="text-gray-500 text-base">({indicator.unit})</span>
          )}
        </h3>
      </div>

      {indicator.description && (
        <p className="text-sm text-gray-600 leading-relaxed">
          {indicator.description}
        </p>
      )}

      <div className="relative h-[550px] w-full max-w-full rounded-lg overflow-hidden">
        <MapComponent
          key={`${indicator.id}-${selectedHydrologicalCommunity}-${selectedHydrologicalScenario}`}
          center={communityCenter}
          zoom={communityZoom}
          bounds={bounds}
          wmsLayers={[
            {
              url: workspaceUrl,
              layers: layerName,
              opacity: 1.0,
              transparent: true,
              title: indicator.name,
              unit: indicator.unit || undefined,
            },
          ]}
          showMarkers={false}
          showZoomControl={true}
          showTimeline={true}
          showLegend={true}
          showAdminLayer={true}
          adminLayers={adminLayers}
          displayFormat="Month"
          onTimeChange={(time) => onTimeChange(time, layerName, indicator.name)}
        />

        <button
          onClick={() => {
            void onDownload(layerName, indicator.name, workspaceUrl);
          }}
          className="absolute top-36 right-4 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg p-2 shadow-md transition-colors cursor-pointer z-[1000]"
          title="Descargar capa raster"
        >
          <FontAwesomeIcon icon={faFileArrowDown} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
