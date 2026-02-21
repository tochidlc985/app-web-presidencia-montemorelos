// src/pages/Profile.tsx
import React, { useEffect, useState, ChangeEvent, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Building, Shield, Calendar, Camera, XCircle, Home, Edit2, CheckCircle, Clock, HelpCircle, ZoomIn, ZoomOut, RotateCcw, Download, Share2, AlertCircle, Info, QrCode, Tag, Lock, Unlock, Eye, EyeOff } from 'lucide-react'; // Agregamos nuevos iconos
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getUserProfile, updateUserProfile as updateUserProfileService, uploadProfilePhoto, deleteProfilePhoto } from '../services/profileService';

// region: Interfaces y Configuración

// Componente para mostrar tooltips de ayuda
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <div className="relative group inline-block">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
      {text}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-t-black border-l-transparent border-r-transparent"></div>
    </div>
  </div>
);

interface Usuario {
  _id?: string;
  nombre?: string;
  email?: string;
  departamento?: string;
  roles?: string[] | string;
  foto?: string | null;
  fechaRegistro?: string;
  genero?: 'masculino' | 'femenino' | 'otro';
  telefono?: string;
  bio?: string;
  // Propiedades para manipular la foto en el frontend
  fotoZoom?: number;
  fotoRotation?: number;
  fotoPositionX?: number;
  fotoPositionY?: number;
  // Propiedad para indicar si es un nuevo perfil
  esNuevoPerfil?: boolean;
  // Nueva propiedad para privacidad
  perfilPublico?: boolean;
  [key: string]: any;
}

interface PreguntaFrecuente {
  id: number;
  pregunta: string;
  respuesta: string;
  icono: React.ReactNode;
}

// Helper para mostrar un toast con estilos personalizados
const showThemedToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  let bgColor = '#3B82F6';
  let iconComponent: React.ReactElement = <Info className="text-white h-5 w-5" />;

  switch (type) {
    case 'success':
      bgColor = '#22C55E';
      iconComponent = <CheckCircle className="text-white h-5 w-5" />;
      break;
    case 'error':
      bgColor = '#EF4444';
      iconComponent = <AlertCircle className="text-white h-5 w-5" />;
      break;
    case 'warning':
      bgColor = '#F59E0B';
      iconComponent = <AlertCircle className="text-white h-5 w-5" />;
      break;
    case 'info':
    default:
      bgColor = '#3B82F6';
      iconComponent = <Info className="text-white h-5 w-5" />;
      break;
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

// Limites y tipos de archivos para la foto
const MAX_IMG_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMG_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
];


// Función para guardar los datos del usuario en tiempo real
const saveUserDataInRealTime = async (userData: Usuario): Promise<Usuario> => {
  try {
    if (!userData.email) {
      throw new Error('El email del usuario es requerido para actualizar el perfil');
    }

    // Crear payload limpio
    const payload: Usuario = { ...userData };

    // Eliminar propiedades que no deben enviarse al backend
    delete payload.fotoZoom;
    delete payload.fotoRotation;
    delete payload.fotoPositionX;
    delete payload.fotoPositionY;
    delete payload.esNuevoPerfil;
    delete payload._id;
    
    // Mantener roles y rol para asegurar que se preserven
    if (!payload.rol && payload.roles) {
      // Si no hay rol pero hay roles, usar el primer rol
      const rolesArray = Array.isArray(payload.roles) ? payload.roles : [payload.roles];
      payload.rol = rolesArray[0] || 'usuario';
    }
    
    // Asegurarse de que tenemos los campos necesarios mínimos
    if (!payload.nombre) {
      payload.nombre = payload.email?.split('@')[0] || 'Usuario';
    }
    if (!payload.departamento) {
      payload.departamento = 'No especificado';
    }
    if (!payload.rol && !payload.roles) {
      payload.rol = 'usuario';
      payload.roles = ['usuario'];
    }

    console.log('Intentando guardar perfil para:', payload.email);
    console.log('Datos a enviar:', JSON.stringify(payload, null, 2));

    // Llamar al servicio para actualizar el perfil
    const updatedUser = await updateUserProfileService(payload);
    console.log('Perfil guardado exitosamente:', updatedUser);
    
    // Notificar a través de WebSocket que el perfil se actualizó
    if (typeof window !== 'undefined' && (window as any).realtimeService) {
      try {
        (window as any).realtimeService.emit('user_updated', {
          email: payload.email,
          data: updatedUser,
          timestamp: new Date().toISOString()
        });
      } catch (wsError) {
        console.error('Error al enviar notificación WebSocket:', wsError);
        // No fallar si WebSocket no está disponible
      }
    }
    
    return updatedUser;
  } catch (error: any) {
    console.error('Error al guardar datos en tiempo real:', error);

    // Si el error es 403 (permisos), mostrar un mensaje específico
    if (error.response?.status === 403 || error.message?.includes('403')) {
      console.error('Error de permisos:', error);
      throw new Error('No tienes permisos para actualizar el perfil. Por favor, inicia sesión nuevamente.');
    }
    
    // Si el error es 404 (perfil no encontrado), intentar crearlo
    if (error.response?.status === 404 || error.message?.includes('404')) {
      console.error('Perfil no encontrado, intentando crearlo...');
      // Intentar crear el perfil con los datos actuales
      try {
        const newUser = await updateUserProfileService({
          ...userData,
          rol: userData.rol || 'usuario',
          roles: userData.roles || ['usuario']
        });
        console.log('Perfil creado exitosamente:', newUser);
        return newUser;
      } catch (createError) {
        console.error('Error al crear perfil:', createError);
        throw new Error('No se pudo crear ni actualizar el perfil. Por favor, contacte al administrador.');
      }
    }

    throw error;
  }
};

// endregion: Interfaces y Configuración

