// src/pages/Profile.tsx
import React, { useEffect, useState, ChangeEvent, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Building, Shield, Calendar, Camera, XCircle, Home, Edit2, CheckCircle, Clock, HelpCircle, ZoomIn, ZoomOut, RotateCcw, Download, Share2, AlertCircle, Info, QrCode, Tag } from 'lucide-react'; // Agregué Tag para los roles
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast'; // Importar react-hot-toast directamente

// region: Interfaces y Configuración

interface Usuario {
  _id?: string;
  nombre?: string;
  email?: string;
  departamento?: string;
  roles?: string[] | string;
  foto?: string | null;
  fechaRegistro?: string;
  genero?: 'masculino' | 'femenino' | 'otro';
  // Propiedades para manipular la foto en el frontend, que podrían ser guardadas en backend si se quiere persistir la edición.
  fotoZoom?: number;
  fotoRotation?: number;
  fotoPositionX?: number;
  fotoPositionY?: number;
  [key: string]: any;
}

interface PreguntaFrecuente {
  id: number;
  pregunta: string;
  respuesta: string;
  icono: React.ReactNode;
}

// Helper para mostrar un toast con estilos personalizados
const showThemedToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
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
    case 'info':
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

// Helper para simular API request (reemplaza con tu instancia real de `axios` o `fetch`)

