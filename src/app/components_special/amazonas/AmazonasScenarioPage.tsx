"use client";

import {
  Map,
  FileText,
  Waves,
  ThermometerSun,
  Leaf,
  Info,
  Sprout,
  Calendar,
} from "lucide-react";
import React, { useRef, useCallback, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import dynamic from "next/dynamic";
import Link from "next/link";
import { GEOSERVER_URL } from "@/app/config";
import { Station } from "@/app/types/Station";
import {
  getIndicatorFeatures,
  IndicatorFeature,
} from "@/app/services/indicatorFeatureService";
import { useBranchConfig } from "@/app/configs";
import { spatialService } from "@/app/services/spatialService";
import { useCountry } from "@/app/contexts/CountryContext";

const MapComponent = dynamic(() => import("@/app/components/MapComponent"), {
  ssr: false,
});

const DEPARTMENTS = {
  amazonas: {
    name: "Amazonas",
    communities: [
      { id: "el_progreso", name: "El progreso", lat: -4.01487, lon: -70.11267 },
      { id: "loma_linda", name: "Loma Linda", lat: -3.79104, lon: -70.42497 },
      {
        id: "maloka_yaguas",
        name: "Maloka Yaguas",
        lat: -4.01807,
        lon: -70.10704,
      },
      {
        id: "nuevo_jardin",
        name: "Nuevo Jardin",
        lat: -4.00604,
        lon: -70.13428,
      },
      {
        id: "nuevo_paraiso",
        name: "Nuevo Paraiso",
        lat: -3.75821,
        lon: -70.40201,
      },
      {
        id: "san_francisco",
        name: "San Francisco",
        lat: -3.76334,
        lon: -70.39101,
      },
      { id: "santa_sofia", name: "Santa Sofia", lat: -4.00521, lon: -70.13175 },
      {
        id: "santa_teresita",
        name: "Santa Teresita",
        lat: -3.74929,
        lon: -70.42415,
      },
    ],
  },
  /* caqueta: {
    name: "Caquetá",
    communities: [
      {
        id: "alto_zabaleta",
        name: "Alto Zabaleta",
        lat: 1.24683,
        lon: -76.20804,
      },
      { id: "la_alberto", name: "La Alberto", lat: 1.13469, lon: -76.19996 },
      {
        id: "la_primavera",
        name: "La Primavera",
        lat: 1.16317,
        lon: -76.19873,
      },
      {
        id: "resguardo_san_miguel",
        name: "Resguardo San Miguel",
        lat: 1.14353,
        lon: -76.25037,
      },
    ],
  }, */
};

export default function AmazonasScenarioPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { idCountry } = useBranchConfig();
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");
  const [customLocation, setCustomLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [scenarioName, setScenarioName] = useState<string>(
    "Ninguna ubicación seleccionada",
  );
  const [scenarioFeatures, setScenarioFeatures] = useState<IndicatorFeature[]>(
    [],
  );
  const [scenarioRecommendations, setScenarioRecommendations] = useState<
    IndicatorFeature[]
  >([]);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);

  const [adminLayers, setAdminLayers] = useState<
    Array<{ name: string; workspace: string; store: string; layer: string }>
  >([]);
  const [loadingAdminLayers, setLoadingAdminLayers] = useState<boolean>(true);
  const [layerDate, setLayerDate] = useState<string>("");
  const [latestForecastTime, setLatestForecastTime] = useState<string>("");

  const { countryId } = useCountry();

  const countryCodeMap: Record<string, string> = {
    "1": "co",
    "2": "hn",
    "3": "st",
  };
  const countryCode = countryCodeMap[countryId || "2"] || "hn";

  useEffect(() => {
    const loadAdminLayers = async () => {
      setLoadingAdminLayers(true);
      try {
        const layers = await spatialService.getAdminLayers(
          GEOSERVER_URL,
          countryCode,
        );
        setAdminLayers(layers);
      } catch (error) {
        console.error("Error cargando capas administrativas:", error);
        setAdminLayers([]);
      } finally {
        setLoadingAdminLayers(false);
      }
    };

    loadAdminLayers();
  }, [countryCode]);

  useEffect(() => {
    const fetchDate = async () => {
      try {
        const dates = await spatialService.getDatesFromGeoserver(
          `${GEOSERVER_URL}/climate_forecast_st/wms`,
          "climate_forecast_st:climate_forecast_st_monthly",
        );
        if (dates && dates.length > 0) {
          const dateStr = dates[dates.length - 1];
          setLatestForecastTime(dateStr);
          const [year, month, day] = dateStr.split("-");
          const dateObj = new Date(
            Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
          );
          const monthName = dateObj.toLocaleString("es-ES", {
            month: "long",
            timeZone: "UTC",
          });
          const capitalizedMonth =
            monthName.charAt(0).toUpperCase() + monthName.slice(1);
          setLayerDate(`${capitalizedMonth} de ${year}`);
        }
      } catch (err) {
        console.error("Error cargando fecha de la capa:", err);
      }
    };
    fetchDate();
  }, []);

  const getIconForTitle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("lluvia y calor"))
      return <ThermometerSun size={24} strokeWidth={1.5} />;
    if (t.includes("suelo y cultivo"))
      return <Sprout size={24} strokeWidth={1.5} />;
    if (t.includes("dia a dia") || t.includes("día a día"))
      return <Calendar size={24} strokeWidth={1.5} />;
    if (t.includes("hidrologica") || t.includes("hidrológica"))
      return <Waves size={24} strokeWidth={1.5} />;
    if (t.includes("agricola") || t.includes("agrícola"))
      return <Leaf size={24} strokeWidth={1.5} />;
    return <Info size={24} strokeWidth={1.5} />;
  };

  const getScenarioStyle = () => {
    const s = scenarioName.toLowerCase();
    if (s.includes("invierno")) {
      return { backgroundColor: "#2B83BA20", color: "#2B83BA" };
    } else if (s.includes("normal")) {
      return { backgroundColor: "#DEFFB540", color: "#7ea336" };
    } else if (s.includes("verano")) {
      return { backgroundColor: "#D7191C20", color: "#D7191C" };
    }
    return { backgroundColor: "#f3f4f6", color: "#4b5563" };
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDept(e.target.value);
    setSelectedCommunity("");
    setCustomLocation(null);
  };

  const handleCommunityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCommunity(e.target.value);
    setCustomLocation(null);
  };

  const selectedDeptData = selectedDept
    ? DEPARTMENTS[selectedDept as keyof typeof DEPARTMENTS]
    : null;
  const selectedCommunityData = selectedDeptData?.communities.find(
    (c) => c.id === selectedCommunity,
  );

  const activeLocationLatLon = React.useMemo(() => {
    return (
      customLocation ||
      (selectedCommunityData
        ? { lat: selectedCommunityData.lat, lon: selectedCommunityData.lon }
        : null)
    );
  }, [customLocation, selectedCommunityData]);

  const downloadRasterFile = async () => {
    try {
      const layerName = "climate_forecast_st:climate_forecast_st_monthly";
      const wmsUrl = `${GEOSERVER_URL}/${layerName.split(":")[0]}/wms`;
      const bbox = "-76.0,-5.5,-66.5,3.0";

      let timeValue = latestForecastTime;
      if (!timeValue) {
        const dates = await spatialService.getDatesFromGeoserver(
          wmsUrl,
          layerName,
        );
        if (dates.length > 0) {
          timeValue = dates[dates.length - 1];
        }
      }

      const url = `${wmsUrl}?service=WMS&request=GetMap&version=1.3.0&layers=${layerName}&styles=&format=image/geotiff${timeValue ? `&time=${timeValue}` : ""}&bbox=${bbox}&width=1024&height=1024&crs=EPSG:4326`;

      const link = document.createElement("a");
      link.href = url;
      link.download = `Pronostico_Climatico_Mensual${timeValue ? `_${timeValue}` : ""}.tiff`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error descargando archivo raster:", error);
      alert(
        "Ocurrió un error al descargar la capa. Por favor, intenta de nuevo.",
      );
    }
  };

  useEffect(() => {
    if (!activeLocationLatLon) {
      setScenarioName("Ninguna ubicación seleccionada");
      setScenarioFeatures([]);
      setScenarioRecommendations([]);
      return;
    }

    const fetchScenario = async () => {
      try {
        setScenarioName("Cargando...");
        setLoadingContent(true);
        const { lat, lon } = activeLocationLatLon;

        const offset = 0.01;
        const bbox = `${lon - offset},${lat - offset},${lon + offset},${lat + offset}`;
        const layer = "climate_forecast_st:climate_forecast_st_monthly";

        const url = `${GEOSERVER_URL}/${layer.split(":")[0]}/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=${layer}&LAYERS=${layer}&INFO_FORMAT=application%2Fjson&X=50&Y=50&WIDTH=101&HEIGHT=101&SRS=EPSG%3A4326&BBOX=${bbox}${latestForecastTime ? `&TIME=${encodeURIComponent(latestForecastTime)}` : ""}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const properties = data.features[0].properties;
          const value =
            properties.GRAY_INDEX ??
            properties.PALETTE_INDEX ??
            Object.values(properties)[0];

          const SCENARIO_MAP: Record<
            string,
            { label: string; indicatorId: number }
          > = {
            "3": { label: "Invierno", indicatorId: 16 },
            "2": { label: "Normal", indicatorId: 15 },
            "1": { label: "Verano", indicatorId: 14 },
          };

          const matchedScenario = SCENARIO_MAP[String(value)];
          if (matchedScenario) {
            setScenarioName(matchedScenario.label);

            const [fetchedFeatures, fetchedRecommendations] = await Promise.all(
              [
                getIndicatorFeatures(
                  matchedScenario.indicatorId,
                  idCountry,
                  "feature",
                ),
                getIndicatorFeatures(
                  matchedScenario.indicatorId,
                  idCountry,
                  "recommendation",
                ),
              ],
            );

            const toCamelCase = (str: string) => {
              if (!str) return "";
              return str
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
                  return index === 0 ? word.toLowerCase() : word.toUpperCase();
                })
                .replace(/\s+/g, "");
            };

            const filterAndFormat = (
              items: IndicatorFeature[],
              dept?: string,
              comm?: string,
            ) => {
              const normDept = dept ? toCamelCase(dept) : null;
              const normComm = comm ? toCamelCase(comm) : null;

              const uniqueTitles = new Set<string>();

              return items.reduce((acc, item) => {
                const parts = item.title.split("_");
                const nameTitle = parts[0] ? parts[0].trim() : item.title;
                const itemDept = parts[1] ? toCamelCase(parts[1]) : null;
                const itemComm = parts[2] ? toCamelCase(parts[2]) : null;

                if (normDept && itemDept && itemDept !== normDept) return acc;
                if (normComm && itemComm && itemComm !== normComm) return acc;

                if (!uniqueTitles.has(nameTitle)) {
                  uniqueTitles.add(nameTitle);
                  acc.push({ ...item, title: nameTitle });
                }

                return acc;
              }, [] as IndicatorFeature[]);
            };

            setScenarioFeatures(
              filterAndFormat(
                fetchedFeatures,
                selectedDeptData?.name,
                selectedCommunityData?.name,
              ),
            );
            setScenarioRecommendations(
              filterAndFormat(
                fetchedRecommendations,
                selectedDeptData?.name,
                selectedCommunityData?.name,
              ),
            );
          } else {
            setScenarioName(`Escenario (Valor: ${value})`);
            setScenarioFeatures([]);
            setScenarioRecommendations([]);
          }
        } else {
          setScenarioName("Sin datos para esta zona");
          setScenarioFeatures([]);
          setScenarioRecommendations([]);
        }
      } catch (error) {
        console.error("Error al obtener el escenario:", error);
        setScenarioName("Error al obtener datos");
        setScenarioFeatures([]);
        setScenarioRecommendations([]);
      } finally {
        setLoadingContent(false);
      }
    };

    fetchScenario();
  }, [
    activeLocationLatLon,
    selectedDeptData,
    selectedCommunityData,
    idCountry,
    latestForecastTime,
  ]);

  const mapStations = selectedCommunityData
    ? ([
        {
          id: 1,
          name: selectedCommunityData.name,
          ext_id: "1",
          machine_name: selectedCommunityData.id,
          latitude: selectedCommunityData.lat,
          longitude: selectedCommunityData.lon,
          enable: true,
          country_id: 1,
          country_name: "CO",
          country_iso2: "CO",
          admin1_id: 1,
          admin1_name: selectedDeptData?.name || "",
          admin2_id: 1,
          admin2_name: selectedCommunityData.name,
        },
      ] as Station[])
    : customLocation
      ? ([
          {
            id: 1,
            name: "Ubicación seleccionada",
            ext_id: "1",
            machine_name: "custom",
            latitude: customLocation.lat,
            longitude: customLocation.lon,
            enable: true,
            country_id: 1,
            country_name: "CO",
            country_iso2: "CO",
            admin1_id: 1,
            admin1_name: "Ubicación",
            admin2_id: 1,
            admin2_name: "seleccionada",
          },
        ] as Station[])
      : [];

  const mapCenter = activeLocationLatLon
    ? ([activeLocationLatLon.lat, activeLocationLatLon.lon] as [number, number])
    : ([-1.25, -71.25] as [number, number]);

  const mapZoom = activeLocationLatLon ? 8 : 6;

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setCustomLocation({ lat, lon: lng });
    setSelectedDept("");
    setSelectedCommunity("");
  }, []);

  const downloadPdf = useCallback(() => {
    if (contentRef.current === null) {
      return;
    }

    toPng(contentRef.current, { cacheBust: true, backgroundColor: "#fafafa" })
      .then((dataUrl) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          const pdfWidth = img.width * 0.264583;
          const pdfHeight = img.height * 0.264583;

          const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? "l" : "p",
            unit: "mm",
            format: [pdfWidth, pdfHeight],
          });

          pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save("escenario_climatico.pdf");
        };
      })
      .catch((err) => {
        console.error("Error generating PDF", err);
      });
  }, []);

  return (
    <div className="min-h-[calc(100vh-theme(spacing.16))] bg-zinc-50 dark:bg-zinc-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 pb-20">
        <div ref={contentRef} className="mx-auto flex flex-col gap-12 p-4">
          <div className="border-l-4 border-[#c86b24] pl-5 sm:pl-8 bg-white p-6 rounded-lg shadow-sm">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-3xl font-semibold text-[#283618]">
                  Escenarios Climáticos
                </h1>
                {layerDate && (
                  <span className="inline-block text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 shadow-sm self-start sm:self-auto">
                    {layerDate}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-lg">
                ¡Bienvenido! Aquí puedes explorar el pronóstico climático de tu
                región. Busca y haz clic en cualquier lugar del mapa, o utiliza
                los selectores para elegir un departamento y comunidad.
                Descubrirás las características y las mejores recomendaciones
                para el escenario pronosticado.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select
                  value={selectedDept}
                  onChange={handleDeptChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-green focus:border-brand-green p-2 border text-black"
                >
                  <option value="">Seleccione un departamento...</option>
                  {Object.entries(DEPARTMENTS).map(([key, dept]) => (
                    <option key={key} value={key}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comunidad
                </label>
                <select
                  value={selectedCommunity}
                  onChange={handleCommunityChange}
                  disabled={!selectedDept}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-green focus:border-brand-green p-2 border disabled:bg-gray-100 disabled:text-gray-500 text-black"
                >
                  <option value="">Seleccione una comunidad...</option>
                  {selectedDept &&
                    DEPARTMENTS[
                      selectedDept as keyof typeof DEPARTMENTS
                    ].communities.map((comm) => (
                      <option key={comm.id} value={comm.id}>
                        {comm.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Map className="text-blue-600" size={24} />
                  <h2 className="text-xl font-medium text-gray-800">
                    {scenarioName}
                  </h2>
                </div>
              </div>

              <div className="relative w-full h-[400px] bg-sky-50 flex items-center justify-center overflow-hidden">
                {loadingAdminLayers ? (
                  <div className="flex items-center justify-center h-full w-full bg-gray-50 z-10 absolute inset-0">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                      <span className="mt-3 text-gray-500 font-medium">
                        Cargando mapa...
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <MapComponent
                      center={mapCenter}
                      zoom={mapZoom}
                      stations={mapStations as Station[]}
                      wmsLayers={[
                        {
                          url: `${GEOSERVER_URL}/climate_forecast_st/wms`,
                          layers:
                            "climate_forecast_st:climate_forecast_st_monthly",
                          time: latestForecastTime || undefined,
                          opacity: 1.0,
                          transparent: true,
                          title: "Pronóstico Climático Mensual",
                          unit: "",
                        },
                      ]}
                      adminLayers={adminLayers}
                      showMarkers={mapStations.length > 0}
                      showZoomControl={true}
                      showTimeline={false}
                      showLegend={true}
                      showAdminLayer={true}
                      onMapClick={handleMapClick}
                    />

                    <button
                      onClick={downloadRasterFile}
                      className="absolute top-36 right-4 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg p-2 shadow-md transition-colors cursor-pointer z-[1000]"
                      title="Descargar capa raster de pronóstico"
                    >
                      <FontAwesomeIcon
                        icon={faFileArrowDown}
                        className="h-4 w-4"
                      />
                    </button>
                  </>
                )}
              </div>

              <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-white">
                <Link
                  href={`/spatial/${countryId || "3"}#forecast-pct-accordion`}
                  className="text-sm text-blue-700 hover:text-blue-900 underline font-medium"
                >
                  Desea ver más información?
                </Link>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-[#283618] pl-5 sm:pl-8 bg-white p-6 rounded-lg shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-[#283618] mb-4">
                Características de la zona: {scenarioName}
              </h2>
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold text-gray-700 w-1/4">
                        Categoría
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-700 w-3/4">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    {loadingContent ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-center">
                          Cargando características...
                        </td>
                      </tr>
                    ) : scenarioFeatures.length > 0 ? (
                      scenarioFeatures.map((feature, idx) => (
                        <tr key={feature.id ?? idx}>
                          <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                            <div
                              style={getScenarioStyle()}
                              className="p-2 rounded-lg"
                            >
                              {getIconForTitle(feature.title)}
                            </div>
                            {feature.title}
                          </td>
                          <td className="px-6 py-4">{feature.description}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-center">
                          {!selectedCommunityData
                            ? "Selecciona una comunidad para ver sus características."
                            : "No hay características disponibles para esta zona."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-[#c86b24] pl-5 sm:pl-8 relative bg-white p-6 rounded-lg shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-[#283618] mb-1">
                Recomendaciones: {scenarioName}
              </h2>
              <p className="text-gray-600 mb-4">
                Basadas en escenarios climáticos y probabilidades de
                precipitación
              </p>
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold text-gray-700 w-1/3">
                        Recomendación
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-700 w-2/3">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    {loadingContent ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-center">
                          Cargando recomendaciones...
                        </td>
                      </tr>
                    ) : scenarioRecommendations.length > 0 ? (
                      scenarioRecommendations.map((rec, idx) => (
                        <tr key={rec.id ?? idx}>
                          <td className="px-6 py-4 flex items-center gap-3 font-medium text-gray-800">
                            <div
                              style={getScenarioStyle()}
                              className="p-2 rounded-lg"
                            >
                              {getIconForTitle(rec.title)}
                            </div>
                            {rec.title}
                          </td>
                          <td className="px-6 py-4">{rec.description}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-center">
                          {!selectedCommunityData
                            ? "Selecciona una comunidad para ver recomendaciones."
                            : "No hay recomendaciones disponibles para esta zona."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={downloadPdf}
        className="fixed bottom-8 right-8 bg-[#c86b24] hover:bg-[#a6561b] text-white p-4 rounded-full shadow-lg transition-all border-4 border-white z-50 cursor-pointer hover:scale-110 active:scale-95"
        title="Descargar reporte en PDF"
      >
        <FileText size={28} />
      </button>
    </div>
  );
}
