import axios from 'axios';
import { API_BASE_URL, ADJUSTED_API_BASE_URL } from './services/apiConfig';

// Determinar la URL base a usar según el entorno
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Si estamos en localhost, usar la URL ajustada
    if (window.location.hostname.includes('localhost')) {
      return ADJUSTED_API_BASE_URL;
    }
  }
  return API_BASE_URL;
};

// Usar URL base para todas las solicitudes
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000, // Aumentar timeout a 60 segundos para dar más tiempo a las solicitudes
  withCredentials: true, // Importante para CORS y cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure config.headers is defined before accessing it
      config.headers = config.headers || {};
      // Asegúrate de que el backend espera el prefijo 'Bearer '.
      config.headers.Authorization = `Bearer ${token}` as string;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de autenticación (401 Unauthorized y 403 Forbidden)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('Error de autenticación:', error.response?.status, error.response?.data);

      // Redirigir al login si el token no es válido o no tiene permisos
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');

      // Evitar redirección infinita si ya estamos en la página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Mejorar el manejo de errores de red
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('Error de conexión:', error.message);
      error.message = 'Error de conexión. Por favor, verifica tu conexión a internet.';
    }

    // Proporcionar más información sobre errores 403
    if (error.response?.status === 403) {
      console.error('Error de permisos (403):', error.response?.data);
      error.message = 'No tienes permisos para realizar esta acción.';
    }

    return Promise.reject(error);
  }
);

export default api;
