// Configuración centralizada de la API
const isProduction = import.meta.env.PROD;

// URL base para la API
export const API_BASE_URL = isProduction ? '' : 'http://localhost:4000';

// URL absoluta para uso en dispositivos móviles y casos especiales
export const ABSOLUTE_API_BASE_URL = isProduction
  ? (typeof window !== 'undefined' ? `${window.location.origin}` : '')
  : 'http://localhost:4000';

// URL ajustada para evitar problemas con rutas duplicadas
export const ADJUSTED_API_BASE_URL = isProduction ? '/api' : 'http://localhost:4000';

export const API_ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register',
  REPORTES: '/reportes',
  PERFIL: '/perfil',
  ESTADISTICAS: '/estadisticas'
};