import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast'; // Mantenemos el toast, pero la lógica será más precisa
import { useAuth } from '../context/AuthContext'; // Importamos el hook useAuth

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const allowedRoles = ['usuario', 'administrador', 'jefe_departamento', 'tecnico'];

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { usuario, isLoggedIn, logout } = useAuth(); // Usamos useAuth

  // Evitar problemas de hidratación en SSR
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  // Verifica el rol solo si hay un usuario logueado en el contexto
  const currentUserRoles = Array.isArray(usuario?.roles)
    ? usuario.roles.map(role => role.toLowerCase())
    : typeof usuario?.roles === 'string'
    ? usuario.roles.split(',').map(r => r.trim().toLowerCase())
    : usuario?.rol
    ? [usuario.rol.toLowerCase()]
    : [];

  const hasValidRole = allowedRoles.some(allowedRole => currentUserRoles.includes(allowedRole));

  // Consideramos si la ruta está protegida por ambos, la autenticación y el rol
  const isAuthenticatedAndAuthorized = isLoggedIn() && hasValidRole;

  useEffect(() => {
    if (isClient && !isAuthenticatedAndAuthorized) {
      if (usuario && !hasValidRole) {
        toast.error('Su rol no tiene permisos para acceder a esta página.');
        logout(); // Limpia los datos de autenticación
      } else if (!isLoggedIn()) {
        toast.error('Inicie sesión para acceder a esta página.');
      }
    }
  }, [isClient, isAuthenticatedAndAuthorized, usuario, hasValidRole, logout, isLoggedIn]);

  // Si no está autenticado O no tiene un rol válido, redirige a /login
  if (!isAuthenticatedAndAuthorized) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado y tiene rol, permite el acceso
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
