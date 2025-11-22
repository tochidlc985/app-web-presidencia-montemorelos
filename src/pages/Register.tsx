import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css'; // Asegúrate de tener Tailwind CSS configurado
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
// Importa los iconos de Lucide-React
import { User, Mail, Lock, UserPlus, Loader2, Users, Info, LogIn } from 'lucide-react'; 
import { API_ENDPOINTS } from '../services/apiConfig';
import api from '../api';

// No es necesario importar BackgroundMedia si no lo estás utilizando directamente aquí para el efecto de burbujas,
// ya que el fondo se maneja con motion.div dentro del componente.
// Si `BackgroundMedia` es para algo más, puedes dejarlo o quitarlo según necesites.

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('usuario');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);
  const validatePassword = (password: string) => password.length >= 8;

  // Función para calcular el progreso del formulario
  const calculateProgress = () => {
    let completedFields = 0;
    const totalFields = 4; // Total de campos obligatorios

    // Verificar cada campo obligatorio
    if (name.trim()) completedFields++;
    if (email.trim() && validateEmail(email)) completedFields++;
    if (password.trim() && validatePassword(password)) completedFields++;
    if (role) completedFields++;

    // Calcular porcentaje (máximo 100%)
    const newProgress = Math.min(100, Math.round((completedFields / totalFields) * 100));
    setProgress(newProgress);
    return newProgress;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Validaciones
    if (!name.trim()) {
      const msg = 'El nombre es obligatorio.';
      setError(msg);
      toast.error(msg);
      setLoading(false); // Asegúrate de restablecer el estado de carga
      return;
    }
    if (!email.trim()) {
        const msg = 'El correo electrónico es obligatorio.';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }
    if (!password.trim()) {
        const msg = 'La contraseña es obligatoria.';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }
    if (!validateEmail(email)) {
      const msg = 'Correo electrónico inválido.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }
    if (!validatePassword(password)) {
      const msg = 'La contraseña debe tener al menos 8 caracteres.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // El backend podría esperar `rol` o `roles`. Se usa `rol` por la forma en que lo tienes en el estado.
      const payload = { nombre: name, email, password, rol: role }; 
      const res = await api.post(API_ENDPOINTS.REGISTER, payload);

      if (!res.data) {
        throw new Error('Error al registrar. Por favor, intenta de nuevo.');
      }

      toast.success('Registro exitoso. Redirigiendo para iniciar sesión...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      let errorMessage = 'Error al registrar usuario';
      
      if (err.response) {
        if (err.response.status === 409) {
          errorMessage = 'El correo electrónico ya está registrado.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message; // Mensaje del backend si existe
        } else if (err.response.status === 500) {
          errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
        } else {
          errorMessage = 'Ocurrió un error inesperado al registrar.';
        }
      } else if (err.request) {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      } else {
        errorMessage = err.message || 'Error desconocido al registrar usuario';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    // CAMBIO: Contenedor principal con el mismo estilo de fondo del Login
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden font-inter antialiased p-4">
      {/* CAMBIO: Fondo animado con círculos que se mueven y cambian de opacidad (igual que en Login) */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 left-1/4"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-1/4 right-0"
          animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-0 left-0"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* CAMBIO: Tarjeta principal de registro con Framer Motion y estilo unificado (igual que en Login) */}
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

        {/* Indicador de progreso */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Progreso del formulario</span>
            <span className="text-sm font-medium text-blue-600">{progress}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-cyan-600 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

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
                onChange={(e) => {
                  setName(e.target.value);
                  calculateProgress();
                }}
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  calculateProgress();
                }}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  calculateProgress();
                }}
                required
                aria-label="Contraseña"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Selector de Rol (mejorado con ícono personalizado) */}
          <div className="relative group">
            <label className="block text-blue-800 mb-2 text-base font-semibold" htmlFor="role">
              Rol
            </label>
            <div className="relative">
              {/* Icono de Usuarios */}
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none transition-colors duration-200 group-focus-within:text-blue-700 z-10" />
              {/* Selector estilizado */}
              <select
                id="role"
                className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-gray-300
                  focus:outline-none focus:ring-3 focus:ring-blue-300 focus:border-blue-500
                  transition-all duration-200 appearance-none bg-gray-50 text-blue-900 font-medium shadow-inner-sm hover:shadow-md hover:border-blue-400
                  bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat cursor-pointer"
                style={{
                  // Icono de flecha de Lucide-React codificado en SVG para la consistencia
                  // Usamos color de Lucide-React (`currentColor`) o puedes especificar un hexadecimal para consistencia
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgb(99,102,241)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-chevron-down'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`
                }}
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  calculateProgress();
                }}
                aria-label="Seleccionar rol"
              >
                <option value="usuario">Usuario/a</option>
                <option value="administrador">Administrador</option>
                <option value="jefe_departamento">Jefe de Departamento</option>
                <option value="tecnico">Técnico</option>
              </select>
              {/* Flecha personalizada fuera del select si no usas backgroundImage */}
              {/* <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none z-10" /> */}
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