const Profile: React.FC = (): JSX.Element => {
  const { usuario, setUsuario, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref para el input de archivo

  const [edit, setEdit] = useState(false); // Modo de edición
  const [form, setForm] = useState<Usuario>({}); // Datos del formulario para edición
  const [fotoPreview, setFotoPreview] = useState<string | null>(null); // URL/Base64 para previsualización de la foto
  const [tiempoActivo, setTiempoActivo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 }); // Tiempo de la cuenta activa
  const [mostrarPreguntas, setMostrarPreguntas] = useState(false); // Toggle de FAQs
  const [mostrarBioCompleta, setMostrarBioCompleta] = useState(false); // Toggle para mostrar bio completa
  const [mostrarEmail, setMostrarEmail] = useState(false); // Toggle para mostrar email público
  
  // Estados para manipulación de la imagen
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 }); // Ref para el inicio del drag

  // Referencia para almacenar el ID del timeout del debounce
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Autoguardado: Cuando `form` cambia y estamos en modo edición
  const saveUserDataLocally = useCallback(async (data: Usuario, showToast: boolean = true) => {
    try {
      // Guardar en localStorage para persistencia básica
      localStorage.setItem('usuario', JSON.stringify(data));
      
      // Notificar al contexto de autenticación sobre los cambios de forma asíncrona
      if (setUsuario) {
        // Usar setTimeout para evitar actualizar el estado durante el renderizado
        setTimeout(() => {
          setUsuario(data);
        }, 0);
      }

      // Guardar en el backend en tiempo real
      if (edit && data.email) {
        try {
          const payload: Usuario = { ...data };
          delete payload.fotoZoom;
          delete payload.fotoRotation;
          delete payload.fotoPositionX;
          delete payload.fotoPositionY;

          await saveUserDataInRealTime(payload);
          if (showToast) {
            showThemedToast('Cambios guardados automáticamente', 'success');
          }
        } catch (apiError: any) {
          console.error('Error al guardar en el backend:', apiError);
          if (showToast) {
            showThemedToast('Cambios guardados localmente. Error al sincronizar con servidor.', 'warning');
          }
        }
      }
    } catch (error) {
      console.error('Error al guardar datos en tiempo real:', error);
      if (showToast) {
        showThemedToast('Error al guardar cambios', 'error');
      }
    }
  }, [edit, setUsuario]);

  // Efecto para la carga inicial de datos del usuario y configuración del temporizador
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const loadUserData = async () => {
      let initialUserData: Usuario | null = usuario || null;
      
      // Si no hay datos en el contexto, intentar obtenerlos de localStorage
      if (!initialUserData) {
        const savedData = localStorage.getItem('usuario');
        if (savedData) {
          try {
            initialUserData = JSON.parse(savedData) as Usuario;
            // Si encontramos datos en localStorage, actualizar el contexto
            if (setUsuario) {
              setUsuario(initialUserData);
            }
          } catch (e) {
            console.error("Error parsing user data from localStorage:", e);
            localStorage.removeItem('usuario');
          }
        }
      }

      // Intentar obtener los datos más recientes del servidor
      try {
        const serverUserData = await getUserProfile();
        // Combinar datos del servidor con datos locales (priorizando los del servidor)
        initialUserData = {
          ...initialUserData,
          ...serverUserData,
          // Mantener propiedades de manipulación de foto que no están en el servidor
          fotoZoom: initialUserData?.fotoZoom || 1,
          fotoRotation: initialUserData?.fotoRotation || 0,
          fotoPositionX: initialUserData?.fotoPositionX || 0,
          fotoPositionY: initialUserData?.fotoPositionY || 0
        };
        
        // Actualizar el contexto con los datos del servidor
        if (setUsuario) {
          setUsuario(initialUserData);
        }
        
        // Guardar en localStorage
        localStorage.setItem('usuario', JSON.stringify(initialUserData));
      } catch (error) {
        console.error('Error al obtener datos del servidor:', error);
        // Si hay un error, usar los datos locales
      }

      // Resto del código de carga...
      if (initialUserData) {
        setForm(initialUserData);
        setFotoPreview(initialUserData.foto || null);
        setZoomLevel(initialUserData.fotoZoom || 1);
        setRotation(initialUserData.fotoRotation || 0);
        setPosition({ x: initialUserData.fotoPositionX || 0, y: initialUserData.fotoPositionY || 0 });

        // Iniciar cálculo del tiempo activo
        if (initialUserData.fechaRegistro) {
          const calculateAndUpdate = () => calcularTiempoActivo(initialUserData!.fechaRegistro!);
          calculateAndUpdate(); // Call immediately
          intervalId = setInterval(calculateAndUpdate, 1000); // Update every second
        }
      }
    };

    loadUserData();

    // Limpieza al desmontar o re-ejecutar el efecto
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [usuario, isLoggedIn, navigate]); // Dependencias que causarán que el efecto se re-ejecute


  // Cálcula y actualiza el tiempo que lleva activa la cuenta.
  const calcularTiempoActivo = (fechaRegistro: string) => {
    const fechaRegistroDate = new Date(fechaRegistro).getTime();
    const ahora = new Date().getTime();
    const diferencia = ahora - fechaRegistroDate;

    if (diferencia < 0) { // En caso de que fechaRegistro sea en el futuro
        setTiempoActivo({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
        return;
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    setTiempoActivo({ dias, horas, minutos, segundos });
  };

  // Validación de campos
  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string): boolean => /^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));

  const validateProfileForm = useCallback((data: Usuario): string | null => {
    const errors = [];
    
    if (!data.nombre || data.nombre.trim().length < 3) 
      errors.push('El nombre debe tener al menos 3 caracteres');
    
    if (!data.email || !validateEmail(data.email)) 
      errors.push('El formato del correo electrónico es inválido');
    
    if (!data.departamento || data.departamento.trim().length < 2) 
      errors.push('El departamento es obligatorio');
    
    const rolesArray = Array.isArray(data.roles) ? data.roles : 
      (typeof data.roles === 'string' ? data.roles.split(',').map(r => r.trim()).filter(Boolean) : []);
    
    if (rolesArray.length === 0) 
      errors.push('El rol es obligatorio');
    
    if (!data.genero || !['masculino', 'femenino', 'otro'].includes(data.genero)) 
      errors.push('Debes seleccionar un género válido');
    
    return errors.length > 0 ? errors.join('. ') : null;
  }, []);

  // Manejador de cambios en inputs del formulario con autoguardado y debounce
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let updatedValue: any = value;

    if (name === 'roles' && typeof value === 'string') {
      updatedValue = value.split(',').map(r => r.trim()).filter(Boolean);
    }
    
    if (name === 'fechaRegistro') {
        const dateObj = new Date(value);
        updatedValue = isNaN(dateObj.getTime()) ? '' : dateObj.toISOString();
    }

    setForm(prevForm => {
        const newForm = { ...prevForm, [name]: updatedValue };
        // Si estamos en modo edición, guardar con debounce
        if (edit) {
            // Limpiar el timeout anterior si existe
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            
            // Configurar un nuevo timeout para guardar después de 1.5 segundos
            debounceTimeoutRef.current = setTimeout(() => {
                saveUserDataLocally(newForm, false).catch(error => {
                    console.error('Error en autoguardado:', error);
                });
            }, 1500);
        }
        return newForm;
    });
  };

  // Manejar cambio de foto con validación
  const handleFotoChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMG_TYPES.includes(file.type)) {
      showThemedToast('El archivo debe ser una imagen válida (jpg, png, gif, webp).', 'error');
      return;
    }
    if (file.size > MAX_IMG_SIZE) {
      showThemedToast('La imagen debe pesar menos de 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      setFotoPreview(result);
      const updatedForm: Usuario = {
        ...form, // Coger el último estado del formulario, no de las props directas
        foto: result,
        fotoZoom: 1,
        fotoRotation: 0,
        fotoPositionX: 0,
        fotoPositionY: 0,
      };
      setForm(updatedForm); // Actualiza form state para previsualización
      setZoomLevel(1);
      setRotation(0);
      setPosition({x: 0, y: 0});
      
      // Subir la foto al servidor
      try {
        showThemedToast('Subiendo foto...', 'info');
        const fotoUrl = await uploadProfilePhoto(file);
        
        // Actualizar el formulario con la URL devuelta por el servidor
        const finalForm = {
          ...updatedForm,
          foto: fotoUrl
        };
        
        setForm(finalForm);
        
        // Guardar en localStorage
        localStorage.setItem('usuario', JSON.stringify(finalForm));
        
        // Actualizar el contexto
        if (setUsuario) {
          setUsuario(finalForm);
        }
        
        showThemedToast('Foto actualizada correctamente', 'success');
      } catch (error) {
        console.error('Error al subir foto:', error);
        showThemedToast('Error al subir la foto. Inténtalo de nuevo.', 'error');
      }
    };
    reader.readAsDataURL(file);
  }, [form]); // Dependencia form para tener los últimos datos

  const handleRemoveFoto = useCallback(async () => {
    const confirmRemove = window.confirm('¿Estás seguro de que deseas eliminar tu foto de perfil?');
    if (!confirmRemove) return;
    
    try {
      showThemedToast('Eliminando foto...', 'info');
      
      // Eliminar la foto del servidor
      await deleteProfilePhoto();
      
      const updatedForm: Usuario = {
        ...form,
        foto: null,
        fotoZoom: 1,
        fotoRotation: 0,
        fotoPositionX: 0,
        fotoPositionY: 0,
      };
      
      setFotoPreview(null);
      setForm(updatedForm);
      setZoomLevel(1);
      setRotation(0);
      setPosition({x: 0, y: 0});
      
      // Guardar en localStorage
      localStorage.setItem('usuario', JSON.stringify(updatedForm));
      
      // Actualizar el contexto
      if (setUsuario) {
        setUsuario(updatedForm);
      }
      
      showThemedToast('Foto eliminada correctamente', 'success');
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      showThemedToast('Error al eliminar la foto. Inténtalo de nuevo.', 'error');
    }
  }, [form, setUsuario]);

  // Manipulación de foto (Zoom, Rotar, Resetear)
  const updateFormWithPhotoProps = useCallback(async (newProps: Partial<Usuario>) => {
    setForm(prevForm => {
        const updatedForm = { ...prevForm, ...newProps };
        if (edit) {
            // Usar setTimeout para evitar actualizar el estado durante el renderizado
            setTimeout(() => {
              saveUserDataLocally(updatedForm).catch(error => {
                console.error('Error en autoguardado de propiedades de foto:', error);
                // No mostramos un toast adicional para no sobrecargar al usuario
              });
            }, 0);
        }
        return updatedForm;
    });
  }, [edit, saveUserDataLocally]);

  const handleZoomIn = useCallback(async () => {
    setZoomLevel(prev => { const newZoom = Math.min(prev + 0.1, 3); updateFormWithPhotoProps({ fotoZoom: newZoom }); return newZoom; });
  }, [updateFormWithPhotoProps]);

  const handleZoomOut = useCallback(async () => {
    setZoomLevel(prev => { const newZoom = Math.max(prev - 0.1, 0.5); updateFormWithPhotoProps({ fotoZoom: newZoom }); return newZoom; });
  }, [updateFormWithPhotoProps]);

  const handleRotate = useCallback(async () => {
    setRotation(prev => { const newRotation = (prev + 90) % 360; updateFormWithPhotoProps({ fotoRotation: newRotation }); return newRotation; });
  }, [updateFormWithPhotoProps]);

  const handleResetImage = useCallback(async () => {
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    await updateFormWithPhotoProps({
      fotoZoom: 1,
      fotoRotation: 0,
      fotoPositionX: 0,
      fotoPositionY: 0,
    });
    showThemedToast('Foto de perfil restaurada.', 'info');
  }, [updateFormWithPhotoProps]);

  const handleDownloadImage = useCallback(() => {
    if (!fotoPreview) {
      showThemedToast('No hay imagen para descargar.', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = fotoPreview;
    link.download = `perfil_${(form.nombre || 'usuario').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showThemedToast('Imagen descargada correctamente.', 'success');
  }, [fotoPreview, form.nombre, showThemedToast]);


  // Funciones de Drag para mover la foto
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!edit || !fotoPreview) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [edit, fotoPreview, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && edit && fotoPreview) {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, edit, fotoPreview]);

  const handleMouseUp = useCallback(async () => {
    setIsDragging(false);
    if (edit) {
        await updateFormWithPhotoProps({ fotoPositionX: position.x, fotoPositionY: position.y });
    }
  }, [edit, position, updateFormWithPhotoProps]);

  useEffect(() => { // Agrega/remueve listeners globales
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]); // Dependencias para re-attach al cambiar (seguridad)


  // Guardar cambios finales (con validación y SIMULACIÓN de petición al backend)
  const handleSave = async () => {
    const errorMsg = validateProfileForm(form);
    if (errorMsg) {
      showThemedToast(errorMsg, 'error');
      return;
    }
    try {
      showThemedToast('Guardando cambios...', 'info');
      
      const rolesToSend = Array.isArray(form.roles) ? form.roles : (form.roles ? String(form.roles).split(',').map(r => r.trim()).filter(Boolean) : []);
      
      const payload: Usuario = { 
          ...form, 
          roles: rolesToSend,
          // Asegúrate de que las propiedades de manipulación de foto se incluyan
          fotoZoom: zoomLevel,
          fotoRotation: rotation,
          fotoPositionX: position.x,
          fotoPositionY: position.y,
      };

      // Eliminar propiedades que no deberían enviarse al backend
      delete payload.fotoZoom;
      delete payload.fotoRotation;
      delete payload.fotoPositionX;
      delete payload.fotoPositionY;
      
      // Llamar a la API para guardar los cambios
      const updatedUser = await saveUserDataInRealTime(payload);

      setEdit(false);
      // Actualizar el contexto de autenticación después de que el renderizado haya finalizado
      setTimeout(() => {
        if (setUsuario) {
          // Asegurarse de que el rol se mantenga correctamente en el contexto
          const rolActual = usuario?.roles;
          const updatedUserData = {
            ...updatedUser,
            roles: rolActual,
            // Mantener las propiedades de manipulación de foto que no se guardan en el backend
            fotoZoom: zoomLevel,
            fotoRotation: rotation,
            fotoPositionX: position.x,
            fotoPositionY: position.y,
          };
          
          // Actualizar contexto de autenticación
          setUsuario(updatedUserData);
          
          // Guardar en localStorage con todas las propiedades
          localStorage.setItem('usuario', JSON.stringify(updatedUserData));
        }
      }, 0);

      showThemedToast('Perfil actualizado y guardado correctamente.', 'success');
    } catch (err: any) {
      console.error("Save error:", err);
      
      // Proporcionar un mensaje de error más específico
      let errorMessage = 'Error desconocido al guardar el perfil';
      
      if (err.response) {
        // Error de respuesta del servidor
        errorMessage = err.response.data?.message || `Error del servidor (${err.response.status})`;
      } else if (err.message) {
        // Error de la aplicación
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        // Error como string
        errorMessage = err;
      }
      
      showThemedToast(`No se pudo guardar: ${errorMessage}`, 'error');
    }
  };

  const handleCancel = useCallback(() => {
    const confirmCancel = window.confirm('¿Estás seguro de que deseas cancelar la edición? Se perderán los cambios no guardados en esta sesión.');
    if (!confirmCancel) return;

    setEdit(false);
    showThemedToast('Edición cancelada. Revirtiendo a última versión guardada.', 'info');

    // Restaurar el estado original del usuario desde localStorage o AuthContext
    let originalUserData: Usuario | null = usuario || null; // Prioriza AuthContext
    if (!originalUserData) { // Si no está en AuthContext, intenta localStorage
        const savedDataStr = localStorage.getItem('usuario');
        if (savedDataStr) {
            originalUserData = JSON.parse(savedDataStr);
        }
    }
    
    // Si se encontró algún dato, restaurarlo, de lo contrario, limpiar.
    if (originalUserData) {
        setForm(originalUserData);
        setFotoPreview(originalUserData.foto || null);
        setZoomLevel(originalUserData.fotoZoom || 1);
        setRotation(originalUserData.fotoRotation || 0);
        setPosition({ x: originalUserData.fotoPositionX || 0, y: originalUserData.fotoPositionY || 0 });
    } else {
        // Fallback completo si no hay respaldo, limpia el formulario
        setForm({
          nombre: undefined,
          email: undefined,
          departamento: undefined,
          roles: undefined,
          foto: undefined,
          fechaRegistro: undefined,
          genero: undefined
        });
        setFotoPreview(null);
        setZoomLevel(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    }
  }, [usuario, showThemedToast]); // Agregado showThemedToast como dependencia


  // Helper para determinar el rol principal a mostrar
  const getRolPrincipal = useCallback((): string => {
    // Primero intentar obtener el rol del contexto de autenticación
    if (usuario && usuario.roles) {
      // Si roles es un string, devolverlo directamente
      if (typeof usuario.roles === 'string') {
        return usuario.roles;
      }
      // Si roles es un array, devolver el primer elemento
      if (Array.isArray(usuario.roles) && usuario.roles.length > 0) {
        return usuario.roles[0];
      }
      // Si ninguno de los casos anteriores, devolver un valor por defecto
      return 'usuario';
    }
    
    // Si no está en el contexto, intentar obtenerlo del localStorage
    try {
      const storedUser = localStorage.getItem('usuario');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.roles) {
          // Si roles es un string, devolverlo directamente
          if (typeof parsedUser.roles === 'string') {
            return parsedUser.roles;
          }
          // Si roles es un array, devolver el primer elemento
          if (Array.isArray(parsedUser.roles) && parsedUser.roles.length > 0) {
            return parsedUser.roles[0];
          }
          // Si ninguno de los casos anteriores, devolver un valor por defecto
          return 'usuario';
        }
      }
    } catch (error) {
      console.error('Error al obtener usuario del localStorage:', error);
    }
    // Si no está en el contexto, usar el formulario
    const rolesArray = Array.isArray(form.roles) ? form.roles : (typeof form.roles === 'string' ? form.roles.split(',').map(r => r.trim()).filter(Boolean) : []);
    
    // Prioridad para mostrar el rol más "alto" o significativo
    if (rolesArray.some(r => r.toLowerCase() === 'administrador')) return 'administrador';
    if (rolesArray.some(r => r.toLowerCase() === 'jefe')) return 'jefe_departamento';
    if (rolesArray.some(r => r.toLowerCase() === 'tecnico')) return 'tecnico';
    return 'usuario';
  }, [form.roles, usuario]);

  // Preguntas Frecuentes, adaptadas a Lucide Icons y colores, con rol dinámico.
  const getPreguntasFrecuentes = useCallback((): PreguntaFrecuente[] => {
    const rol = getRolPrincipal();
    switch (rol) {
      case 'administrador':
        return [
          { id: 1, pregunta: '¿Cómo gestiono usuarios y permisos?', respuesta: 'Desde el panel de administración, puedes agregar, editar o eliminar cuentas de usuario, y ajustar sus roles y permisos.', icono: <User className="h-6 w-6 text-indigo-600" /> },
          { id: 2, pregunta: '¿Dónde puedo visualizar reportes detallados y métricas?', respuesta: 'Accede a la sección de "Dashboard" o "Panel de Control" para filtrar, analizar y exportar información relevante sobre los incidentes y su resolución.', icono: <AlertCircle className="h-6 w-6 text-orange-600" /> },
          { id: 3, pregunta: '¿Cómo puedo generar y distribuir códigos QR para acceso rápido?', respuesta: 'Sí, en la sección "Generar QR" puedes crear códigos personalizados para un acceso directo y compartible al formulario de reportes desde cualquier dispositivo móvil.', icono: <QrCode className="h-6 w-6 text-purple-600" /> }
        ];
      case 'jefe_departamento':
        return [
          { id: 1, pregunta: '¿Cómo asigno y hago seguimiento a tareas de mi equipo?', respuesta: 'Desde el panel de "Reportes Asignados" en el Dashboard, puedes visualizar los reportes pendientes de tu departamento y reasignarlos a los miembros de tu equipo para una gestión eficiente.', icono: <Building className="h-6 w-6 text-blue-600" /> },
          { id: 2, pregunta: '¿Cómo obtengo métricas de rendimiento específicas de mi departamento?', respuesta: 'En la sección de "Dashboard", utiliza los filtros por departamento para obtener un análisis específico del volumen, tipo y estado de los reportes en tu área, facilitando la toma de decisiones.', icono: <Calendar className="h-6 w-6 text-emerald-600" /> }
        ];
      case 'tecnico':
        return [
          { id: 1, pregunta: '¿Cómo actualizo el estado de un reporte asignado?', respuesta: 'Navega a la tabla de "Detalle de Reportes" en el Dashboard. Ubica el reporte correspondiente, y en la columna de "Estado", utiliza el menú desplegable para cambiarlo a Pendiente, En Proceso o Resuelto según tu avance.', icono: <CheckCircle className="h-6 w-6 text-green-600" /> },
          { id: 2, pregunta: '¿Dónde puedo ver solo los reportes que se me han asignado?', respuesta: 'En la tabla principal de reportes del Dashboard, puedes usar el filtro "Asignado a" y seleccionarte a ti mismo. Esto mostrará únicamente las tareas que requieren tu atención inmediata.', icono: <Share2 className="h-6 w-6 text-teal-600" /> }
        ];
      case 'usuario': // Default/General User
      default:
        return [
          { id: 1, pregunta: '¿Cómo puedo enviar un nuevo reporte o solicitar un servicio?', respuesta: 'Para enviar un nuevo reporte, haz clic en el botón "Crear Nuevo Reporte" disponible en la página principal, luego rellena el formulario con todos los detalles del problema y envíalo.', icono: <Edit2 className="h-6 w-6 text-yellow-600" /> },
          { id: 2, pregunta: '¿Cómo puedo actualizar mi información de perfil personal?', respuesta: 'Para actualizar tus datos de contacto o cambiar tu género, haz clic en el botón "Editar Perfil" en esta misma página. Realiza los cambios necesarios en los campos editables y luego selecciona "Guardar Cambios" para confirmarlos.', icono: <User className="h-6 w-6 text-blue-600" /> },
          { id: 3, pregunta: '¿Qué hacer si un reporte tarda en resolverse?', respuesta: 'Puedes consultar el estado de tus reportes en el "Dashboard". Si consideras que la espera es excesiva, contacta directamente al Departamento de Sistemas mencionando el ID de tu reporte.', icono: <Clock className="h-6 w-6 text-orange-600" /> }
        ];
    }
  }, [getRolPrincipal]);


  // Si aún está cargando o no hay datos válidos iniciales, muestra un spinner.
  // Es importante que `displayUsuario.nombre` sea el criterio principal si `form` se inicia como `{}`.
  const displayUsuario = form; // Siempre usa `form` como fuente para renderizado.

  if (!displayUsuario._id) { // Solo si no tenemos ni siquiera un ID de usuario válido cargado.
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-100 via-blue-100 to-green-100">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center space-y-3 text-blue-700 text-2xl font-bold">
          <motion.div
            className="w-12 h-12 border-4 border-t-transparent border-blue-700 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          ></motion.div>
          <span>Cargando perfil...</span>
        </motion.div>
      </div>
    );
  }

  return (
    // Fondo y contenedor principal con animaciones de ondas de colores mejoradas
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-emerald-50 p-4 sm:p-6 lg:p-8 font-inter antialiased relative overflow-hidden">
      {/* Círculos de fondo animados (blobs) mejorados */}
      <div className="absolute inset-0 mix-blend-multiply opacity-40 z-0">
        <motion.div
            initial={{ x: -200, y: -200, opacity: 0 }}
            animate={{ x: [-200, 1200], y: [-200, 1000], opacity: [0, 0.5, 0] }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" as const }}
            className="w-96 h-96 rounded-full bg-gradient-to-r from-blue-300 to-indigo-300 absolute blur-3xl"
        ></motion.div>
        <motion.div
            initial={{ x: 1000, y: 200, opacity: 0 }}
            animate={{ x: [1000, -300], y: [200, 1100], opacity: [0, 0.5, 0] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" as const }}
            className="w-[28rem] h-[28rem] rounded-full bg-gradient-to-r from-purple-300 to-pink-300 absolute blur-3xl"
        ></motion.div>
        <motion.div
            initial={{ x: 500, y: 800, opacity: 0 }}
            animate={{ x: [500, -100], y: [800, -300], opacity: [0, 0.4, 0] }}
            transition={{ duration: 55, repeat: Infinity, ease: "linear" as const }}
            className="w-80 h-80 rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 absolute blur-3xl"
        ></motion.div>
        {/* Partículas flotantes */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -Math.random() * 100 - 50],
              x: [0, (Math.random() - 0.5) * 100],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Contenedor principal del perfil con estilo Glassmorphism mejorado y animaciones */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 100, damping: 10, delay: 0.2 }}
        className="relative z-10 w-full max-w-5xl bg-white/90 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/20 p-8 sm:p-10 transform hover:scale-[1.01] hover:shadow-3xl transition-all duration-500 overflow-hidden"
      >
        {/* Elementos decorativos del contenedor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-20 blur-xl"></div>
        {/* Sección de la foto de perfil y el encabezado de información del usuario */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8 pb-8 border-b-2 border-gray-100">
          {/* Contenedor de la Foto de Perfil */}
          <div className="relative flex-shrink-0 group">
            <div
              className="relative overflow-hidden w-40 h-40 sm:w-48 sm:h-48 rounded-full shadow-2xl border-4 border-blue-400 bg-white ring-4 ring-purple-300 ring-opacity-70 p-1.5"
              onMouseDown={edit && fotoPreview ? handleMouseDown : undefined}
              style={{
                cursor: edit && fotoPreview && !isDragging ? 'grab' : isDragging ? 'grabbing' : 'default',
              }}
              title={edit ? "Haz clic y arrastra para mover la foto" : ""}
            >
              <motion.img
                src={fotoPreview || '/Montemorelos.jpg'}
                alt={`Foto de perfil de ${displayUsuario.nombre}`}
                className="w-full h-full object-cover rounded-full will-change-transform" // Add will-change-transform for smooth animations
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                draggable={false} // Evitar el drag por defecto del navegador
              />
              {edit && fotoPreview && ( // Overlay visible en edición
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 cursor-grab rounded-full z-10"> {/* Add z-10 to make overlay appear on top */}
                  <span className="text-white text-sm font-medium bg-black/70 px-3 py-1 rounded-full">Arrastra para mover</span>
                </div>
              )}
            </div>
            {/* Opciones de edición de foto */}
            {edit && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                  className="absolute -bottom-2 -right-2 flex flex-col gap-2 p-3 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 transition-all duration-300 z-20"
                >
                  <label 
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-base font-semibold cursor-pointer shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors group"
                    htmlFor="file-upload-input"
                    title="Cambiar foto de perfil"
                  >
                    <Camera className="w-5 h-5 transition-transform group-hover:scale-110" /> Cambiar
                    <input
                      id="file-upload-input"
                      type="file"
                      accept={ALLOWED_IMG_TYPES.join(',')}
                      onChange={handleFotoChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                  </label>
                  
                  {/* Herramientas de manipulación de foto */}
                  {fotoPreview && (
                    <>
                      <div className="flex gap-2 bg-blue-50/70 rounded-xl p-2 shadow-inner border border-blue-100 mt-2 flex-wrap justify-center">
                        <motion.button
                          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                          onClick={handleZoomIn}
                          className="bg-blue-100 hover:bg-blue-200 p-2 rounded-full flex items-center text-blue-700 shadow-md transition-colors"
                          title="Acercar (Zoom In)"
                          aria-label="Acercar la foto de perfil"
                        >
                          <ZoomIn className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                          onClick={handleZoomOut}
                          className="bg-blue-100 hover:bg-blue-200 p-2 rounded-full flex items-center text-blue-700 shadow-md transition-colors"
                          title="Alejar (Zoom Out)"
                          aria-label="Alejar la foto de perfil"
                        >
                          <ZoomOut className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: 15 }} whileTap={{ scale: 0.9 }}
                          onClick={handleRotate}
                          className="bg-blue-100 hover:bg-blue-200 p-2 rounded-full flex items-center text-blue-700 shadow-md transition-colors"
                          title="Rotar 90 grados"
                          aria-label="Rotar la foto de perfil 90 grados"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                          onClick={handleResetImage}
                          className="bg-red-100 hover:bg-red-200 p-2 rounded-full flex items-center text-red-700 shadow-md transition-colors"
                          title="Restaurar imagen (zoom, rotación, posición)"
                          aria-label="Restaurar la foto de perfil a su estado original"
                        >
                          <XCircle className="w-5 h-5" />
                        </motion.button>
                      </div>
                      {/* Botones de Descargar y Eliminar */}
                      <div className="flex gap-2 justify-center mt-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                          onClick={handleDownloadImage}
                          className="bg-emerald-500 text-white px-3 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-emerald-600 flex items-center gap-2 transition-colors"
                          title="Descargar imagen actual"
                          aria-label="Descargar la foto de perfil"
                        >
                          <Download className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                          onClick={handleRemoveFoto}
                          className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-red-600 flex items-center gap-2 transition-colors"
                          title="Eliminar foto de perfil"
                          aria-label="Eliminar la foto de perfil"
                        >
                          <XCircle className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
            {/* Indicador de Zoom y Posición (si editando y movida) */}
            {edit && fotoPreview && (zoomLevel !== 1 || rotation !== 0 || position.x !==0 || position.y !== 0) && (
              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full z-10">
                Zoom: {Math.round(zoomLevel * 100)}% {rotation !== 0 && `Rot: ${rotation}°`} {(position.x !== 0 || position.y !== 0) && `Pos: (${position.x}, ${position.y})`}
              </div>
            )}
          </div>

          {/* Información del Usuario (título y campos de datos) */}
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-800 tracking-wide drop-shadow-lg mb-3 leading-tight">
              Mi Perfil de{' '}
              {getRolPrincipal() === 'administrador' ? (form.genero === 'femenino' ? 'Administradora' : 'Administrador') :
               getRolPrincipal() === 'jefe_departamento' ? (form.genero === 'femenino' ? 'Jefa de Departamento' : 'Jefe de Departamento') :
               getRolPrincipal() === 'tecnico' ? (form.genero === 'femenino' ? 'Técnica' : 'Técnico') :
               (form.genero === 'femenino' ? 'Usuaria' : 'Usuario')}
            </h2>
            {/* Etiqueta de Rol */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <span className="text-xl text-blue-600 font-medium tracking-wide">Tipo de usuario:</span>
              <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-full text-lg shadow-md flex items-center gap-2">
                <Tag className="w-5 h-5" />
                {getRolPrincipal() === 'administrador' ? (form.genero === 'femenino' ? 'Administradora' : 'Administrador') :
                 getRolPrincipal() === 'jefe_departamento' ? (form.genero === 'femenino' ? 'Jefa de Departamento' : 'Jefe de Departamento') :
                 getRolPrincipal() === 'tecnico' ? (form.genero === 'femenino' ? 'Técnica' : 'Técnico') :
                 (form.genero === 'femenino' ? 'Usuaria' : 'Usuario')}
              </span>
            </div>
            <p className="text-lg sm:text-xl text-gray-700 font-medium tracking-wide mb-6">
              Visualiza y gestiona tu información personal y de cuenta en la plataforma.
            </p>
            
            {/* Campos de datos con efecto Glassmorphism y mejor organización */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              {/* Nombre Completo */}
              <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-blue-100 flex flex-col items-start gap-3 hover:scale-[1.005] transition-all duration-300 transform-gpu group">
                <div className="bg-blue-100/70 p-3 rounded-xl text-blue-700 flex-shrink-0 transition-colors group-hover:bg-blue-200">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <span className="block font-semibold text-gray-700 mb-1">Nombre Completo:</span>
                  {edit ? (
                    <>
                    <input
                      type="text"
                      name="nombre"
                      value={form.nombre || ''}
                      onChange={handleInputChange}
                      className="w-full border-2 border-blue-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-3 focus:ring-blue-400 transition bg-white text-blue-900"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1 self-end">
                      {form.nombre ? form.nombre.length : 0}/100 caracteres
                    </p>
                    </>
                  ) : (
                    <span className="text-blue-900 font-medium text-lg">{displayUsuario.nombre || 'No disponible'}</span>
                  )}
                </div>
              </motion.div>
              {/* Correo Electrónico */}
              <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4}} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-blue-100 flex flex-col items-start gap-3 hover:scale-[1.005] transition-all duration-300 transform-gpu group">
                <div className="bg-blue-100/70 p-3 rounded-xl text-blue-700 flex-shrink-0 transition-colors group-hover:bg-blue-200">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <span className="block font-semibold text-gray-700 mb-1">Correo Electrónico:</span>
                  {edit ? (
                    <input
                      type="email"
                      name="email"
                      value={form.email || ''}
                      onChange={handleInputChange}
                      className="w-full border-2 border-blue-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-3 focus:ring-blue-400 transition bg-white text-blue-900"
                    />
                  ) : (
                    <span className="text-blue-900 font-medium text-lg">{displayUsuario.email || 'No disponible'}</span>
                  )}
                </div>
              </motion.div>
              {/* Departamento */}
              <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-blue-100 flex flex-col items-start gap-3 hover:scale-[1.005] transition-all duration-300 transform-gpu group">
                <div className="bg-blue-100/70 p-3 rounded-xl text-blue-700 flex-shrink-0 transition-colors group-hover:bg-blue-200">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <span className="block font-semibold text-gray-700 mb-1">Departamento:</span>
                  {edit ? (
                    <>
                    <input
                      type="text"
                      name="departamento"
                      value={form.departamento || ''}
                      onChange={handleInputChange}
                      className="w-full border-2 border-blue-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-3 focus:ring-blue-400 transition bg-white text-blue-900"
                      maxLength={100}
                    />
                     <p className="text-xs text-gray-500 mt-1 self-end">
                      {form.departamento ? form.departamento.length : 0}/100 caracteres
                    </p>
                    </>
                  ) : (
                    <span className="text-blue-900 font-medium text-lg">{displayUsuario.departamento || 'No disponible'}</span>
                  )}
                </div>
              </motion.div>
              {/* Roles */}
              {/* Solo mostrar roles si existen, o si estamos en edición y el usuario NO TIENE ROL */}
              {(displayUsuario.roles && (Array.isArray(displayUsuario.roles) && displayUsuario.roles.length > 0)) || edit ? (
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.6}} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-blue-100 flex flex-col items-start gap-3 hover:scale-[1.005] transition-all duration-300 transform-gpu group">
                  <div className="bg-blue-100/70 p-3 rounded-xl text-blue-700 flex-shrink-0 transition-colors group-hover:bg-blue-200">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block font-semibold text-gray-700 mb-1">Roles de Usuario:</span>
                    {edit ? (
                      <input
                        type="text"
                        name="roles"
                        placeholder="separar por coma"
                        value={Array.isArray(form.roles) ? form.roles.join(', ') : (form.roles || '')}
                        onChange={handleInputChange}
                        className="w-full border-2 border-blue-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-3 focus:ring-blue-400 transition bg-white text-blue-900"
                      />
                    ) : (
                      <span className="text-blue-900 font-medium text-lg">
                        {Array.isArray(displayUsuario.roles) 
                            ? (displayUsuario.roles.length > 0 ? displayUsuario.roles.join(', ') : 'Sin roles asignados') 
                            : (displayUsuario.roles || 'Sin roles asignados')
                        }
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : null}
              {/* Fecha de Registro y Tiempo Activo */}
              <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.7}} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-blue-100 flex flex-col items-start gap-3 hover:scale-[1.005] transition-all duration-300 transform-gpu group">
                <div className="bg-blue-100/70 p-3 rounded-xl text-blue-700 flex-shrink-0 transition-colors group-hover:bg-blue-200">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="block font-semibold text-gray-700 mb-1">Fecha de Registro:</span>
                  {edit ? (
                    <input
                      type="date"
                      name="fechaRegistro"
                      value={form.fechaRegistro ? form.fechaRegistro.slice(0, 10) : ''}
                      onChange={handleInputChange}
                      className="w-full border-2 border-blue-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-3 focus:ring-blue-400 transition bg-white text-blue-900"
                    />
                  ) : (
                    <div>
                      <span className="text-blue-900 font-medium text-lg block mb-2">
                        {displayUsuario.fechaRegistro
                          ? new Date(displayUsuario.fechaRegistro).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'No disponible'}
                      </span>
                      <div className="flex items-center gap-2 text-blue-700 bg-blue-100 px-3 py-1 rounded-full w-fit">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Activo: {tiempoActivo.dias}d {tiempoActivo.horas}h {tiempoActivo.minutos}m {tiempoActivo.segundos}s
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              {/* Género */}
              <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.8}} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-blue-100 flex flex-col items-start gap-3 hover:scale-[1.005] transition-all duration-300 transform-gpu group">
                <div className="bg-blue-100/70 p-3 rounded-xl text-blue-700 flex-shrink-0 transition-colors group-hover:bg-blue-200">
                  <User className="w-6 h-6" /> {/* Icono más general de usuario para género */}
                </div>
                <div>
                  <span className="block font-semibold text-gray-700 mb-1">Género:</span>
                  {edit ? (
                    <select
                      name="genero"
                      value={form.genero || ''}
                      onChange={handleInputChange}
                      className="w-full border-2 border-blue-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-3 focus:ring-blue-400 transition bg-white text-blue-900"
                    >
                      <option value="">Selecciona</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                  ) : (
                    <span className="text-blue-900 font-medium text-lg">
                     {form.genero === 'masculino'
                     ? 'Masculino'
                     : form.genero === 'femenino'
                     ? 'Femenino'
                     : form.genero === 'otro'
                     ? 'Otro'
                     : 'No especificado'}

                    </span>
                  )}
                </div>
              </motion.div>
              {/* Teléfono */}
              <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.9}} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-blue-100 flex flex-col items-start gap-3 hover:scale-[1.005] transition-all duration-300 transform-gpu group">
                <div className="bg-blue-100/70 p-3 rounded-xl text-blue-700 flex-shrink-0 transition-colors group-hover:bg-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="w-full">
                  <span className="block font-semibold text-gray-700 mb-1">Teléfono:</span>
                  {edit ? (
                    <>
                    <input
                      type="tel"
                      name="telefono"
                      value={form.telefono || ''}
                      onChange={handleInputChange}
                      placeholder="+52 123 456 7890"
                      className="w-full border-2 border-blue-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-3 focus:ring-blue-400 transition bg-white text-blue-900"
                    />
                    <p className="text-xs text-gray-500 mt-1 self-end">Formato: +52 123 456 7890</p>
                    </>
                  ) : (
                    <span className="text-blue-900 font-medium text-lg">{displayUsuario.telefono || 'No disponible'}</span>
                  )}
                </div>
              </motion.div>
              {/* Biografía */}
              <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 1.0}} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-blue-100 flex flex-col items-start gap-3 hover:scale-[1.005] transition-all duration-300 transform-gpu group md:col-span-2">
                <div className="bg-blue-100/70 p-3 rounded-xl text-blue-700 flex-shrink-0 transition-colors group-hover:bg-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="w-full">
                  <span className="block font-semibold text-gray-700 mb-1">Biografía:</span>
                  {edit ? (
                    <textarea
                      name="bio"
                      value={form.bio || ''}
                      onChange={handleInputChange}
                      placeholder="Cuéntanos sobre ti..."
                      className="w-full border-2 border-blue-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-3 focus:ring-blue-400 transition bg-white text-blue-900 min-h-[100px]"
                      maxLength={300}
                    />
                  ) : (
                    <div>
                      <p className="text-blue-900 font-medium text-lg">
                        {displayUsuario.bio ? 
                          (mostrarBioCompleta ? displayUsuario.bio : `${displayUsuario.bio.substring(0, 150)}${displayUsuario.bio.length > 150 ? '...' : ''}`) : 
                          'No disponible'}
                      </p>
                      {displayUsuario.bio && displayUsuario.bio.length > 150 && (
                        <button 
                          onClick={() => setMostrarBioCompleta(!mostrarBioCompleta)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 flex items-center gap-1"
                        >
                          {mostrarBioCompleta ? (
                            <>
                              <EyeOff className="w-4 h-4" /> Ver menos
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" /> Ver más
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  {edit && (
                    <p className="text-xs text-gray-500 mt-1 self-end">
                      {form.bio ? form.bio.length : 0}/300 caracteres
                    </p>
                  )}
                </div>
              </motion.div>
              {/* Privacidad */}
              <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 1.1}} className="bg-white/80 rounded-2xl p-5 shadow-lg border border-blue-100 flex flex-col items-start gap-3 hover:scale-[1.005] transition-all duration-300 transform-gpu group">
                <div className="bg-blue-100/70 p-3 rounded-xl text-blue-700 flex-shrink-0 transition-colors group-hover:bg-blue-200">
                  {form.perfilPublico ? (
                    <Unlock className="w-6 h-6" />
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span className="block font-semibold text-gray-700 mb-1">Privacidad del Perfil:</span>
                  {edit ? (
                    <div className="flex items-center gap-3 mt-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="perfilPublico"
                          checked={form.perfilPublico || false}
                          onChange={(e) => handleInputChange({
                            target: {
                              name: 'perfilPublico',
                              value: e.target.checked,
                              type: 'checkbox'
                            }
                          } as any)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span className="text-blue-900 font-medium">
                        {form.perfilPublico ? 'Perfil público' : 'Perfil privado'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {form.perfilPublico ? (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <Unlock className="w-5 h-5" /> Perfil público
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <Lock className="w-5 h-5" /> Perfil privado
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Sección de Preguntas Frecuentes */}
        <div className="mt-8 pt-8 border-t-2 border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <HelpCircle className="w-7 h-7 text-green-600" />
              Preguntas Frecuentes para tu Rol
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMostrarPreguntas(!mostrarPreguntas)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md"
              aria-expanded={mostrarPreguntas}
              aria-controls="faq-section"
            >
              {mostrarPreguntas ? 'Ocultar Preguntas' : 'Mostrar Preguntas'}
            </motion.button>
          </div>

          <AnimatePresence>
            {mostrarPreguntas && (
              <motion.div
                id="faq-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden"
              >
                {getPreguntasFrecuentes().map((pregunta, index) => (
                  <motion.div
                    key={pregunta.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white/80 border border-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow transform hover:scale-[1.01]"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-blue-50 p-2 rounded-xl text-blue-600 flex-shrink-0 border border-blue-100">
                          {pregunta.icono}
                      </div>
                      <h4 className="font-semibold text-blue-800 text-lg sm:text-xl leading-tight">{pregunta.pregunta}</h4>
                    </div>
                    <p className="text-gray-700 text-base leading-relaxed">{pregunta.respuesta}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-center md:justify-end gap-4 mt-10 pt-8 border-t-2 border-gray-100">
          {!edit ? (
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(66, 153, 225, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEdit(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-lg"
              aria-label="Activar modo de edición de perfil"
            >
              <Edit2 className="w-6 h-6" />
              <span>Editar Perfil</span>
            </motion.button>
          ) : (
            <>
              {/* Guardar */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                aria-label="Guardar cambios del perfil"
              >
                <CheckCircle className="w-6 h-6" />
                <span>Guardar Cambios</span>
              </motion.button>
              {/* Cancelar */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(107, 114, 128, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                aria-label="Cancelar cambios y salir del modo edición"
              >
                <XCircle className="w-6 h-6" />
                <span>Cancelar</span>
              </motion.button>
            </>
          )}
          {/* Ir a inicio */}
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/home')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl shadow-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            aria-label="Navegar a la página de inicio"
          >
            <Home className="w-6 h-6" />
            <span>Ir al Inicio</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;