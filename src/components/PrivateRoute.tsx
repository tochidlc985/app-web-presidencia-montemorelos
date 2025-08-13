import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const checkAuth = (): { authenticated: boolean; errorMessage?: string; userRoles: string[] } => {
  const token = localStorage.getItem('token');
  const usuarioStr = localStorage.getItem('usuario');

  if (!token || !usuarioStr) {
    let errorMessage = '';
    if (!token) {
      errorMessage = "Sesión no encontrada. Por favor, inicie sesión.";
    } else if (!usuarioStr) {
      errorMessage = "Datos de usuario incompletos. Por favor, inicie sesión de nuevo.";
    }
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    return { authenticated: false, errorMessage, userRoles: [] };
  }

  let userRoles: string[] = [];
  try {
    const userObj = JSON.parse(usuarioStr);
    if (userObj.roles) {
      if (Array.isArray(userObj.roles)) {
        userRoles = userObj.roles.map((r: string) => r.toLowerCase());
      } else if (typeof userObj.roles === 'string') {
        userRoles = userObj.roles.split(',').map((r: string) => r.trim().toLowerCase());
      }
    } else if (userObj.rol) {
      if (Array.isArray(userObj.rol)) {
        userRoles = userObj.rol.map((r: string) => r.toLowerCase());
      } else if (typeof userObj.rol === 'string') {
        userRoles = [userObj.rol.toLowerCase()];
      }
    }
  } catch (e) {
    console.error("Error parsing user roles from localStorage:", e);
  }

  // Verificar validez del token
  try {
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    return { authenticated: false, errorMessage: "Token inválido o expirado.", userRoles: [] };
  }

  return { authenticated: true, userRoles };
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(true);

  useEffect(() => {
    const { authenticated, errorMessage, userRoles } = checkAuth();
    if (!authenticated) {
      setAuthError(errorMessage || "Necesitas iniciar sesión para acceder a esta página.");
      setHasAccess(false);
    } else if (allowedRoles && allowedRoles.length > 0) {
      const userRolesLower = userRoles || [];
      const allowedRolesLower = allowedRoles.map(r => r.toLowerCase());
      const intersection = userRolesLower.filter(role => allowedRolesLower.includes(role));
      if (intersection.length === 0) {
        setAuthError('No tienes permiso para acceder a esta página.');
        setHasAccess(false);
      } else {
        setHasAccess(true);
      }
    } else {
      setHasAccess(true);
    }
    setAuthChecked(true);
  }, [allowedRoles]);

  useEffect(() => {
    if (authError && authChecked) {
      toast.error(authError);
    }
  }, [authError, authChecked]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold text-xl">
        Cargando autenticación...
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;