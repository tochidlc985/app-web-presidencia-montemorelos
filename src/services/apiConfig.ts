// Configuración centralizada de la API
// Detectar si estamos en Vercel para usar siempre la URL de producción
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

// URL base para la API
export const API_BASE_URL = isVercel || import.meta.env.PROD
  ? ''
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
