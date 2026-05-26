import type { Metadata } from "next";
import {
  API_URL,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_REALM,
  KEYCLOAK_URL,
} from "@/app/config";
import { buildPageMetadata, SITE_NAME } from "@/app/seo";

const buildLocationLabel = (station: any) => {
  const parts = [station?.admin1_name, station?.admin2_name].filter(Boolean);
  return parts.join(", ");
};

const getClientToken = async (): Promise<string | null> => {
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
  if (
    !KEYCLOAK_URL ||
    !KEYCLOAK_REALM ||
    !KEYCLOAK_CLIENT_ID ||
    !clientSecret
  ) {
    return null;
  }

  const tokenEndpoint = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: KEYCLOAK_CLIENT_ID,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { access_token?: string };
  return data.access_token || null;
};

const getStationByMachineName = async (machineName: string) => {
  try {
    const token = await getClientToken();
    if (!token) return null;

    const response = await fetch(
      `${API_URL}/locations/by-machine-name?machine_name=${encodeURIComponent(machineName)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as any[];
    return data?.[0] ?? null;
  } catch {
    return null;
  }
};

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
    pathname: `/m/${machine_name}`,
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
