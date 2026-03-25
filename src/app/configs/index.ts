import { getDefaultConfig, BranchConfig } from "./base";
import { hondurasConfig } from "./honduras";
import { amazoniaConfig } from "./sat";
import { nicaraguaConfig } from "./nicaragua";
import { salvadorConfig } from "./salvador";
import { COUNTRY_NAME } from "../config";

// Función para obtener el nombre de la rama actual basado en COUNTRY_NAME
const getCurrentBranch = (): string => {
  // Usar COUNTRY_NAME en lowercase para comparación
  const countryName = COUNTRY_NAME.toLowerCase();

  // Mapear nombres de países a configuraciones (case insensitive)
  switch (countryName) {
    case "honduras":
      return "honduras";
    case "sat amazonia":
    case "sat":
    case "amazonia":
      return "amazonia";
    case "nicaragua":
      return "nicaragua";
    case "el salvador":
    case "salvador":
      return "salvador";
    default:
      return "default";
  }
};

// Mapa de configuraciones por rama
const branchConfigs: Record<string, BranchConfig> = {
  default: getDefaultConfig(),
  honduras: hondurasConfig,
  amazonia: amazoniaConfig,
  nicaragua: nicaraguaConfig,
  salvador: salvadorConfig,
};

// Hook para obtener la configuración actual
export const useBranchConfig = (): BranchConfig => {
  const currentBranch = getCurrentBranch();
  return branchConfigs[currentBranch] || getDefaultConfig();
};

// Función para obtener configuración de forma sincrónica
export const getBranchConfig = (branch?: string): BranchConfig => {
  const targetBranch = branch || getCurrentBranch();
  return branchConfigs[targetBranch] || getDefaultConfig();
};

// Exportar configuraciones específicas para uso directo
export { hondurasConfig, amazoniaConfig, nicaraguaConfig, salvadorConfig };
export type { BranchConfig };
