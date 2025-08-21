import { API_URL, COUNTRY_ID } from "@/app/config";

export const stationService = {
  async getAll() {
    const response = await fetch(
      `${API_URL}/locations/by-country-ids?country_ids=${COUNTRY_ID}`
    );
    if (!response.ok) throw new Error("Error fetching stations");
    return response.json();
  },
  async getById(id: string) {
    const response = await fetch(`${API_URL}/locations/by-id?id=${id}`);
    if (!response.ok) throw new Error("Error fetching station details");
    return response.json();
  },
};
