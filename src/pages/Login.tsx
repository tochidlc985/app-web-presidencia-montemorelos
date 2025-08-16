import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css'; // Asegúrate de tener Tailwind CSS configurado
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, UserPlus,  Loader2, Info, Aperture, } from 'lucide-react'; // Importa más iconos si los necesitas
import { motion } from 'framer-motion';
import ReactDOM from 'react-dom';
import { API_ENDPOINTS } from '../services/apiConfig';
import api from '../api';

interface LoginResponse {
  token: string;
  usuario: {
    _id: string;
    nombre: string;
    email: string;
    rol?: string;
    roles?: string[];
    departamento?: string;
    foto?: string | null;
    fechaRegistro?: string;
  };
}

// Componente para el placeholder de la imagen del logo (en caso de que la imagen no cargue)
const ImagePlaceholder: React.FC = () => (
  <div
    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-2
      bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500
      shadow-xl border-4 border-white
      flex items-center justify-center text-white text-5xl font-extrabold"
  >
    {/* Puedes poner iniciales, o un icono simple como 'A' o las iniciales de Montemorelos */}
    <Aperture className="w-16 h-16 opacity-80" /> {/* O puedes poner 'M' si es adecuado */}
  </div>
);

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, { email, password });

      if (!res.data) {
        const msg = 'Error al iniciar sesión. Por favor, revisa tus credenciales.';
        throw new Error(msg);
      }

      const resData = res.data;
      console.log('Respuesta del servidor:', resData);

      // Guardar token y usuario en localStorage
      if (resData.token) {
        localStorage.setItem('token', resData.token);
        console.log('Token guardado en localStorage');
      }
      if (resData.usuario) {
        const usuarioCompleto = {
          ...resData.usuario, // Primero obtenemos todas las propiedades originales
          // Luego sobrescribimos o establecemos valores predeterminados para propiedades específicas
          _id: resData.usuario._id || '',
          nombre: resData.usuario.nombre || '',
          email: resData.usuario.email || '',
          departamento: resData.usuario.departamento || '',
          roles: Array.isArray(resData.usuario.roles) ? resData.usuario.roles : [resData.usuario.rol || 'usuario'],
          foto: resData.usuario.foto || null,
          fechaRegistro: resData.usuario.fechaRegistro || new Date().toISOString()
        };

        localStorage.setItem('usuario', JSON.stringify(usuarioCompleto));
        window.dispatchEvent(new Event('storage')); // Notifica a otros componentes (ej. AuthContext) del cambio
      }

      toast.success('¡Bienvenido! Redirigiendo...');
      window.location.href = '/home';
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // CAMBIO: Fondo degradado más suave y vibrante. `min-h-screen` y centrado con `grid place-items-center`.
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden font-inter antialiased p-4">
      {/* CAMBIO: Fondo animado con círculos que se mueven y cambian de opacidad para un efecto etéreo */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 left-1/4"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-1/4 right-0"
          animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-0 left-0"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* CAMBIO: Contenedor principal con Framer Motion para una animación de entrada elegante */}
      {/* Añadimos más sombra, un borde sutil, y un hover que simula 'flotar' y brillar */}
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100, damping: 10 }}
        className="relative z-10 max-w-md w-full bg-white/85 rounded-3xl shadow-4xl p-8 sm:p-10 border border-blue-100 backdrop-blur-xl
          transform hover:scale-[1.01] transition-all duration-300 hover:shadow-2xl hover:ring-4 hover:ring-blue-100/70"
      >

        {/* CAMBIO: Logo animado y más integrado. Mejor borde degradado y placeholder. */}
        <motion.div
          initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.3 }}
          className="flex justify-center mb-10 relative z-10"
        >
          {/* CAMBIO: Utilizar ImagePlaceholder si la imagen no carga */}
          <img
            src="/Montemorelos.jpg" // Asegúrate de que esta ruta sea correcta
            alt="Montemorelos Logo"
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-2
              bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500
              shadow-xl border-4 border-white object-contain // object-contain para asegurar que el logo completo se vea
              transform hover:scale-110 hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer"
            onError={(e) => { // En caso de error de carga, reemplazar con el placeholder
                (e.target as HTMLImageElement).onerror = null; // Previene bucles infinitos
                const placeholder = document.createElement('div');
                ReactDOM.render(<ImagePlaceholder />, placeholder);
                (e.target as HTMLImageElement).replaceWith(placeholder.firstChild as Node);
            }}
          />
        </motion.div>

        {/* Título y subtítulo con estilos impactantes */}
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-3 text-blue-900 text-center tracking-tight drop-shadow-sm leading-tight">
          Bienvenido
        </h2>
        <p className="mb-9 text-indigo-700 text-center text-lg font-medium leading-relaxed">
          Inicia sesión para acceder al sistema de <span className="font-bold text-blue-800">Montemorelos</span>.
        </p>

        {/* Formulario */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

          {/* Campo de Correo electrónico con iconos y efecto hover */}
          <div className="relative group">
            <label className="block text-blue-800 mb-2 text-base font-semibold" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none transition-colors duration-200 group-focus-within:text-blue-700" />
              <input
                type="email"
                id="email"
                placeholder="ejemplo@montemorelos.gob.mx"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300
                  focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500
                  transition-all duration-200 bg-gray-50 text-blue-900 font-medium shadow-inner-sm // shadow-inner-sm para un efecto más pulcro
                  placeholder-gray-400 text-lg hover:shadow-md hover:border-blue-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Correo electrónico"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Campo de Contraseña con iconos y efecto hover */}
          <div className="relative group">
            <label className="block text-blue-800 mb-2 text-base font-semibold" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none transition-colors duration-200 group-focus-within:text-blue-700" />
              <input
                type="password"
                id="password"
                placeholder="Contraseña segura"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300
                  focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500
                  transition-all duration-200 bg-gray-50 text-blue-900 font-medium shadow-inner-sm
                  placeholder-gray-400 text-lg hover:shadow-md hover:border-blue-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Contraseña"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Mensaje de Error animado */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-medium text-center shadow-inner mt-2 flex items-center justify-center gap-2"
              role="alert"
            >
              <Info className="h-5 w-5 fill-red-400 text-red-400" strokeWidth={1.5}/> {/* Icono de Info o AlertCircle */}
              {error}
            </motion.div>
          )}

          {/* Botón de Iniciar Sesión con Loader2 de Lucide, más grande y prominente */}
          <button
            type="submit"
            className="mt-6 relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800
              hover:from-blue-800 hover:to-indigo-900 text-white font-bold py-4 px-8 rounded-2xl
              shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl
              focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-70 // Anillo de foco más prominente
              disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md group"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="animate-spin h-6 w-6 text-white" /> {/* Loader de Lucide */}
                <span className="text-xl z-10">Iniciando sesión...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                {/* CAMBIO: Icono LogIn animado al hover */}
                <LogIn className="w-6 h-6 transition-transform duration-200 group-hover:translate-x-1" />
                <span className="text-xl z-10">Entrar</span>
              </div>
            )}
          </button>
        </form>

        {/* Enlace de Registro con icono de Lucide y efecto de subrayado al hover */}
        <div className="mt-8 text-center">
          <button
            className="text-indigo-700 hover:text-indigo-900 font-semibold transition
              focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-md px-3 py-1.5 // rounded-md para un foco más suave
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 mx-auto relative // relative para el after
              group" // Añade el grupo para el efecto after
            onClick={() => navigate('/register')}
            disabled={loading}
            aria-label="Registrarse"
          >
            <UserPlus className="h-5 w-5 text-indigo-600" />
            ¿No tienes cuenta? <span className="font-bold">Regístrate</span>
            {/* CAMBIO: Underline animado */}
            <span className="absolute left-0 bottom-0 h-0.5 bg-indigo-700 transition-all duration-300 ease-out w-0 group-hover:w-full"></span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;