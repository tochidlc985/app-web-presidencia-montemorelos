// Configuración centralizada de la API - Simplificada y consistente

// URL base para la API - siempre usa /api para rutas relativas
export const API_BASE_URL = '/api';

// URL absoluta para casos especiales
export const ABSOLUTE_API_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.origin}/api` 
  : '/api';

// URL ajustada para evitar problemas
export const ADJUSTED_API_BASE_URL = '/api';

// Endpoints de la API
export const API_ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register',
  REPORTES: '/reportes',
  PERFIL: '/perfil',
  ESTADISTICAS: '/estadisticas',
  COLONIAS: '/colonias'
};

// Función para obtener la URL completa de un endpoint
export const getFullUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};
