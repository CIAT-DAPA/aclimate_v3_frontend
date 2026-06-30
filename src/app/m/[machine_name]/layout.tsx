import type { Metadata } from "next";
import { buildPageMetadata, SITE_NAME } from "@/app/seo";
import {
  buildLocationLabel,
  getStationByMachineName,
} from "@/app/lib/stations.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ machine_name: string }>;
}): Promise<Metadata> {
  const { machine_name } = await params;
  const station = await getStationByMachineName(machine_name);

  const stationName = station?.name || "Estación climática";
  const locationLabel = buildLocationLabel(station);

  const title = station?.name ? stationName : "Estación climática";

  const description = station?.name
    ? `Datos históricos, indicadores y series de la estación ${stationName}${locationLabel ? ` en ${locationLabel}` : ""}.`
    : `Información detallada de la estación climática seleccionada en ${SITE_NAME}.`;

  return buildPageMetadata({
    title,
    description,
    pathname: `/m/${encodeURIComponent(machine_name)}`,
    type: "article",
    keywords: ["estación", stationName, locationLabel, SITE_NAME].filter(
      Boolean,
    ) as string[],
  });
}

export default function StationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
