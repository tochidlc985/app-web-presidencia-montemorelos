// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface Usuario {
  _id?: string;
  nombre?: string;
  email?: string;
  departamento?: string;
  roles?: string[] | string;
  foto?: string | null;
  fechaRegistro?: string;
  tamanoFoto?: number;
  [key: string]: unknown;
}

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (user: Usuario | null) => void;
  isLoggedIn: () => boolean;
  logout: () => void;
  isLoading: boolean;
  refreshSession: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Constantes para el almacenamiento
const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos en milisegundos

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuarioState] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inicializar el estado de autenticación cuando el componente se monta
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const userData = localStorage.getItem(USER_KEY);
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUsuarioState(parsedUser);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        // Limpiar datos corruptos
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      } finally {
        // Reducir el tiempo de carga a 500ms en lugar de esperar a que todo se cargue
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    initializeAuth();
  }, []);

  // Función para verificar si el token está próximo a expirar
  const isTokenExpiringSoon = useCallback(() => {
    try {
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;
      
      const expiryDate = new Date(parseInt(expiryTime));
      const now = new Date();
      return expiryDate.getTime() - now.getTime() < TOKEN_REFRESH_THRESHOLD;
    } catch (error) {
      console.error('Error al verificar expiración del token:', error);
      return true;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      // Guardar nombre y rol en sessionStorage para la página de Logout
      if (usuario?.nombre) {
        sessionStorage.setItem('lastUserName', usuario.nombre);
      }
      if (usuario?.roles) {
        const rol = Array.isArray(usuario.roles) ? usuario.roles[0] : usuario.roles;
        sessionStorage.setItem('lastUserRole', rol);
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      setUsuarioState(null);
    }
  }, [usuario]);

  const isLoggedIn = useCallback(() => {
    // Check for both token AND valid user object.
    const token = localStorage.getItem(TOKEN_KEY);
    const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    // Verificar si el token ha expirado
    if (tokenExpiry) {
      const expiryDate = new Date(parseInt(tokenExpiry));
      const now = new Date();
      if (expiryDate.getTime() <= now.getTime()) {
        // Token expirado, limpiar almacenamiento
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        return false;
      }
    }
    
    return Boolean(token && usuario && usuario._id);
  }, [usuario]);

  // Función para refrescar la sesión
  const refreshSession = useCallback(async () => {
    if (isRefreshing) return false;
    
    setIsRefreshing(true);
    try {
      // Aquí podrías implementar una llamada a un endpoint de refresh token
      // Por ahora, solo verificamos si el token aún es válido
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        logout();
        return false;
      }
      
      // Si el token está próximo a expirar, cerrar sesión
      if (isTokenExpiringSoon()) {
        console.log('Token próximo a expirar, cerrando sesión');
        logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al refrescar sesión:', error);
      logout();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, isTokenExpiringSoon, logout]);

  const setUsuario = useCallback((user: Usuario | null) => {
    if (user) {
      // Asegurarnos de que todos los campos necesarios estén presentes antes de guardar
      // Manejar tanto roles como un array como como un string simple
      let rolesProcesados = user.roles || [];
      if (typeof rolesProcesados === 'string') {
        rolesProcesados = rolesProcesados.split(',').map(r => r.trim()).filter(Boolean);
      }

      const userToStore = {
        _id: user._id || '',
        nombre: user.nombre || '',
        email: user.email || '',
        departamento: user.departamento || '',
        roles: rolesProcesados,
        rol: rolesProcesados.length > 0 ? rolesProcesados[0] : 'usuario', // Mantener compatibilidad con rol como string
        foto: user.foto || null,
        fechaRegistro: user.fechaRegistro || new Date().toISOString(),
        tamanoFoto: user.tamanoFoto || 150,
        ...user // Mantener cualquier otra propiedad adicional
      };

      try {
        // Guardar el usuario en localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(userToStore));
        setUsuarioState(userToStore);
        
        // Establecer la fecha de expiración del token (8 horas desde ahora)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 8);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.getTime().toString());
      } catch (error) {
        console.error('Error al guardar usuario:', error);
        setUsuarioState(userToStore); // Establecer el estado incluso si falla localStorage
      }
    } else {
      try {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      } catch (error) {
        console.error('Error al eliminar usuario de localStorage:', error);
      }
      setUsuarioState(null);
    }
  }, []);

  // Verificar token válido en dispositivos móviles y cuando la aplicación se vuelve visible
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && usuario) {
        try {
          // Verificar si el token está próximo a expirar
          if (isTokenExpiringSoon()) {
            console.log('Token próximo a expirar, refrescando sesión');
            const refreshed = await refreshSession();
            if (!refreshed) {
              logout();
            }
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          logout();
        }
      }
    };

    // Retrasar la primera verificación para mejorar el rendimiento inicial
    const initialCheckTimeout = setTimeout(checkToken, 1000);

    // Configurar un listener para eventos de visibilidad de la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkToken();
      }
    };

    // Configurar un listener para eventos de foco de la ventana
    const handleFocus = () => {
      checkToken();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearTimeout(initialCheckTimeout);
    };
  }, [usuario, logout, refreshSession, isTokenExpiringSoon]);

  // Configurar un intervalo para verificar el token periódicamente
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (isLoggedIn()) {
        await refreshSession();
      }
    }, 300000); // Verificar cada 5 minutos en lugar de cada minuto

    return () => clearInterval(intervalId);
  }, [isLoggedIn, refreshSession]);

  const contextValue = {
    usuario,
    setUsuario,
    isLoggedIn,
    logout,
    isLoading,
    refreshSession
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
