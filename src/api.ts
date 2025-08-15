import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD ? 'https://sistema-reportes-montemorelos.vercel.app/api' : import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
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