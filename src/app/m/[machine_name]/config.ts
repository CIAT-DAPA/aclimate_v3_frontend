// Configuración para la página de detalle de estación

// Configuración dinámica de variables climáticas
export const VARIABLE_CONFIG: Record<string, { title: string; unit: string; color: string; chartType?: "bar" | "line" | "area" }> = {
  // Caudales
  'cmin': { title: 'Caudal Mínimo diario', unit: 'mm³/seg', color: '#2196F3' },
  'cmax': { title: 'Caudal máximo diario', unit: 'mm³/seg', color: '#1976D2' },
  'cmean': { title: 'Caudal medio diario', unit: 'mm³/seg', color: '#0D47A1' },
  
  // Humedad relativa
  'hrmax': { title: 'Humedad relativa máxima diaria', unit: '%', color: '#00BCD4' },
  'hrmin': { title: 'Humedad relativa mínima diaria', unit: '%', color: '#0097A7' },
  'humidity': { title: 'Humedad relativa', unit: '%', color: '#00BCD4' },
  
  // Temperaturas
  'tmax': { title: 'Temperatura máxima', unit: '°C', color: '#F44336' },
  'Tmax': { title: 'Temperatura máxima', unit: '°C', color: '#F44336' },
  'tmin': { title: 'Temperatura mínima', unit: '°C', color: '#FF9800' },
  'Tmin': { title: 'Temperatura mínima', unit: '°C', color: '#FF9800' },
  'tmean': { title: 'Temperatura media', unit: '°C', color: '#9C27B0' },
  
  // Precipitación
  'prec': { title: 'Precipitación', unit: 'mm', color: '#4CAF50', chartType: 'bar' },
  'Prec': { title: 'Precipitación', unit: 'mm', color: '#4CAF50', chartType: 'bar' },
  'precipitation': { title: 'Precipitación', unit: 'mm', color: '#4CAF50', chartType: 'bar' },
  
  // Evapotranspiración
  'et0': { title: 'Evapotranspiración', unit: 'mm', color: '#795548' },
  'evapotranspiration': { title: 'Evapotranspiración', unit: 'mm', color: '#795548' },
  
  // Radiación solar
  'rad': { title: 'Radiación solar', unit: 'MJ/m²', color: '#FF5722' },
  'Rad': { title: 'Radiación solar', unit: 'MJ/m²', color: '#FF5722' },
  'radiation': { title: 'Radiación solar', unit: 'MJ/m²', color: '#FF5722' },
  
  // Viento y presión
  'wind': { title: 'Velocidad del viento', unit: 'm/s', color: '#607D8B' },
  'pressure': { title: 'Presión atmosférica', unit: 'hPa', color: '#795548' },
};

// Mapeo de códigos de país a códigos usados en geoserver
export const countryCodeMap: Record<string, string> = {
  "1": "co", // Colombia
  "2": "hn",  // Honduras
  "3": "st",  // SAT AMAZONIA
};

// Lista de meses para selección en climatología
export const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

// Opciones para el selector de período de indicadores
export const indicatorPeriodOptions = [
  { value: "daily", label: "Diario" },
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
  { value: "seasonal", label: "Estacional" },
  { value: "decadal", label: "Decadal" },
  { value: "other", label: "Otro" },
];

// Función para obtener color de indicador
export function getIndicatorColor(indicatorKey: string): string {
  const colorMap: Record<string, string> = {
    "cold_stress": "#2196F3",
    "heat_stress": "#F44336",
    "precipitation": "#4CAF50",
    "drought": "#FF9800",
    "default": "#9C27B0"
  };

  return colorMap[indicatorKey] || colorMap.default;
}