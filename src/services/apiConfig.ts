// Configuración centralizada de la API
// Detectar si estamos en Vercel para usar siempre la URL de producción
const isVercel = window.location.hostname.includes('vercel.app');

export const API_BASE_URL = isVercel || import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE_URL || 'https://sistema-reportes-montemorelos.vercel.app'
  : 'http://localhost:4000';

// Ajustar la URL base para Vercel para evitar la doble ruta /api/api/
export const ADJUSTED_API_BASE_URL = isVercel || import.meta.env.PROD
  ? (import.meta.env.VITE_API_BASE_URL || 'https://sistema-reportes-montemorelos.vercel.app').replace('/api', '')
  : 'http://localhost:4000';

export const API_ENDPOINTS = {
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  REPORTES: '/api/reportes',
  PERFIL: '/api/perfil',
  ESTADISTICAS: '/api/estadisticas'
};