const updateUserProfile = async (userData: Usuario): Promise<Usuario> => {
  try {
    // Asegurarse de que el email existe antes de hacer la petición
    if (!userData.email) {
      throw new Error('El email del usuario es requerido para actualizar el perfil');
    }
    
    // Crear una copia de los datos para enviar al backend
    const payload = { ...userData };
    
    // Eliminar propiedades que no deberían enviarse al backend
    delete payload.fotoZoom;
    delete payload.fotoRotation;
    delete payload.fotoPositionX;
    delete payload.fotoPositionY;
    
    // El endpoint solo devuelve un mensaje de éxito, así que devolvemos los datos que enviamos
    return userData;
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    
    // Proporcionar un mensaje de error más específico si está disponible
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido al actualizar el perfil';
    throw new Error(errorMessage);
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
  
  // Estados para manipulación de la imagen
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 }); // Ref para el inicio del drag

  // Autoguardado: Cuando `form` cambia y estamos en modo edición, y no estamos arrastrando
  const saveUserDataLocally = useCallback(async (data: Usuario) => {
    try {
      // Si la foto cambió y el modo edición, guardar las propiedades de la foto.
      if (setUsuario) { // Si el contexto proporciona `setUsuario`
        setUsuario(data);
      }
      // Guardar en localStorage para persistencia básica
      localStorage.setItem('usuario', JSON.stringify(data));

      // También guardar en el backend en tiempo real solo si estamos en modo edición y hay un email válido
      if (edit && data.email) {
        try {
          // Crear una copia de los datos para enviar al backend
          const payload: Usuario = { ...data };

          // Eliminar propiedades que no deberían enviarse al backend
          delete payload.fotoZoom;
          delete payload.fotoRotation;
          delete payload.fotoPositionX;
          delete payload.fotoPositionY;

          await updateUserProfile(payload);
        } catch (apiError: any) {
          console.error('Error al guardar en el backend:', apiError);
          // No interrumpimos el flujo del usuario si falla el guardado en el backend
          // Pero registramos el error para depuración
          if (apiError.response) {
            console.error('Error response:', apiError.response.data);
          }
        }
      }
    } catch (error) {
      console.error('Error al guardar datos en tiempo real:', error);
      // No mostramos un toast aquí para no interrumpir la experiencia del usuario
    }
  }, [setUsuario, edit, updateUserProfile]); // Incluir todas las dependencias necesarias

  // Efecto para la carga inicial de datos del usuario y configuración del temporizador
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const loadUserData = async () => {
      let initialUserData: Usuario | null = usuario || null;

      // Si el usuario no está en el contexto (p.ej., refresco de página), búscalo en localStorage.
      if (!initialUserData) {
        const savedData = localStorage.getItem('usuario');
        if (savedData) {
          try {
            initialUserData = JSON.parse(savedData) as Usuario;
          } catch (e) {
            console.error("Error parsing user data from localStorage:", e);
            localStorage.removeItem('usuario'); // Corrupted data
            // Solo navegar si realmente no estamos logueados para evitar bucles si hay token pero datos malos
            if (!isLoggedIn()) { 
                showThemedToast('Sesión expirada o datos corruptos. Inicia sesión de nuevo.', 'error');
                navigate('/login', { replace: true });
            }
            return;
          }
        }
      }

      // Si no hay datos de usuario después de todo, y no está loggeado, redirigir
      if (!initialUserData && !isLoggedIn()) {
        showThemedToast('No has iniciado sesión.', 'error');
        navigate('/login', { replace: true });
        return;
      }
      
      // Aplicar datos al estado del formulario
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
      } else {
        // Fallback si isLoggedIn es true pero no se encontraron datos de usuario.
        // Podría indicar un token válido pero sin información de perfil en el backend/localStorage.
        showThemedToast('Datos de usuario no disponibles. Intenta recargar o iniciar sesión de nuevo.', 'error');
      }
    };

    loadUserData();

    // Limpieza al desmontar o re-ejecutar el efecto
    return () => {
      if (intervalId) clearInterval(intervalId);
      // Remover event listeners globales de arrastre si se agregaron aquí
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

  const validateProfileForm = useCallback((data: Usuario): string | null => {
    if (!data.nombre || data.nombre.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
    if (!data.email || !validateEmail(data.email)) return 'El formato del correo electrónico es inválido.';
    if (!data.departamento || data.departamento.trim().length < 2) return 'El departamento es obligatorio.';
    
    // Convertir `roles` a array si es un string para la validación
    const rolesArray = Array.isArray(data.roles) ? data.roles : (typeof data.roles === 'string' ? data.roles.split(',').map(r => r.trim()).filter(Boolean) : []);
    if (rolesArray.length === 0) return 'El rol es obligatorio.';
    
    if (!data.genero || !['masculino', 'femenino', 'otro'].includes(data.genero)) return 'Debes seleccionar un género válido.';
    return null;
  }, []);

  // Manejador de cambios en inputs del formulario. Aquí aplicaremos un autoguardado (simulado).
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let updatedValue: any = value;

    // Convertir roles a un array si el input es de roles (por si es texto separado por comas)
    if (name === 'roles' && typeof value === 'string') {
      updatedValue = value.split(',').map(r => r.trim()).filter(Boolean);
    }
    
    // Convertir la fecha a formato ISO string
    if (name === 'fechaRegistro') {
        const dateObj = new Date(value);
        updatedValue = isNaN(dateObj.getTime()) ? '' : dateObj.toISOString();
    }

    setForm(prevForm => {
        const newForm = { ...prevForm, [name]: updatedValue };
        if (edit) { // Solo autoguardar si estamos en modo edición
            showThemedToast('Guardando automáticamente...', 'info'); // Pequeño feedback visual
            saveUserDataLocally(newForm).catch(error => {
              console.error('Error en autoguardado:', error);
              // No mostramos un toast adicional para no sobrecargar al usuario
            });
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
    reader.onloadend = () => {
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
      showThemedToast('Foto cargada, recuerda "Guardar Cambios" para actualizarla.', 'info');
      // No autoguardamos aquí porque la carga de imagen podría requerir un `save` explícito al backend
    };
    reader.readAsDataURL(file);
  }, [form]); // Dependencia form para tener los últimos datos

  const handleRemoveFoto = useCallback(() => {
    const confirmRemove = window.confirm('¿Estás seguro de que deseas eliminar tu foto de perfil?');
    if (!confirmRemove) return;
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
    showThemedToast('Foto eliminada (guarda los cambios).', 'info');
  }, [form]);

  // Manipulación de foto (Zoom, Rotar, Resetear)
  const updateFormWithPhotoProps = useCallback(async (newProps: Partial<Usuario>) => {
    setForm(prevForm => {
        const updatedForm = { ...prevForm, ...newProps };
        if (edit) {
            saveUserDataLocally(updatedForm).catch(error => {
              console.error('Error en autoguardado de propiedades de foto:', error);
              // No mostramos un toast adicional para no sobrecargar al usuario
            });
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
      const updatedUser = await updateUserProfile(payload);

      setEdit(false);
      if (setUsuario) {
          // Asegurarse de que el rol se mantenga correctamente en el contexto
          const rolActual = usuario?.rol;
          setUsuario({
            ...updatedUser,
            rol: rolActual,
            // Mantener las propiedades de manipulación de foto que no se guardan en el backend
            fotoZoom: zoomLevel,
            fotoRotation: rotation,
            fotoPositionX: position.x,
            fotoPositionY: position.y,
          }); // Actualiza contexto de autenticación
      }
      // Guardar en localStorage con todas las propiedades
      localStorage.setItem('usuario', JSON.stringify({
        ...updatedUser,
        rol: usuario?.rol,
        fotoZoom: zoomLevel,
        fotoRotation: rotation,
        fotoPositionX: position.x,
        fotoPositionY: position.y,
      }));

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
        setForm({});
        setFotoPreview(null);
        setZoomLevel(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    }
  }, [usuario, showThemedToast]); // Agregado showThemedToast como dependencia


  // Helper para determinar el rol principal a mostrar
  const getRolPrincipal = useCallback((): string => {
    // Primero intentar obtener el rol del contexto de autenticación
    if (usuario && usuario.rol) {
      return usuario.rol;
    }
    
    // Si no está en el contexto, intentar obtenerlo del localStorage
    try {
      const storedUser = localStorage.getItem('usuario');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.rol) {
          return parsedUser.rol;
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
    // Fondo y contenedor principal con animaciones de ondas de colores
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-green-50 p-4 sm:p-6 lg:p-8 font-inter antialiased relative overflow-hidden">
      {/* Círculos de fondo animados (blobs) */}
      <div className="absolute inset-0 mix-blend-multiply opacity-50 z-0">
        <motion.div
            initial={{ x: -100, y: -100, opacity: 0 }}
            animate={{ x: [-100, 1000], y: [-100, 800], opacity: [0, 0.4, 0] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" as const }}
            className="w-80 h-80 rounded-full bg-blue-300 absolute blur-2xl"
        ></motion.div>
        <motion.div
            initial={{ x: 800, y: 100, opacity: 0 }}
            animate={{ x: [800, -200], y: [100, 900], opacity: [0, 0.4, 0] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" as const }}
            className="w-96 h-96 rounded-full bg-purple-300 absolute blur-2xl"
        ></motion.div>
        <motion.div
            initial={{ x: 400, y: 700, opacity: 0 }}
            animate={{ x: [400, 0], y: [700, -200], opacity: [0, 0.3, 0] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" as const }}
            className="w-72 h-72 rounded-full bg-green-300 absolute blur-2xl"
        ></motion.div>
      </div>

      {/* Contenedor principal del perfil con estilo Glassmorphism y animaciones */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 100, damping: 10, delay: 0.2 }}
        className="relative z-10 w-full max-w-5xl bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-3xl border border-gray-100 p-8 sm:p-10 transform hover:scale-[1.005] hover:shadow-2xl transition-all duration-300" // Reduced hover scale for subtle effect
      >
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
                Zoom: {Math.round(zoomLevel * 100)}% {rotation !== 0 && `Rot: ${rotation}°`} { (position.x !== 0 || position.y !== 0) && `Pos: (${position.x}, ${position.y})`}
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