import { getDefaultConfig, BranchConfig } from './base';
import { hondurasConfig } from './honduras';
import { satConfig } from './sat';
import { COUNTRY_NAME } from '../config';

// Función para obtener el nombre de la rama actual basado en COUNTRY_NAME
const getCurrentBranch = (): string => {
  // Usar COUNTRY_NAME tal como está
  const countryName = COUNTRY_NAME;
  
  // Mapear nombres de países a configuraciones
  switch (countryName) {
    case 'Honduras':
      return 'honduras';
    case 'Sat Amazonia':
    case 'Sat':
      return 'sat';
    default:
      return 'default';
  }
};

// Mapa de configuraciones por rama
const branchConfigs: Record<string, BranchConfig> = {
  'default': getDefaultConfig(),
  'honduras': hondurasConfig,
  'sat': satConfig,
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
export { hondurasConfig, satConfig };
export type { BranchConfig };