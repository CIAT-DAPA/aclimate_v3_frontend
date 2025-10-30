import { API_URL } from "@/app/config";

export const stationService = {
  /**
   * Obtiene todas las estaciones de un país
   * @param countryId - ID del país (obtener con useCountry hook)
   */
  async getAll(countryId: string) {
    const response = await fetch(
      `${API_URL}/locations/by-country-ids?country_ids=${countryId}`
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
