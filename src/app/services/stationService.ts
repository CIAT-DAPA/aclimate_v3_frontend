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
  
  /**
   * Obtiene todas las estaciones de un país CON sus últimos datos de monitoreo
   * Este endpoint es más eficiente que hacer llamadas separadas
   * @param countryId - ID del país
   * @param days - Número de días a buscar hacia atrás (default: 1)
   */
  async getAllWithData(countryId: string, days: number = 0) {
    const response = await fetch(
      `${API_URL}/locations/by-country-ids-with-data?country_ids=${countryId}&days=${days}`
    );
    if (!response.ok) throw new Error("Error fetching stations with data");
    return response.json();
  },
  
  async getById(id: string) {
    const response = await fetch(`${API_URL}/locations/by-id?id=${id}`);
    if (!response.ok) throw new Error("Error fetching station details");
    return response.json();
  },

  async getByMachineName(machineName: string) {
    const response = await fetch(`${API_URL}/locations/by-machine-name?machine_name=${machineName}`);
    if (!response.ok) throw new Error("Error fetching station by machine name");
    return response.json();
  }
};
