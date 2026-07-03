import type { ModuleInfo } from "@/app/types/home";
import { SHOW_STATIONS_MODULE } from "@/app/config";
import type { BranchConfig } from "./base";

/**
 * Returns the list of modules available for the given branch config.
 * Modules are determined dynamically from config flags, not hardcoded.
 * This follows OCP: adding a new module only requires adding an object here.
 */
export const getAvailableModules = (config: BranchConfig): ModuleInfo[] => {
  const modules: ModuleInfo[] = [];

  const hc = config.home;

  // Stations module
  if (hc?.showStations ?? SHOW_STATIONS_MODULE) {
    modules.push({ key: "stations", route: "/locations", isActive: true });
  }

  // Spatial Data module - always available by default
  if (hc?.showSpatialData ?? true) {
    modules.push({ key: "spatial", route: "/spatial", isActive: true });
  }

  // Scenarios module
  if (hc?.showScenarios ?? config.showScenario) {
    modules.push({ key: "scenario", route: "/scenario", isActive: true });
  }

  return modules;
};