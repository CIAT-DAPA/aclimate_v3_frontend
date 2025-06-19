export interface Station {
  id: number;
  name: string;
  ext_id: string;
  lat: number;
  lon: number;
  visible: boolean;
  country_id: number;
  country_name: string;
  country_iso2: string;
  admin1_id: number;
  admin1_name: string; // Departamento
  admin2_id: number;
  admin2_name: string; // Municipio
}
