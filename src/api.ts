import axios from 'axios';
import { ADJUSTED_API_BASE_URL, API_BASE_URL } from './services/apiConfig';

// Usar URL ajustada para todas las solicitudes
const api = axios.create({
  baseURL: ADJUSTED_API_BASE_URL || API_BASE_URL,
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
      // Opcional: Redirigir al login si el token no es válido
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;