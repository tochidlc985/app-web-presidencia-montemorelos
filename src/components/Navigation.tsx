// src/components/Navigation.tsx
import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FileText, BarChart3, QrCode, Menu, X, User, LogOut, Settings } from 'lucide-react'; // Iconos de Lucide
import { useAuth } from '../context/AuthContext';
import LogoutConfirmationModal from './LogoutConfirmationModal'; // Asegúrate de la ruta correcta

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Estado para controlar el modal

  const { usuario, isLoggedIn, logout } = useAuth();

  // Función para cerrar sesión, activada al confirmar en el modal
  const handleLogoutConfirm = () => {
    // Guarda datos del usuario antes de que se limpie localStorage
    if (usuario) {
        sessionStorage.setItem('lastUserName', usuario.nombre || 'Usuario Desconocido');
        
        let userRoleToDisplay = 'Usuario'; // Default
        const rolesArray = Array.isArray(usuario.roles) ? usuario.roles : (typeof usuario.roles === 'string' ? [usuario.roles] : []);
        
        // Determina el rol principal basado en la jerarquía o preferencias
        if (rolesArray.includes('administrador')) userRoleToDisplay = 'Administrador';
        else if (rolesArray.includes('jefe')) userRoleToDisplay = 'Jefe de Departamento'; 
        else if (rolesArray.includes('tecnico')) userRoleToDisplay = 'Técnico';
        
        sessionStorage.setItem('lastUserRole', userRoleToDisplay);
    }

    logout(); // Esto limpia localStorage a través de tu contexto AuthContext
    navigate('/logout', { replace: true }); // Redirige a la página de cierre de sesión
    setIsMobileMenuOpen(false); // Asegura que el menú móvil se cierre
    setShowLogoutModal(false); // Cierra el modal de confirmación
  };

  // Define los ítems de navegación para evitar repetición
  const navItems = useMemo(() => ([
    { path: '/home', label: 'Inicio', icon: Home, color: 'from-blue-600 to-blue-700' },
    { path: '/reporte', label: 'Nuevo Reporte', icon: FileText, color: 'from-emerald-500 to-emerald-600' },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, color: 'from-purple-600 to-purple-700' },
    { path: '/qr', label: 'Código QR', icon: QrCode, color: 'from-orange-500 to-orange-600' },
    { path: '/settings', label: 'Configuración', icon: Settings, color: 'from-gray-600 to-gray-700' },
  ]), []);

  // Elemento específico para perfil, condicionalmente si hay sesión
  const userSpecificItems = useMemo(() => (
    isLoggedIn()
      ? [{ path: '/profile', label: 'Perfil', icon: User, color: 'from-sky-500 to-sky-600' }]
      : []
  ), [isLoggedIn]);

  // Toggle del menú móvil
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((prev) => !prev), []);

  return (
    // CAMBIO 1: Navbar principal con fondo, sombras, bordes y efecto glassmorphism
    // - Degradado de fondo más profundo
    // - shadow-xl, border-b-4 y border-yellow-400 para un look robusto
    // - backdrop-blur-xl y bg-opacity-80 para el efecto "vidrio"
    <nav className="bg-gradient-to-r from-indigo-950 via-blue-900 to-blue-800 shadow-xl border-b-4 border-yellow-400 sticky top-0 z-50 backdrop-blur-xl bg-opacity-80 transition-all duration-500 hover:shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Contenedor flexible de la barra */}
        <div className="flex items-center justify-between h-20">
          {/* Logo y Título de la Aplicación */}
          {/* Ajustado padding y focus outline */}
          <Link to="/home" className="flex items-center space-x-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 rounded-md py-1 px-2 -ml-2 sm:ml-0" aria-label="Ir a la página de inicio">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }} // Animación al pasar el ratón
              // Fondo blanco y borde amarillo que lo hace sobresalir
              className="bg-white p-2.5 rounded-full shadow-lg transition-transform duration-300 overflow-hidden flex-shrink-0 border-2 border-yellow-300"
            >
              {/* Lógica de foto de usuario más limpia en el logo */}
              <img
                src={isLoggedIn() && usuario?.foto ? usuario.foto : "/Montemorelos.jpg"}
                alt={isLoggedIn() && usuario?.foto ? "Foto de perfil del usuario" : "Escudo de Montemorelos"}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" // Ajuste de tamaño y redondeo
              />
            </motion.div>
            {/* Texto del título solo visible en pantallas sm y superiores */}
            <div className="hidden sm:block">
              <h1 className="text-white font-extrabold text-2xl tracking-wide transition-colors duration-300 group-hover:text-yellow-300 drop-shadow-md">
                MONTEMORELOS
              </h1>
              <p className="text-blue-200 text-sm opacity-90 font-medium">Departamento de Sistemas</p>
            </div>
          </Link>

          {/* Navegación Principal (Desktop) */}
          {/* hidden lg:flex: oculto en móviles, visible en pantallas grandes */}
          {/* space-x-5 para el espacio entre ítems */}
          <div className="hidden lg:flex items-center space-x-5 font-semibold">
            {/* Iteración sobre los ítems de navegación */}
            {[...navItems, ...userSpecificItems].map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                // Enlace individual del menú
                // Mejorado focus-visible para accesibilidad y clase de grupo
                <Link key={item.path} to={item.path} className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 rounded-full p-1" aria-label={`Ir a ${item.label}`}>
                  <motion.div
                    // Efecto de hover y active más pulido para los ítems del menú
                    // whileHover: sombra y escala sutil
                    // Clases dinámicas para activo/inactivo con gradientes y bordes translúcidos
                    whileHover={{ scale: 1.03, y: -2, boxShadow: "0 5px 15px rgba(255,255,255,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center space-x-3 px-5 py-2.5 rounded-full transition-all duration-300 ease-out border border-transparent 
                                ${isActive
                                  ? `bg-gradient-to-r ${item.color} text-white shadow-xl transform scale-103 border-white/40`
                                  : 'text-white/85 hover:bg-white/10 hover:text-white group-hover:bg-white/5 border-white/0'
                                }`}
                  >
                    {/* Icono de Lucide con color condicional y stroke más robusto */}
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-100 group-hover:text-white'}`} strokeWidth={2.2} /> {/* Stroke más grueso para más visibilidad */}
                    <span className="capitalize text-base font-medium">{item.label}</span>
                  </motion.div>
                  {/* Línea amarilla animada al pasar el ratón (efecto sutil para no activos) */}
                  {!isActive && (
                    <motion.div
                      className="absolute -bottom-1.5 left-1/2 w-[calc(100%-1rem)] h-[3px] bg-yellow-400 rounded-full" /* Ancho relativo y posición más baja */
                      initial={{ scaleX: 0, x: "-50%" }}
                      animate={{ scaleX: 0, x: "-50%" }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  )}
                  {/* Indicador de activo más robusto (línea sólida) */}
                  {isActive && (
                     <motion.div
                        className="absolute -bottom-1.5 left-1/2 w-[calc(100%-1rem)] h-[4px] bg-yellow-400 rounded-full opacity-80" /* Ancho relativo y posición más baja */
                        initial={{ scaleX: 0, x: "-50%" }}
                        animate={{ scaleX: 1, x: "-50%" }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                     />
                  )}
                </Link>
              );
            })}

            {/* Botones de Autenticación (Desktop) */}
            {!isLoggedIn() ? (
              // Si el usuario no está logueado, mostrar botones de Login y Registro
              <div className="flex items-center space-x-4 ml-6">
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    // Estilo de botón de Login: borde azul, fondo blanco/azul claro
                    className="px-6 py-2.5 rounded-full border border-blue-400 bg-blue-50 text-blue-700 font-semibold shadow-md hover:bg-blue-100 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-300 text-base"
                    aria-label="Ir a la página de inicio de sesión"
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    // Estilo de botón de Registro: borde morado, fondo blanco/morado claro
                    className="px-6 py-2.5 rounded-full border border-purple-400 bg-purple-50 text-purple-700 font-semibold shadow-md hover:bg-purple-100 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 transition duration-300 text-base"
                    aria-label="Ir a la página de registro"
                  >
                    Registrarse
                  </motion.button>
                </Link>
              </div>
            ) : (
              // Si el usuario está logueado, mostrar botón de Cerrar Sesión
              <motion.button
                onClick={() => setShowLogoutModal(true)} // Activa el modal al hacer clic
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                // Estilo de botón de Cerrar Sesión: borde rojo, fondo blanco/rojo claro
                className="flex items-center space-x-2 px-6 py-2.5 rounded-full border border-red-500 bg-red-50 text-red-700 font-semibold shadow-md hover:bg-red-100 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition duration-300 text-base ml-6"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" strokeWidth={2.2} /> {/* Stroke más grueso */}
                <span>Cerrar Sesión</span>
              </motion.button>
            )}
          </div>

          {/* Menú Móvil (Botón Hamburguesa/Cruz) */}
          {/* Visible solo en pantallas pequeñas (oculto en lg y superior) */}
          <div className="lg:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }} // Un tap más reactivo
              onClick={toggleMobileMenu}
              className="p-3 rounded-full text-white hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            >
              {isMobileMenuOpen ? <X className="h-7 w-7" strokeWidth={2.5} /> : <Menu className="h-7 w-7" strokeWidth={2.5} />} {/* Iconos más grandes y stroke */}
            </motion.button>
          </div>
        </div>

        {/* Menú Desplegable Móvil (Contenido que se muestra/oculta) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -50, height: 0 }} // Inicia oculto, contraído
              animate={{ opacity: 1, y: 0, height: 'auto' }} // Anima a visible, altura automática
              exit={{ opacity: 0, y: -50, height: 0 }} // Anima a oculto al salir
              transition={{ duration: 0.4, ease: 'easeOut' }} // Transición más rápida
              className="overflow-hidden lg:hidden py-4 border-t border-white/20"
            >
              <div className="flex flex-col gap-3 px-4 bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-700 rounded-b-xl shadow-inner pb-4">
                {/* Ítems de navegación en menú móvil */}
                {[...navItems, ...userSpecificItems].map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} aria-label={`Ir a ${item.label}`}>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 
                                    ${isActive
                                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg border border-white/30`
                                      : 'text-white/70 hover:bg-white/20 hover:text-white'
                                    }`}
                      >
                        <Icon className="h-6 w-6" strokeWidth={2.2} /> {/* Stroke más grueso */}
                        <span className="text-lg font-semibold">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
                {/* Botones de Autenticación (Móvil) */}
                {!isLoggedIn() ? (
                  // Login y Registrar si no hay sesión
                  <>
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-2 px-4 py-3 rounded-lg border border-blue-500 bg-white text-blue-700 font-semibold shadow-md hover:bg-blue-50 transition duration-200 text-lg"
                        aria-label="Login móvil"
                      >
                        Login
                      </motion.button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-4 py-3 rounded-lg border border-purple-500 bg-white text-purple-700 font-semibold shadow-md hover:bg-purple-50 transition duration-200 text-lg"
                        aria-label="Registrarse móvil"
                      >
                        Registrarse
                      </motion.button>
                    </Link>
                  </>
                ) : (
                  // Botón Cerrar Sesión si hay sesión
                  <motion.button
                    onClick={() => { // Activa el modal, luego cierra el menú móvil
                        setIsMobileMenuOpen(false);
                        setShowLogoutModal(true);
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border border-red-500 bg-white text-red-700 font-semibold shadow-md hover:bg-red-50 transition duration-200 text-lg"
                    aria-label="Cerrar sesión móvil"
                  >
                    <LogOut className="h-6 w-6" strokeWidth={2.2} /> {/* Stroke más grueso */}
                    <span>Cerrar Sesión</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de confirmación de cierre de sesión */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </nav>
  );
};

export default Navigation;