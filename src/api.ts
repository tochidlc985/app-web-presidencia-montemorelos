import axios from 'axios';
import { API_BASE_URL } from './services/apiConfig';

// Usar URL base para todas las solicitudes
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Añadir timeout para evitar peticiones colgadas (aumentado a 30 segundos)
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
    if (error.response?.status === 401) {
      // Redirigir al login si el token no es válido
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    
    // Mejorar el manejo de errores de red
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('Error de conexión:', error.message);
      error.message = 'Error de conexión. Por favor, verifica tu conexión a internet.';
    }
    
    return Promise.reject(error);
  }
);

export default api;