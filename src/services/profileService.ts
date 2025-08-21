// src/services/profileService.ts
import { API_ENDPOINTS, getFullUrl } from './apiConfig';

// Interfaz para el usuario
export interface Usuario {
  _id?: string;
  nombre?: string;
  email?: string;
  departamento?: string;
  roles?: string[] | string;
  foto?: string | null;
  fechaRegistro?: string;
  genero?: 'masculino' | 'femenino' | 'otro';
  fotoZoom?: number;
  fotoRotation?: number;
  fotoPositionX?: number;
  fotoPositionY?: number;
  [key: string]: any;
}

// Obtener perfil de usuario
export const getUserProfile = async (): Promise<Usuario> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Decodificar el token para obtener el email del usuario
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const userEmail = decodedToken.email;

    if (!userEmail) {
      throw new Error('No se pudo obtener el email del token');
    }

    const response = await fetch(getFullUrl(`${API_ENDPOINTS.PERFIL}/${userEmail}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    return data.usuario || data || {};
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    throw error;
  }
};

// Actualizar perfil de usuario
export const updateUserProfile = async (userData: Usuario): Promise<Usuario> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    if (!userData.email) {
      throw new Error('El email del usuario es requerido para actualizar el perfil');
    }

    const payload = { ...userData };
    // Eliminar propiedades que no deben enviarse al backend
    delete payload.fotoZoom;
    delete payload.fotoRotation;
    delete payload.fotoPositionX;
    delete payload.fotoPositionY;

    const url = getFullUrl(`${API_ENDPOINTS.PERFIL}/${userData.email}`);
    console.log('Intentando actualizar perfil en:', url);
    console.log('Datos a enviar:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Respuesta del servidor:', response.status, errorText);
      throw new Error(`Error del servidor: ${response.status}. ${errorText}`);
    }

    const data = await response.json();
    console.log('Perfil actualizado correctamente:', data);
    return data.usuario || userData;
  } catch (error) {
    console.error('Error al actualizar perfil de usuario:', error);
    throw error;
  }
};

// Subir foto de perfil
export const uploadProfilePhoto = async (file: File): Promise<string> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Decodificar el token para obtener el email del usuario
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const userEmail = decodedToken.email;

    if (!userEmail) {
      throw new Error('No se pudo obtener el email del token');
    }

    const formData = new FormData();
    formData.append('foto', file);

    const response = await fetch(getFullUrl(`${API_ENDPOINTS.PERFIL}/${userEmail}/foto`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // No establecer Content-Type cuando se usa FormData, el navegador lo hará automáticamente
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    return data.fotoUrl || '';
  } catch (error) {
    console.error('Error al subir foto de perfil:', error);
    throw error;
  }
};

// Eliminar foto de perfil
export const deleteProfilePhoto = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Decodificar el token para obtener el email del usuario
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const userEmail = decodedToken.email;

    if (!userEmail) {
      throw new Error('No se pudo obtener el email del token');
    }

    const response = await fetch(getFullUrl(`${API_ENDPOINTS.PERFIL}/${userEmail}/foto`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
  } catch (error) {
    console.error('Error al eliminar foto de perfil:', error);
    throw error;
  }
};
