import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css'; // Asegúrate de tener Tailwind CSS configurado
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
// Importa los iconos de Lucide-React
import { User, Mail, Lock, UserPlus, Loader2, Users, Info, LogIn } from 'lucide-react'; // Añadido 'Info' y 'LogIn'
import BackgroundMedia from '../components/BackgroundMedia';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('usuario');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);
  const validatePassword = (password: string) => password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Validaciones
    if (!name.trim()) {
      const msg = 'El nombre es obligatorio.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!email.trim()) {
        const msg = 'El correo electrónico es obligatorio.';
        setError(msg);
        toast.error(msg);
        return;
      }
    if (!password.trim()) {
        const msg = 'La contraseña es obligatoria.';
        setError(msg);
        toast.error(msg);
        return;
      }
    if (!validateEmail(email)) {
      const msg = 'Correo electrónico inválido.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!validatePassword(password)) {
      const msg = 'La contraseña debe tener al menos 8 caracteres.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const payload = { nombre: name, email, password, rol: role }; // 'rol' minúscula
      const res = await fetch(`${import.meta.env.PROD ? 'https://sistema-reportes-montemorelos.vercel.app/api' : import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      const responseText = await res.text();
      if (!responseText) {
        if (res.ok) {
          data = { message: 'Registro exitoso (respuesta vacía, pero status OK).' };
        } else {
          throw new Error(`Error ${res.status}: Respuesta vacía o no válida.`);
        }
      } else {
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('Error al parsear JSON:', jsonError);
          console.log('Respuesta cruda del servidor:', responseText);
          throw new Error('El servidor envió una respuesta no válida o inesperada.');
        }
      }

      if (!res.ok) {
        const msg = data?.message || `Error ${res.status}: ${res.statusText || 'al registrarse.'}`;
        throw new Error(msg);
      }

      toast.success('Registro exitoso. Redirigiendo para iniciar sesión...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor principal con fondo de media
    <div className="min-h-screen grid place-items-center relative overflow-hidden font-inter antialiased p-4">
      {/* Componente para el fondo de imagen o video */}
      <BackgroundMedia 
        type="image" 
        src="" 
        opacity={0.4}
        blur={1}
      />

      {/* CAMBIO: Tarjeta principal de registro con Framer Motion y estilo unificado */}
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100, damping: 10 }}
        className="relative z-10 max-w-md w-full bg-white/85 rounded-3xl shadow-4xl p-8 sm:p-10 border border-blue-100 backdrop-blur-xl
          transform hover:scale-[1.01] transition-all duration-300 hover:shadow-2xl hover:ring-4 hover:ring-blue-100/70"
      >

        {/* CAMBIO: Icono interactivo de Registro con un nuevo degradado vibrante */}
        <motion.div
          initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.3 }}
          className="flex justify-center mb-10 relative z-10"
        >
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-tr from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center
                      shadow-xl border-4 border-white
                      transform hover:scale-110 hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer">
            <UserPlus className="w-16 h-16 sm:w-16 sm:h-16 text-white" strokeWidth={1.5} /> {/* Icono de registro */}
          </div>
        </motion.div>

        {/* CAMBIO: Título y subtítulo con estilo de Home/Login */}
        <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-900 mb-3 text-center tracking-tight drop-shadow-sm leading-tight">
          Crea tu cuenta
        </h2>
        <p className="text-center text-indigo-700 mb-9 text-lg font-medium leading-relaxed">
          ¡Únete a la plataforma de <span className="font-bold text-blue-800">Montemorelos</span>!
        </p>

        {/* CAMBIO: Formulario con estilos actualizados */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Campo Nombre completo */}
          <div className="relative group">
            <label className="block text-blue-800 mb-2 text-base font-semibold" htmlFor="name">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none transition-colors duration-200 group-focus-within:text-blue-700" />
              <input
                type="text"
                id="name"
                placeholder="Tu nombre completo"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300
                  focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500
                  transition-all duration-200 bg-gray-50 text-blue-900 font-medium shadow-inner-sm
                  placeholder-gray-400 text-lg hover:shadow-md hover:border-blue-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-label="Nombre completo"
              />
            </div>
          </div>

          {/* Campo Correo electrónico */}
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
                  transition-all duration-200 bg-gray-50 text-blue-900 font-medium shadow-inner-sm
                  placeholder-gray-400 text-lg hover:shadow-md hover:border-blue-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Correo electrónico"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="relative group">
            <label className="block text-blue-800 mb-2 text-base font-semibold" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none transition-colors duration-200 group-focus-within:text-blue-700" />
              <input
                type="password"
                id="password"
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300
                  focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500
                  transition-all duration-200 bg-gray-50 text-blue-900 font-medium shadow-inner-sm
                  placeholder-gray-400 text-lg hover:shadow-md hover:border-blue-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Contraseña"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Selector de Rol */}
          <div className="relative group">
            <label className="block text-blue-800 mb-2 text-base font-semibold" htmlFor="role">
              Rol
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none transition-colors duration-200 group-focus-within:text-blue-700 z-20" />
              <select
                id="role"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300
                  focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500
                  transition-all duration-200 appearance-none bg-gray-50 text-blue-900 font-medium shadow-inner-sm hover:shadow-md hover:border-blue-400
                  bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat cursor-pointer" // Aumento el tamaño del ícono de flecha y le doy cursor pointer
                style={{
                    // Icono de flecha de Lucide-React codificado en SVG para la consistencia
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234F46E5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-chevron-down'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
                }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Seleccionar rol"
              >
                <option value="usuario">Usuario/a</option>
                <option value="administrador">Administrador</option>
                <option value="jefe">Jefe de Departamento</option>
                <option value="tecnico">Técnico</option>
              </select>
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
              <Info className="h-5 w-5 fill-red-400 text-red-400" strokeWidth={1.5} />
              {error}
            </motion.div>
          )}

          {/* Botón de Registro con nuevo degradado y animación */}
          <button
            type="submit"
            className="mt-6 relative overflow-hidden bg-gradient-to-r from-emerald-600 to-cyan-700
              hover:from-emerald-700 hover:to-cyan-800 text-white font-bold py-4 px-8 rounded-2xl
              shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl
              focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:ring-opacity-70
              disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md group"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="animate-spin h-6 w-6 text-white" />
                <span className="text-xl z-10">Registrando...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <UserPlus className="w-6 h-6 transition-transform group-hover:scale-110" />
                <span className="text-xl z-10">Registrarse</span>
              </div>
            )}
          </button>
        </form>

        {/* Enlace para Iniciar Sesión con icono de Login y efecto de subrayado */}
        <div className="mt-8 text-center">
          <button
            className="text-indigo-700 hover:text-indigo-900 font-semibold transition
              focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-md px-3 py-1.5
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 mx-auto relative
              group"
            onClick={() => navigate('/login')}
            disabled={loading}
            aria-label="Iniciar sesión"
          >
            <LogIn className="h-5 w-5 text-indigo-600" /> {/* Ícono de LogIn */}
            ¿Ya tienes cuenta? <span className="font-bold">Inicia sesión</span>
            <span className="absolute left-0 bottom-0 h-0.5 bg-indigo-700 transition-all duration-300 ease-out w-0 group-hover:w-full"></span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;