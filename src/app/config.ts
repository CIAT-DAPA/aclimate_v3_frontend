// API base para datos climáticos
export const API_URL = process.env.NEXT_PUBLIC_ACLIMATE_API_URL || 'http://127.0.0.1:8000';

// País actual (id y nombre) expuestos al cliente
export const COUNTRY_ID = process.env.NEXT_PUBLIC_ACLIMATE_COUNTRY_ID || '1';
export const COUNTRY_NAME = process.env.NEXT_PUBLIC_COUNTRY_NAME || 'Colombia';
export const APP_ID = process.env.NEXT_PUBLIC_ACLIMATE_APP_ID || '1';

// Usuarios/Frontend API base (servicios de usuarios, validaciones, favoritos)
export const USERS_FRONTEND_API_URL_BASE = process.env.NEXT_PUBLIC_ACLIMATE_API_FRONTEND_URL || 'http://127.0.0.1:9000/';

// Geoserver (si se usa desde el cliente)
export const GEOSERVER_URL = process.env.NEXT_PUBLIC_GEOSERVER_URL || 'https://geo.aclimate.org/geoserver/historical_climate_hn/wms';

// Configuración de Keycloak
export const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
export const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'aclimate';
export const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'aclimate_admin';