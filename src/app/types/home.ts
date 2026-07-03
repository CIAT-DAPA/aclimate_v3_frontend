export interface ModuleInfo {
  /** Unique key for the module, used for i18n lookups */
  key: string;
  /** Route path for the module link */
  route: string;
  /** Whether this module should be displayed */
  isActive: boolean;
}