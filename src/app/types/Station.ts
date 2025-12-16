export interface Station {
  id: number;
  name: string;
  ext_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  visible?: boolean;
  enable: boolean;
  country_id: number;
  country_name: string;
  country_iso2: string;
  admin1_id: number;
  admin1_name: string; // Departamento
  admin1_ext_id?: string;
  admin2_id: number;
  admin2_name: string; // Municipio
  admin2_ext_id?: string;
  source?: string;
}
