import {
  API_URL,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_REALM,
  KEYCLOAK_URL,
} from "@/app/config";

export type SeoStation = {
  id?: number | string;
  name?: string;
  ext_id?: string;
  machine_name?: string;
  enable?: boolean;
  visible?: boolean;
  altitude?: number;
  latitude?: number;
  longitude?: number;
  source_id?: number | string;
  source_name?: string;
  source_type?: string;
  admin1_id?: number | string;
  admin1_name?: string;
  admin2_id?: number | string;
  admin2_name?: string;
  country_id?: number | string;
  country_name?: string;
  country_iso2?: string;
  latest_data?: {
    date?: string;
    measures?: Array<{
      measure_id?: number | string;
      measure_name?: string;
      measure_short_name?: string;
      measure_unit?: string;
      value?: number;
    }>;
  };
};

const COUNTRY_ID = process.env.NEXT_PUBLIC_ACLIMATE_APP_ID;

export const buildLocationLabel = (station: SeoStation | null) => {
  const parts = [station?.admin1_name, station?.admin2_name].filter(Boolean);
  return parts.join(", ");
};

const normalizeStationsResponse = (data: any): SeoStation[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.locations)) return data.locations;
  return [];
};

export const getClientToken = async (): Promise<string | null> => {
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (
    !KEYCLOAK_URL ||
    !KEYCLOAK_REALM ||
    !KEYCLOAK_CLIENT_ID ||
    !clientSecret
  ) {
    console.error("[stations.server] Missing Keycloak configuration");
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
    console.error("[stations.server] Error getting Keycloak token", {
      status: response.status,
    });
    return null;
  }

  const data = (await response.json()) as { access_token?: string };
  return data.access_token || null;
};

export const getStationsForSitemap = async (): Promise<SeoStation[]> => {
  try {
    if (!COUNTRY_ID) {
      console.error(
        "[sitemap] Missing NEXT_PUBLIC_ACLIMATE_APP_ID. Cannot load stations.",
      );
      return [];
    }

    const token = await getClientToken();
    if (!token) return [];

    const url = `${API_URL}/locations/by-country-ids-with-data?country_ids=${encodeURIComponent(
      COUNTRY_ID,
    )}&days=0`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 86400,
      },
    });

    if (!response.ok) {
      console.error("[sitemap] Error fetching stations", {
        status: response.status,
        url,
      });
      return [];
    }

    const data = await response.json();

    return normalizeStationsResponse(data)
      .filter((station) => station.machine_name)
      .filter((station) => station.enable !== false)
      .filter((station) => station.visible !== false);
  } catch (error) {
    console.error("[sitemap] Error loading stations:", error);
    return [];
  }
};

export const getStationByMachineName = async (
  machineName: string,
): Promise<SeoStation | null> => {
  try {
    const token = await getClientToken();
    if (!token) return null;

    const url = `${API_URL}/locations/by-machine-name?machine_name=${encodeURIComponent(
      machineName,
    )}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const stations = normalizeStationsResponse(data);

    if (!COUNTRY_ID) {
      return stations[0] ?? null;
    }

    return (
      stations.find(
        (station) => station.country_id?.toString() === COUNTRY_ID.toString(),
      ) ??
      stations[0] ??
      null
    );
  } catch {
    return null;
  }
};
