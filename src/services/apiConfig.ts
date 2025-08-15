// Configuración centralizada de la API
export const API_BASE_URL = import.meta.env.PROD
  ? 'https://sistema-reportes-montemorelos.vercel.app'
  : '';

export const API_ENDPOINTS = {
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  REPORTES: '/api/reportes',
  PERFIL: '/api/perfil',
  ESTADISTICAS: '/api/estadisticas'
};
