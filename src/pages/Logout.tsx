// src/pages/Logout.tsx
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Logout = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  // step puede ser: 'confirm', 'bye', 'invite'
  const [step, setStep] = useState<'confirm' | 'bye' | 'invite'>('confirm');
  const [userName, setUserName] = useState<string>('Usuario');
  const [userRole, setUserRole] = useState<string>('');
  const [loggingOut, setLoggingOut] = useState(false);
  // Ref para saber si el usuario ya confirmó logout
  const confirmedLogout = useRef(false);

  useEffect(() => {
    if (usuario && usuario._id) {
      setUserName(usuario.nombre || 'Usuario');
      const firstRole = Array.isArray(usuario.roles)
        ? usuario.roles[0]
        : usuario.roles || '';
      setUserRole(firstRole);
      setStep('confirm');
    } else {
      // Si hay datos en sessionStorage, mostrar despedida
      const savedUserName = sessionStorage.getItem('lastUserName') || 'Usuario';
      const savedUserRole = sessionStorage.getItem('lastUserRole') || '';
      if (savedUserName !== 'Usuario' || savedUserRole) {
        setUserName(savedUserName);
        setUserRole(savedUserRole);
        setStep('bye');
      } else {
        setStep('invite');
      }
    }
  }, [usuario]); // Actualizar todo reactivo

  // Este efecto reacciona SOLO cuando ya se ha confirmado el logout y el usuario ha sido limpiado en el contexto
  useEffect(() => {
    if (confirmedLogout.current && (!usuario || !usuario._id)) {
      const savedUserName = sessionStorage.getItem('lastUserName') || 'Usuario';
      const savedUserRole = sessionStorage.getItem('lastUserRole') || '';
      setUserName(savedUserName);
      setUserRole(savedUserRole);
      setStep('bye');
      // Limpiamos datos SOLO después de mostrar despedida
      setTimeout(() => {
        sessionStorage.removeItem('lastUserName');
        sessionStorage.removeItem('lastUserRole');
      }, 1000);
    }
  }, [usuario]);

  const handleCancel = () => {
    navigate('/home');
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    // Guarda nombre/rol antes del logout
    sessionStorage.setItem('lastUserName', usuario?.nombre || 'Usuario');
    const rolRaw = usuario?.roles || '';
    const rol = Array.isArray(rolRaw)
      ? (rolRaw[0] || '')
      : rolRaw;
    sessionStorage.setItem('lastUserRole', rol);

    // Mostrar notificación de despedida
    toast.success(`¡Hasta pronto, ${usuario?.nombre || 'Usuario'}!`, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#f97316',
        color: '#fff',
        fontWeight: 'bold',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '16px',
      },
    });

    confirmedLogout.current = true;
    logout();
    // No setStep aquí: esperamos a la actualización del usuario (el re-render lo maneja el efecto de arriba)
  };

  // MODAL CONFIRMACIÓN
  if (step === 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div
          className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md animate-fadein"
          style={{ opacity: 1, transform: 'none' }}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-900">Cerrar sesión</h2>
          <p className="text-gray-700 mb-6">¿Estás seguro que deseas cerrar sesión?</p>
          <div className="flex justify-end space-x-4">
            <button
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={handleCancel}
              disabled={loggingOut}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DESPEDIDA tras logout VERDADERO
  if (step === 'bye') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8 font-inter antialiased relative overflow-hidden">
        {/* Fondos animados con colores armónicos y un toque de blur */}
        <div className="absolute inset-0 mix-blend-multiply opacity-50 z-0">
          <motion.div
            initial={{ x: -100, y: -100, opacity: 0 }}
            animate={{ x: [-100, 1000], y: [-100, 800], opacity: [0, 0.4, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="w-80 h-80 rounded-full bg-blue-300 absolute blur-2xl"
          ></motion.div>
          <motion.div
            initial={{ x: 800, y: 100, opacity: 0 }}
            animate={{ x: [800, -200], y: [100, 900], opacity: [0, 0.4, 0] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="w-96 h-96 rounded-full bg-purple-300 absolute blur-2xl"
          ></motion.div>
          <motion.div
            initial={{ x: 400, y: 700, opacity: 0 }}
            animate={{ x: [400, 0], y: [700, -200], opacity: [0, 0.3, 0] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="w-72 h-72 rounded-full bg-green-300 absolute blur-2xl"
          ></motion.div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto py-16 space-y-12 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-12 shadow-3xl border border-gray-100 relative overflow-hidden max-w-2xl w-full"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
              className="flex justify-center mb-8"
            >
              <div className="bg-gradient-to-tr from-red-400 via-red-500 to-orange-500 p-4 rounded-full shadow-xl">
                <LogIn className="h-16 w-16 text-white" />
              </div>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 mb-6 leading-tight">
              ¡Hasta pronto, {userName}!
            </h1>

            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Tu sesión como {userRole} ha sido cerrada correctamente. 
              Esperamos verte pronto de nuevo en el sistema de la Presidencia Municipal de Montemorelos.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-10 border border-blue-100">
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-blue-800">Tu seguridad es importante</h3>
              </div>
              <p className="text-gray-700 text-center">
                Hemos cerrado tu sesión para proteger tu información. 
                Si deseas volver a acceder, por favor inicia sesión nuevamente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-lg"
              >
                <LogIn className="w-6 h-6" />
                <span>Iniciar Sesión</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(124, 58, 237, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-lg"
              >
                <UserPlus className="w-6 h-6" />
                <span>Crear Cuenta</span>
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="text-center text-gray-600 mt-8"
          >
            <p>Presidencia Municipal de Montemorelos - Departamento de Sistemas</p>
            <p className="text-sm mt-2">© {new Date().getFullYear()} Todos los derechos reservados</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // NO SESIÓN NI DATOS => INVITACIÓN LOGIN
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">No tienes una sesión activa</h2>
        <p className="text-gray-700 mb-6">Inicia sesión para acceder nuevamente al sistema.</p>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 text-lg font-semibold"
          onClick={() => navigate('/login')}
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
};

export default Logout;
