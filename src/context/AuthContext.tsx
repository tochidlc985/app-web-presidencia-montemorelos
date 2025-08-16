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
  [key: string]: any;
}

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (user: Usuario | null) => void;
  isLoggedIn: () => boolean;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuarioState] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Evitar ejecutar en el servidor (SSR)
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        const stored = localStorage.getItem('usuario');
        const token = localStorage.getItem('token');

        if (stored && token) {
          const parsedUser = JSON.parse(stored);
          // Asegurarnos de que el objeto de usuario tenga todas las propiedades necesarias
          setUsuarioState({
            _id: '',
            nombre: '',
            email: '',
            departamento: '',
            roles: [],
            foto: null,
            fechaRegistro: '',
            tamanoFoto: 150,
            ...parsedUser // Sobrescribir con los datos almacenados
          });
        }
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

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
      localStorage.setItem('usuario', JSON.stringify(userToStore));
      setUsuarioState(userToStore);
    } else {
      localStorage.removeItem('usuario');
      setUsuarioState(null);
    }
  }, []);

  const isLoggedIn = useCallback(() => {
    // Check for both token AND valid user object.
    const token = localStorage.getItem('token');
    return Boolean(token && usuario && usuario._id);
  }, [usuario]);

  // Verificar token válido en dispositivos móviles
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      if (token && usuario) {
        // En dispositivos móviles, verificamos que el token sea válido
        // Esto ayuda a mantener la sesión activa incluso si la app se cierra
        try {
          // No necesitamos verificar el token aquí, solo que exista
          // La verificación real se hará en cada petición a la API
        } catch (error) {
          console.error('Error verificando token:', error);
          logout();
        }
      }
    };

    checkToken();

    // Configurar un listener para eventos de visibilidad de la página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [usuario, logout]);

  const logout = useCallback(() => {
    // Guardar nombre y rol en sessionStorage para la página de Logout
    if (usuario?.nombre) {
      sessionStorage.setItem('lastUserName', usuario.nombre);
    }
    if (usuario?.roles) {
      const rol = Array.isArray(usuario.roles) ? usuario.roles[0] : usuario.roles;
      sessionStorage.setItem('lastUserRole', rol);
    }
    localStorage.removeItem('token');
    setUsuario(null);
  }, [usuario, setUsuario]);

  const contextValue = {
    usuario,
    setUsuario,
    isLoggedIn,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};