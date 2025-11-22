import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css'; // Asegúrate de tener Tailwind CSS configurado y los keyframes del blob
import toast from 'react-hot-toast';
// Iconos de Lucide-React: User, Mail, Lock, LogIn, UserPlus, Loader2, Info, Aperture, CheckCircle
import { Mail, Lock, LogIn, UserPlus, Loader2, Info, Aperture, CheckCircle } from 'lucide-react';
import { motion, type Easing } from 'framer-motion'; // Importamos Easing para resolver el error de tipo en transiciones
import ReactDOM from 'react-dom'; // Importa ReactDOM para el placeholder
import { API_ENDPOINTS } from '../services/apiConfig';
import api from '../api';

interface LoginResponse {
  token: string;
  usuario: {
    _id: string;
    nombre: string;
    email: string;
    rol?: string; // Para compatibilidad si todavía existe `rol`
    roles?: string[]; // Propiedad preferida
    departamento?: string;
    foto?: string | null;
    fechaRegistro?: string;
  };
}

// Componente para el placeholder de la imagen del logo (en caso de que la imagen no cargue)
const ImagePlaceholder: React.FC = () => (
  <div
    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-2
      bg-gradient-to-tr from-rose-500 to-amber-400 // Degradado cálido y distintivo
      shadow-2xl border-4 border-white transform // Sombra más profunda
      flex items-center justify-center text-white text-5xl font-extrabold
      transition-all duration-300 ease-in-out cursor-pointer group-hover:scale-105" // Escala sutil al hover del padre
  >
    <Aperture className="w-16 h-16 opacity-90 transition-transform duration-300 group-hover:rotate-6" /> {/* Icono central y animación */}
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
        throw new Error('Error al iniciar sesión. Por favor, revisa tus credenciales.');
      }

      const resData = res.data;

      // Guardar token y usuario en localStorage
      if (resData.token) {
        localStorage.setItem('token', resData.token);
        
        // Establecer la fecha de expiración del token (8 horas desde ahora)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 8);
        localStorage.setItem('token_expiry', expiryDate.getTime().toString());
      }
      if (resData.usuario) {
        const usuarioCompleto = {
          ...resData.usuario,
          _id: resData.usuario._id || '',
          nombre: resData.usuario.nombre || '',
          email: resData.usuario.email || '',
          departamento: resData.usuario.departamento || '',
          roles: Array.isArray(resData.usuario.roles) ? resData.usuario.roles : (resData.usuario.rol ? [resData.usuario.rol] : ['usuario']),
          foto: resData.usuario.foto || null,
          fechaRegistro: resData.usuario.fechaRegistro || new Date().toISOString()
        };

        localStorage.setItem('usuario', JSON.stringify(usuarioCompleto));
        
        // Forzar la actualización del contexto de autenticación
        window.dispatchEvent(new Event('storage'));
        
        // CAMBIO: Toast de éxito más vibrante
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="text-white w-5 h-5" />
            <span>¡Bienvenido! Redirigiendo...</span>
          </div>,
          {
            style: {
              background: 'linear-gradient(to right, #059669, #10B981)',
              color: '#fff',
              fontWeight: 'bold',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
            duration: 3000,
          }
        );
        setTimeout(() => {
          window.location.href = '/home'; // Mejor que navigate('/') para asegurar recarga de Contexto
        }, 1500); // Pequeño ajuste en el delay
      }
      
    } catch (err: any) {
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
        } else if (err.response.status === 500) {
          errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
        } else {
          errorMessage = err.response.data?.message || 'Error al iniciar sesión';
        }
      } else if (err.request) {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Error de red. Por favor, verifica tu conexión a internet.';
      } else {
        errorMessage = err.message || 'Error al iniciar sesión';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Definición de las variantes de animación para Framer Motion
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    // Solución para el error de tipado: usar "easeOut" as Easing o un array cubic-bezier
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" as Easing } }
  };

  return (
    // CAMBIO: Fondo más sofisticado y burbujas animadas
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 to-purple-100 relative overflow-hidden font-inter antialiased p-4">
      {/* CAMBIO: Burbujas animadas más grandes, colores pastel vibrantes y movimiento sutil */}
      <div className="absolute inset-0 z-0 pointer-events-none"> {/* Asegura que no interfieran con clicks */}
        <motion.div
          className="absolute w-72 h-72 bg-gradient-to-tr from-sky-300 to-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob-slow top-0 left-1/4"
          initial={{ x: 0, y: 0 }}
          animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-72 h-72 bg-gradient-to-tr from-purple-300 to-fuchsia-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob-slow animation-delay-4000 bottom-1/4 right-0"
          initial={{ x: 0, y: 0 }}
          animate={{ x: [0, -70, 0], y: [0, -50, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-72 h-72 bg-gradient-to-tr from-lime-300 to-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob-slow animation-delay-2000 bottom-0 left-0"
          initial={{ x: 0, y: 0 }}
          animate={{ x: [0, 90, 0], y: [0, 70, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* CAMBIO: Contenedor principal del formulario más elegante y con efecto "frosted glass" */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 12, delay: 0.2 }}
        className="relative z-10 max-w-lg w-full bg-white/95 rounded-3xl shadow-soft-xl p-8 sm:p-10 border border-gray-100 backdrop-blur-md
          transform hover:scale-[1.01] transition-all duration-400 hover:shadow-2xl-strong hover:ring-2 hover:ring-indigo-100/70"
      >
        {/* CAMBIO: Logo animado y más integrado en la estética */}
        <motion.div
          initial={{ scale: 0, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 10, delay: 0.4 }}
          className="flex justify-center mb-10 relative z-10"
        >
          <div className="w-32 h-32 relative group"> {/* Contenedor para manejar hover en el placeholder también */}
            <img
              src="/Montemorelos.jpg" // Asegúrate de que esta ruta sea correcta
              alt="Montemorelos Logo"
              className="w-full h-full rounded-full p-2
                bg-gradient-to-tr from-rose-500 to-amber-400
                shadow-2xl border-4 border-white object-contain
                transform transition-all duration-300 ease-in-out group-hover:scale-105" // Aplica hover al padre
              onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  const tempDiv = document.createElement('div');
                  ReactDOM.render(<ImagePlaceholder />, tempDiv);
                  // Usar replaceWith es ideal, si no se puede (compatibilidad), manipula innerHTML o outerHTML del padre.
                  e.currentTarget.replaceWith(tempDiv.firstChild as Node);
              }}
            />
          </div>
        </motion.div>

        {/* CAMBIO: Título y subtítulo con estilos impactantes */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-4xl sm:text-5xl font-extrabold text-indigo-900 mb-3 text-center tracking-tight leading-tight drop-shadow-sm"
        >
          ¡Bienvenido de Nuevo!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center text-purple-700 mb-9 text-lg font-medium leading-relaxed"
        >
          Inicia sesión para acceder a la plataforma del Departamento de Sistemas de <span className="font-bold text-indigo-800">Montemorelos</span>.
        </motion.p>

        {/* CAMBIO: Formulario con campos de entrada mejorados */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Campo de Correo electrónico con iconos y efecto hover */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.8 }}>
            <label className="block text-indigo-800 mb-2 text-base font-semibold" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors duration-200" />
              <input
                type="email"
                id="email"
                placeholder="ejemplo@montemorelos.gob.mx"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300
                  focus:outline-none focus:ring-3 focus:ring-indigo-200 focus:border-indigo-500
                  transition-all duration-300 bg-gray-50 text-indigo-900 font-medium shadow-inner-sm
                  placeholder-gray-400 text-lg hover:shadow-md hover:border-indigo-400 disabled:opacity-70 disabled:cursor-not-allowed"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Correo electrónico"
                autoComplete="email"
                disabled={loading} // Deshabilita el input cuando está cargando
              />
            </div>
          </motion.div>

          {/* Campo de Contraseña con iconos y efecto hover */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.9 }}>
            <label className="block text-indigo-800 mb-2 text-base font-semibold" htmlFor="password">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors duration-200" />
              <input
                type="password"
                id="password"
                placeholder="Ingresa tu contraseña" // Texto del placeholder más amigable
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300
                  focus:outline-none focus:ring-3 focus:ring-indigo-200 focus:border-indigo-500
                  transition-all duration-300 bg-gray-50 text-indigo-900 font-medium shadow-inner-sm
                  placeholder-gray-400 text-lg hover:shadow-md hover:border-indigo-400 disabled:opacity-70 disabled:cursor-not-allowed"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Contraseña"
                autoComplete="current-password"
                disabled={loading} // Deshabilita el input cuando está cargando
              />
            </div>
          </motion.div>

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
              <Info className="h-5 w-5 fill-red-400 text-red-400" strokeWidth={1.5}/>
              {error}
            </motion.div>
          )}

          {/* CAMBIO: Botón de Iniciar Sesión con Loader2 de Lucide, más grande y prominente */}
          <motion.button
            variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 1.0 }} // Añadimos variante de animación al botón
            type="submit"
            className="mt-6 relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800
              hover:from-blue-800 hover:to-indigo-900 text-white font-bold py-4 px-8 rounded-2xl
              shadow-lg hover:shadow-xl-dark transition-all duration-300 transform hover:-translate-y-1 focus:ring-4 focus:ring-blue-300/70 // Anillo de foco mejorado
              disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md group flex items-center justify-center gap-3 text-xl"
            disabled={loading}
            aria-label={loading ? "Iniciando sesión" : "Entrar al sistema"}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="animate-spin h-6 w-6 text-white" />
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <LogIn className="w-6 h-6 transition-transform duration-200 group-hover:translate-x-1" />
                <span>Entrar</span>
              </div>
            )}
          </motion.button>
        </form>

        {/* CAMBIO: Enlace de Registro con icono de Lucide y efecto de subrayado al hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }} // Animación del enlace
          className="mt-8 text-center"
        >
          <button
            className="text-indigo-700 hover:text-indigo-900 font-semibold transition-all duration-300 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-md px-3 py-1.5
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 mx-auto relative
              group"
            onClick={() => navigate('/register')}
            disabled={loading}
            aria-label="Registrarse"
          >
            <UserPlus className="h-5 w-5 text-indigo-600 group-hover:-translate-x-1 transition-transform duration-300" />
            ¿No tienes cuenta? <span className="font-bold text-indigo-800">Regístrate aquí</span>
            <span className="absolute left-0 bottom-0 h-0.5 bg-indigo-700 transition-all duration-300 ease-out w-0 group-hover:w-full"></span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;