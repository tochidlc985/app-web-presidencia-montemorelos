import React, { useState } from "react";
import {
  LogOut,
  Menu,
  X,
  Home,
  FileText,
  BarChart3,
  QrCode,
  User,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Importa useNavigate aquí
import { useAuth } from '../context/AuthContext';
import { getAllowedRoutes, normalizeRole } from '../utils/rolePermissions';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Hook useNavigate
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { usuario, logout } = useAuth();

  const displayRole = () => {
    if (!usuario) return 'Usuario';

    // Manejar tanto roles como array como string
    let roles: any[] = [];
    if (usuario.roles) {
      if (Array.isArray(usuario.roles)) {
        roles = usuario.roles;
      } else if (typeof usuario.roles === 'string') {
        roles = usuario.roles.split(',').map(r => r.trim()).filter(Boolean);
      }
    }

    // Si no hay roles, usar el campo rol si existe
    if (roles.length === 0 && usuario.rol) {
      roles = [usuario.rol];
    }

    // Mapear roles a nombres más amigables
    const rolesNombres = roles.map(rol => {
      switch(rol) {
        case 'administrador': return 'Administrador';
        case 'jefe_departamento': return 'Jefe de Departamento';
        case 'tecnico': return 'Técnico';
        default: return 'Usuario';
      }
    });

    return rolesNombres.length > 0 ? rolesNombres.join(', ') : 'Usuario';
  };

  // Obtener el rol principal del usuario
  const getUserRole = () => {
    if (!usuario) return 'usuario';

    // Manejar tanto roles como array como string
    let roles: any[] = [];
    if (usuario.roles) {
      if (Array.isArray(usuario.roles)) {
        roles = usuario.roles;
      } else if (typeof usuario.roles === 'string') {
        roles = usuario.roles.split(',').map(r => r.trim()).filter(Boolean);
      }
    }

    // Si no hay roles, usar el campo rol si existe
    if (roles.length === 0 && usuario.rol) {
      roles = [usuario.rol];
    }

    // Normalizar el rol principal
    return roles.length > 0 ? normalizeRole(roles[0]) : 'usuario';
  };

  const userRole = getUserRole();
  const allowedRoutes = getAllowedRoutes(userRole);

  // Definir todos los elementos de navegación
  const allNavItems = [
    { path: '/home', label: 'Inicio', icon: Home },
    { path: '/reporte', label: 'Nuevo Reporte', icon: FileText },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/qr', label: 'Código QR', icon: QrCode },
    { path: '/profile', label: 'Perfil', icon: User },
    { path: '/settings', label: 'Configuración', icon: Settings },
  ];

  // Filtrar los elementos de navegación según los permisos del usuario
  const navItems = allNavItems.filter(item => allowedRoutes.includes(item.path));

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsMobileMenuOpen(false);

    // Guardar nombre y rol en sessionStorage justo antes de limpiar el AuthContext
    // Esto se hace para que LogoutPage pueda acceder a estos datos
    sessionStorage.setItem('lastUserName', usuario?.nombre || 'usuario desconocido');
    // Obtener el rol en el formato esperado por la página de Logout
    let userRole = 'Usuario';
    if (usuario) {
      // Manejar tanto roles como array como string
      let roles: any[] = [];
      if (usuario.roles) {
        if (Array.isArray(usuario.roles)) {
          roles = usuario.roles;
        } else if (typeof usuario.roles === 'string') {
          roles = usuario.roles.split(',').map(r => r.trim()).filter(Boolean);
        }
      }
      
      // Si no hay roles, usar el campo rol si existe
      if (roles.length === 0 && usuario.rol) {
        roles = [usuario.rol];
      }
      
      // Determinar el rol principal para la página de Logout
      if (roles.includes('administrador')) userRole = 'administrador';
      else if (roles.includes('jefe_departamento') || roles.includes('jefe')) userRole = 'jefe';
      else if (roles.includes('tecnico')) userRole = 'tecnico';
    }
    
    sessionStorage.setItem('lastUserRole', userRole);

    logout();
    
    // Redirigir a la página de logout pasando el estado
    // Usa navigate para pasar estado y luego recargar si es necesario.
    navigate('/logout', { replace: true });
    // setTimeout(() => {
    //   window.location.reload(); // A veces es necesario para asegurar que el AuthContext se limpie
    // }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/home" className="flex items-center space-x-2 sm:space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1.5 sm:p-2 rounded-lg">
                  <img
                    src={usuario?.foto || "/Montemorelos.jpg"}
                    alt="Logo Montemorelos"
                    className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">Montemorelos</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Departamento de Sistemas</p>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-2 sm:px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 sm:space-x-2 transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
                {usuario && (
                  <>
                    <div className="text-right hidden lg:block">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{usuario.nombre}</p>
                      <p className="text-xs text-gray-500">{displayRole()}</p>
                    </div>
                    <div className="relative">
                      <img
                        src={usuario.foto || "/Montemorelos.jpg"}
                        alt="Avatar"
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-blue-200 object-cover"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
                            <AnimatePresence>
                              {showLogoutModal && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                                >
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
                                  >
                                    <h2 className="text-xl font-bold mb-4 text-gray-900">Cerrar sesión</h2>
                                    <p className="text-gray-700 mb-6">
                                      ¿Estás seguro que deseas cerrar sesión?
                                    </p>
                                    <div className="flex justify-end space-x-4">
                                      <button
                                        onClick={() => setShowLogoutModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                          Cerrar sesión
                                        </button>
                                      </div>
                                    </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

              <button
                className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 touch-manipulation"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 bg-white overflow-hidden"
            >
              <div className="px-3 sm:px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium touch-manipulation ${
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}

                <div className="pt-4 pb-2 border-t border-gray-200 mt-2">
                  {usuario && (
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <img
                        src={usuario.foto || "/Montemorelos.jpg"}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full border-2 border-blue-200 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{usuario.nombre}</p>
                        <p className="text-sm text-gray-500">{displayRole()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <div className="flex items-center">
                <img
                  src="/Montemorelos.jpg"
                  alt="Logo Montemorelos"
                  className="h-8 w-8 object-contain mr-2"
                />
                <span className="text-sm font-medium text-gray-600">
                  © {new Date().getFullYear()} Presidencia Municipal de Montemorelos
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex justify-center">
              <p className="text-sm text-gray-500">
                Departamento de Sistemas - Todos los derechos reservados
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;