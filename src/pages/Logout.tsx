// src/pages/Logout.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Shield } from 'lucide-react';

const Logout = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('Usuario');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Obtener datos del usuario desde sessionStorage
    const savedUserName = sessionStorage.getItem('lastUserName');
    const savedUserRole = sessionStorage.getItem('lastUserRole');

    if (savedUserName) {
      setUserName(savedUserName);
    }

    if (savedUserRole) {
      setUserRole(savedUserRole);
    }

    // Limpiar sessionStorage después de usar los datos
    sessionStorage.removeItem('lastUserName');
    sessionStorage.removeItem('lastUserRole');
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

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
              onClick={handleLogin}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            >
              <LogIn className="w-6 h-6" />
              <span>Iniciar Sesión</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(124, 58, 237, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRegister}
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
};

export default Logout;
