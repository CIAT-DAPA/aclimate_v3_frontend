import { API_URL } from "@/app/config";

export interface IndicatorFeature {
  id: number;
  country_indicator_id: number;
  title: string;
  description: string;
  type: string;
}

export const getIndicatorFeatures = async (
  indicatorId: number,
  countryId: number,
  type?: "feature" | "recommendation",
): Promise<IndicatorFeature[]> => {
  try {
    const url = new URL(
      `${API_URL}/indicator-features/by-indicator-and-country`,
    );
    url.searchParams.append("indicator_id", indicatorId.toString());
    url.searchParams.append("country_id", countryId.toString());

    if (type) {
      url.searchParams.append("type", type);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch indicator features: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching indicator features:", error);
    return [];
  }
};
