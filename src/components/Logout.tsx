// src/pages/Logout.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Shield, Home, User, AlertCircle, RefreshCcw, Info, CheckCircle } from 'lucide-react'; // Iconos de Lucide
import toast from 'react-hot-toast'; // Importar react-hot-toast

// URL de tu imagen de fondo principal (ajústala si es necesario)
const backgroundUrl = '/Montemorelos.jpg'; 

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [lastUserName, setLastUserName] = useState<string | null>(null);
  const [lastUserRole, setLastUserRole] = useState<string | null>(null);

  // Helper para mostrar un toast con estilos personalizados
  const showThemedToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    let bgColor = '#3B82F6'; 
    let iconComponent: React.ReactElement | string = <Info className="text-white h-5 w-5" />;

    switch (type) {
      case 'success': bgColor = '#22C55E'; iconComponent = <CheckCircle className="text-white h-5 w-5" />; break;
      case 'error': bgColor = '#EF4444'; iconComponent = <AlertCircle className="text-white h-5 w-5" />; break;
      case 'info': bgColor = '#3B82F6'; iconComponent = <Info className="text-white h-5 w-5" />; break;
    }

    toast(message, {
      icon: iconComponent,
      style: {
        borderRadius: '10px',
        background: bgColor,
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
      duration: 3000,
      position: 'top-right',
    });
  };


  useEffect(() => {
    // 1. Recuperar datos del usuario antes de que se limpie todo
    // Es crucial que estos se hayan guardado en sessionStorage JUSTO ANTES de redirigir a /logout
    // (Esto debe hacerse en handleLogoutConfirm en Navigation.tsx)
    setLastUserName(sessionStorage.getItem('lastUserName'));
    setLastUserRole(sessionStorage.getItem('lastUserRole'));
    
    // 2. Limpiar completamente el almacenamiento de la sesión
    localStorage.clear();
    sessionStorage.clear();
    
    // 3. Opcional: Limpiar cookies si estás usando alguna para autenticación
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    showThemedToast('Sesión cerrada correctamente.', 'success'); // Feedback de cierre exitoso

    // 4. Simular progreso y redirigir
    let currentProgress = 0;
    const increment = 100 / (2500 / 50); // Alcanzar 100% en 2.5s con intervalos de 50ms
    const interval = setInterval(() => {
      currentProgress += increment;
      setProgress(Math.min(currentProgress, 100)); // No exceder 100
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 50);

    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 2500); // Redirige después de 2.5 segundos

    // Limpieza al desmontar el componente
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]); // navigate como dependencia para useCallback

  // Controles de botones adicionales si el usuario no quiere esperar
  const handleGoToLogin = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleGoToHome = useCallback(() => {
    navigate('/home', { replace: true }); // Puede que necesite iniciar sesión de nuevo si /home está protegido
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-100 via-blue-100 to-green-100 font-inter antialiased"
    >
      {/* CAPA DE FONDO VISUAL - MISMO ESTILO QUE HOME/DASHBOARD */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out z-0" 
        style={{backgroundImage: `url(${backgroundUrl})`}}
      >
        {/* Overlay oscuro y blur para destacar el contenido principal */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      </div>
      
      {/* Elementos decorativos animados - Glassmorphism */}
      <motion.div 
        className="absolute top-20 left-20 w-24 h-24 rounded-full bg-blue-500 opacity-20 blur-2xl"
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-purple-500 opacity-20 blur-2xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/4 w-28 h-28 rounded-full bg-green-500 opacity-15 blur-2xl"
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ 
          duration: 4.5, 
          repeat: Infinity,
          delay: 1,
          ease: "easeInOut"
        }}
      />


      {/* Contenido principal de la página de despedida */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        // Glassmorphism en la tarjeta principal
        className="relative z-10 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-3xl px-8 py-10 max-w-lg w-full text-center border border-gray-100 transform scale-100 transition-all duration-300" // Ampliado padding
      >
        {/* CAMBIO: Icono de cierre de sesión animado y grande */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.4
          }}
          className="mx-auto mb-6 flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-xl border-4 border-red-200">
            <LogOut className="w-12 h-12 text-white" strokeWidth={1.5} /> {/* Icono más grande y llamativo */}
          </div>
        </motion.div>
        
        {/* Título de despedida */}
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-3 text-blue-900 drop-shadow-lg leading-tight">¡Hasta pronto!</h2>
        
        {/* Mensaje de sesión cerrada */}
        <p className="mb-4 text-blue-700 text-lg font-medium leading-relaxed">
          Tu sesión ha sido cerrada correctamente. <br />Esperamos verte de regreso.
        </p>

        {/* CAMBIO: Información del usuario si está disponible */}
        {(lastUserName || lastUserRole) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-blue-50/70 border border-blue-100 rounded-xl px-5 py-4 mb-6 shadow-inner text-blue-900 text-lg font-semibold flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4"
          >
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600"/>
              <span>Usuario: <span className="font-bold">{lastUserName || 'N/A'}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600"/>
              <span>Rol: <span className="font-bold">{lastUserRole || 'N/A'}</span></span>
            </div>
          </motion.div>
        )}
        
        {/* CAMBIO: Barra de progreso más sofisticada */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 h-full rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }} // Transición rápida para cada incremento
          />
        </div>
        
        {/* Mensaje de redirección animado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex items-center justify-center gap-2 text-blue-900 font-medium text-lg"
        >
          <span>Redirigiendo al inicio de sesión...</span>
          <motion.div
            className="inline-block"
            animate={{ rotate: [0, 360] }} // Animación de rotación completa
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCcw className="w-5 h-5 text-blue-600" /> {/* Icono de recarga */}
          </motion.div>
        </motion.div>
        
        {/* CAMBIO: Botones de CTA claros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoToLogin}
            className="flex items-center justify-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-xl shadow-lg font-bold text-lg hover:bg-blue-700 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" /> {/* Ícono de LogOut en el botón */}
            Ir a Iniciar Sesión
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoToHome}
            className="flex items-center justify-center gap-3 px-8 py-3 bg-green-500 text-white rounded-xl shadow-lg font-bold text-lg hover:bg-green-600 transition-all duration-200"
          >
            <Home className="w-5 h-5" /> {/* Ícono de Home */}
            Volver a la Home
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Logout;