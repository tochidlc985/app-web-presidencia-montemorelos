// Configuración centralizada de la API
const isProduction = import.meta.env.PROD;

// URL base para la API
export const API_BASE_URL = isProduction ? '/api' : 'http://localhost:4000';

// URL absoluta para uso en dispositivos móviles y casos especiales
export const ABSOLUTE_API_BASE_URL = isProduction
  ? (typeof window !== 'undefined' ? `${window.location.origin}/api` : '')
  : 'http://localhost:4000';

// URL ajustada para evitar problemas con rutas duplicadas
export const ADJUSTED_API_BASE_URL = API_BASE_URL;

export const API_ENDPOINTS = {
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  REPORTES: '/api/reportes',
  PERFIL: '/api/perfil',
  ESTADISTICAS: '/api/estadisticas'
};
