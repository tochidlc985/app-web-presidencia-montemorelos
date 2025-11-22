import { useState, ChangeEvent, FormEvent, DragEvent, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Send, UploadCloud, X, Phone, Mail, User, FileText, Image, Building, AlertCircle,
  Loader2, Info, CheckCircle, Lightbulb, MapPin, List, Eye,
  FileInput, Sparkles, FolderKanban} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { API_ENDPOINTS } from '../services/apiConfig';

// Interfaz para el tipo de Reporte
interface ReportFormData {
  email: string;
  telefono: string;
  departamento: string[];
  otroDepartamentoEspecifico?: string;
  quienReporta: string;
  descripcion: string;
  prioridad: string;
  tipoProblema: string;
}

// Interfaz para errores de validación
interface ValidationErrors {
  email?: string;
  telefono?: string;
  departamento?: string;
  otroDepartamentoEspecifico?: string;
  quienReporta?: string;
  descripcion?: string;
  prioridad?: string;
  tipoProblema?: string;
  aclaracionRespuestas?: string;
  [key: string]: string | undefined; // Index signature for dynamic error keys
}

// Interfaz para respuestas de aclaración
interface AclaracionRespuestas {
  [key: number]: string;
}

// Lista de departamentos (ejemplo)
const departamentosList = [
  'ADQUISICIONES', 'PASAPORTES', 'CATASTRO', 'DESARROLLO URBANO', 'EJECUTIVA',
  'TURISMO', 'CONTRALORÍA', 'DESARROLLO ECONÓMICO', 'ALCOHOLES', 'SINDICATOS',
  'INGRESOS', 'PATRIMONIO', 'TESORERÍA', 'CABILDO', 'AYUNTAMIENTO',
  'DESARROLLO SOCIAL', 'ESCUELA DE ARTES Y OFICIOS', 'SERVICIOS PÚBLICOS BÁSICOS',
  'TRÁNSITO', 'ECOLOGÍA', 'SEGURIDAD PÚBLICA', 'OBRAS PÚBLICAS', 'DIF',
  'OFICINA DEL ALCALDE', 'DEFENSORÍA', 'GUARDERÍA', 'ACADEMIA DE ARTES',
  'Otro'
];

// Preguntas de aclaración por tipo de problema
const aclaracionPreguntas: Record<string, string[]> = {
  'Hardware - Computadoras': [
    '¿Desde cuándo presenta la falla y qué ha intentado para solucionarlo?',
    '¿El problema ocurre siempre o es intermitente, y con qué frecuencia?',
    '¿Aparece algún mensaje de error en pantalla? ¿Cuál es exactamente el mensaje?',
    '¿Solo le ocurre a usted con este equipo o a más usuarios/computadoras en la oficina?',
    '¿Qué tipo de uso se le da al equipo (ofimática, diseño, programación, etc.)?'
  ],
  'Hardware - Impresoras': [
    '¿Desde cuándo ocurre el problema y en qué impresoras específicas?',
    '¿Es una impresora de red, personal, o multifuncional?',
    '¿Quiénes más la utilizan regularmente y reportan la misma falla?',
    '¿Ha intentado reiniciar la impresora y verificar conexiones (USB/red)?',
    '¿El problema ocurre al imprimir desde cualquier programa o solo con algunos (Ej. Word, Excel, navegador)?'
  ],
  'Hardware - Red/Internet': [
    '¿Desde cuándo no tiene conexión y cómo se manifiesta la falta de servicio?',
    '¿El problema es solo en su equipo, en su área de trabajo, o afecta a todo el departamento?',
    '¿Ha probado reiniciar su computadora, el módem o el router (si tiene acceso)?',
    '¿Puede acceder a sitios web específicos, servicios internos o VPN?',
    '¿Ha habido alguna reubicación de equipo o cambio en la infraestructura de red recientemente?'
  ],
  'Software - Instalación': [
    '¿Qué software exacto necesita instalar (nombre y versión si la conoce)?',
    '¿Cuál es la razón o necesidad de instalar este software?',
    '¿Aparece algún mensaje de error durante el intento de instalación? ¿Puede describirlo o enviar una captura?',
    '¿El software es de licencia libre, empresarial o requiere una licencia específica que ya poseen?',
    '¿Ha intentado alguna vez instalarlo por su cuenta?'
  ],
  'Software - Configuración': [
    '¿Qué configuración específica necesita realizar dentro del software?',
    '¿El software funcionaba correctamente antes de este cambio o requerimiento de configuración?',
    '¿Ha habido algún cambio reciente en su sistema operativo, actualizaciones, o instalaciones de otro software?',
    '¿Este software interactúa con alguna base de datos o sistema externo?'
  ],
  'Software - Licencias': [
    '¿Qué software específico requiere activación o renovación de licencia?',
    '¿La licencia es para un solo usuario/equipo, para múltiples, o es una licencia por volumen?',
    '¿Se cuenta con algún código de producto, comprobante de compra o contacto con el proveedor de software?',
    '¿Ha recibido alguna notificación sobre la expiración de la licencia?',
    '¿Para cuántos usuarios o equipos se necesita esta licencia?'
  ],
  'Sistemas - Base de datos': [
    '¿Qué sistema de base de datos presenta el problema (Ej. MySQL, SQL Server, Oracle)?',
    '¿Desde cuándo se observa la anomalía y qué tipo de problema es (rendimiento, errores, acceso)?',
    '¿Aparece algún mensaje de error o código específico cuando se interactúa con la BD?',
    '¿Este sistema de base de datos es de uso interno o soporta una aplicación web externa?',
    '¿Se han realizado cambios recientes en la base de datos o en la aplicación que la utiliza?'
  ],
  'Sistemas - Aplicaciones web': [
    '¿Qué aplicación web presenta el problema (ej. Intranet, sistema de control, CRM)?',
    '¿Desde cuándo ocurre y cuál es el impacto en su trabajo o el servicio?',
    '¿Aparece algún mensaje de error en la pantalla del navegador? (captura de pantalla es útil)',
    '¿Ha probado acceder desde diferentes navegadores (Chrome, Firefox, Edge) o dispositivos (PC, móvil)?',
    '¿La aplicación web interactúa con otros sistemas o bases de datos?'
  ],
  'Soporte - Capacitación': [
    '¿Sobre qué tema, software o sistema específico requiere la capacitación?',
    '¿Cuántas personas necesitan recibir esta capacitación y en qué departamentos están?',
    '¿Hay alguna fecha o horario preferente para llevar a cabo la capacitación?',
    '¿Cuál es el nivel actual de conocimiento de los participantes sobre el tema?',
    '¿Qué resultados o habilidades esperan adquirir con esta capacitación?'
  ],
  'Soporte - Mantenimiento': [
    '¿Qué equipo(s) requiere(n) mantenimiento (Ej. PC, impresora, proyector, servidor)? Especifique modelo si es posible.',
    '¿Presenta alguna falla específica actualmente o es un mantenimiento preventivo?',
    '¿Cuándo fue el último mantenimiento registrado para este(os) equipo(s)?',
    '¿El equipo está en garantía o ya expiró?',
    '¿Es posible que se requiera reemplazo de piezas o solo limpieza y optimización?'
  ],
  'Otro': [
    'Describa con el máximo detalle posible el problema o solicitud. Incluya: cuándo inició, dónde ocurre (ubicación física y/o virtual), a quiénes afecta, qué ha intentado y cualquier mensaje de error. Si es una solicitud, explique el objetivo.'
  ]
};


const ReportForm = () => {
  const [formData, setFormData] = useState<ReportFormData>({
    email: '',
    telefono: '',
    departamento: [],
    otroDepartamentoEspecifico: '',
    quienReporta: '',
    descripcion: '',
    prioridad: '',
    tipoProblema: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aclaracionRespuestas, setAclaracionRespuestas] = useState<AclaracionRespuestas>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDragActive, setIsDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prioridades = useMemo(() => [
    { value: 'Baja', label: 'Baja', color: 'from-emerald-500 to-emerald-600', hoverBg: 'group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-emerald-600', ringColor: 'emerald-600' },
    { value: 'Media', label: 'Media', color: 'from-amber-500 to-amber-600', hoverBg: 'group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-amber-600', ringColor: 'amber-600' },
    { value: 'Alta', label: 'Alta', color: 'from-orange-500 to-orange-600', hoverBg: 'group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-600', ringColor: 'orange-600' },
    { value: 'Crítica', label: 'Crítica', color: 'from-red-600 to-red-700', hoverBg: 'group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:to-red-700', ringColor: 'red-700' }
  ], []);

  const tiposProblema = useMemo(() => Object.keys(aclaracionPreguntas), []);

  const showCustomToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    toast(message, {
      icon: type === 'success' ? '🎉' : type === 'error' ? '🚫' : '💡',
      style: {
        borderRadius: '10px',
        background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      },
      duration: 3000,
      position: 'top-right',
    });
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.email) newErrors.email = 'El correo electrónico es obligatorio.';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Formato de correo inválido.';

    if (!formData.telefono) newErrors.telefono = 'El teléfono es obligatorio.';
    else if (!/^[0-9]{10}$/.test(formData.telefono)) newErrors.telefono = 'Debe ser un número de 10 dígitos (solo números).';

    if (!formData.quienReporta) newErrors.quienReporta = 'El nombre de quien reporta es obligatorio.';
    else if (formData.quienReporta.trim().length < 3) newErrors.quienReporta = 'El nombre debe tener al menos 3 caracteres.';

    if (!formData.departamento || formData.departamento.length === 0) newErrors.departamento = 'Debes seleccionar al menos un departamento.';
    if (formData.departamento.includes('Otro') && !formData.otroDepartamentoEspecifico?.trim()) {
      newErrors.otroDepartamentoEspecifico = 'Debes especificar el departamento si seleccionas "Otro".';
    }

    if (!formData.tipoProblema) newErrors.tipoProblema = 'Selecciona el tipo de problema.';

    const relevantQuestions = aclaracionPreguntas[formData.tipoProblema];
    if (relevantQuestions && relevantQuestions.length > 0) {
      const allAclaracionesAnswered = relevantQuestions.every((_, idx) => {
        const answer = aclaracionRespuestas[idx];
        return answer && answer.trim() !== '';
      });
      if (!allAclaracionesAnswered) {
        newErrors.aclaracionRespuestas = 'Debes responder todas las preguntas de aclaración.';
      }
    }

    if (!formData.prioridad) newErrors.prioridad = 'La prioridad es obligatoria.';

    if (!formData.descripcion) newErrors.descripcion = 'La descripción es obligatoria.';
    else if (formData.descripcion.length < 20) newErrors.descripcion = 'La descripción debe tener al menos 20 caracteres.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, aclaracionRespuestas]); // Añadidas dependencias al useCallback

  // Función para calcular el progreso del formulario
  const calculateProgress = useCallback(() => {
    let completedFields = 0;
    const totalFields = 7; // Total de campos obligatorios

    // Verificar cada campo obligatorio
    if (formData.email && /^\S+@\S+\.\S+$/.test(formData.email)) completedFields++;
    if (formData.telefono && /^[0-9]{10}$/.test(formData.telefono)) completedFields++;
    if (formData.quienReporta && formData.quienReporta.trim().length >= 3) completedFields++;
    
    // Departamentos
    if (formData.departamento && formData.departamento.length > 0) {
      if (formData.departamento.includes('Otro') && formData.otroDepartamentoEspecifico?.trim()) {
        completedFields++;
      } else if (!formData.departamento.includes('Otro')) {
        completedFields++;
      }
    }
    
    // Tipo de problema
    if (formData.tipoProblema) {
      completedFields++;
      
      // Verificar preguntas de aclaración
      const relevantQuestions = aclaracionPreguntas[formData.tipoProblema];
      if (relevantQuestions && relevantQuestions.length > 0) {
        const totalQuestions = relevantQuestions.length;
        let answeredQuestions = 0;
        
        relevantQuestions.forEach((_, idx) => {
          if (aclaracionRespuestas[idx] && aclaracionRespuestas[idx].trim() !== '') {
            answeredQuestions++;
          }
        });
        
        // Añadir proporción de preguntas respondidas
        completedFields += answeredQuestions / totalQuestions;
      }
    }
    
    if (formData.prioridad) completedFields++;
    if (formData.descripcion && formData.descripcion.length >= 20) completedFields++;

    // Calcular porcentaje (máximo 100%)
    const newProgress = Math.min(100, Math.round((completedFields / totalFields) * 100));
    setProgress(newProgress);
    return newProgress;
  }, [formData, aclaracionRespuestas]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      const { checked } = target;

      if (name === 'departamento') {
        setFormData(prev => {
          const newDepartamentos = checked
            ? [...prev.departamento, value]
            : prev.departamento.filter(dept => dept !== value);

          if (!checked && value === 'Otro') {
            return { ...prev, departamento: newDepartamentos, otroDepartamentoEspecifico: '' };
          }
          return { ...prev, departamento: newDepartamentos };
        });
        setErrors(prev => ({ ...prev, departamento: undefined }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      if (name === 'tipoProblema') {
        setAclaracionRespuestas({});
      }
    }
    setErrors(prev => ({ ...prev, [name]: undefined, aclaracionRespuestas: undefined }));
    // Actualizar progreso después de cada cambio
    setTimeout(() => calculateProgress(), 0);
  }, [calculateProgress]);

  const handleAclaracionChange = useCallback((index: number, value: string) => {
    setAclaracionRespuestas(prev => ({
      ...prev,
      [index]: value
    }));
    setErrors(prev => ({ ...prev, aclaracionRespuestas: undefined }));
    // Actualizar progreso después de cada cambio
    setTimeout(() => calculateProgress(), 0);
  }, [calculateProgress]);

  const handleDropzoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps - processFiles is stable as it uses internal state/props

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    processFiles(files);
    e.target.value = '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps - processFiles is stable

  const MAX_FILES = 5;
  const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
  const allowedTypes = useMemo(() => [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf'
  ], []);

  const processFiles = useCallback((files: File[]) => {
    let filesToProcess = files;
    const messages: string[] = [];

    filesToProcess = filesToProcess.filter(newFile =>
      !uploadedFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
    );

    const newValidFiles: File[] = [];

    for (const file of filesToProcess) {
      let isValid = true;

      if (!allowedTypes.includes(file.type)) {
        isValid = false;
        messages.push(`Tipo de archivo no permitido para "${file.name}": ${file.type}.`);
      }
      if (file.size > MAX_SIZE) {
        isValid = false;
        messages.push(`Archivo "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) excede el límite (Máx ${MAX_SIZE / (1024 * 1024)}MB).`);
      }

      if (isValid) {
        newValidFiles.push(file);
      }
    }

    const currentTotalFiles = uploadedFiles.length;
    if (currentTotalFiles + newValidFiles.length > MAX_FILES) {
      const excessFiles = (currentTotalFiles + newValidFiles.length) - MAX_FILES;
      // Remover los archivos extra de newValidFiles para ajustarse al límite
      for (let i = 0; i < excessFiles; i++) {
        const removedFile = newValidFiles.pop();
        if (removedFile) messages.push(`Se ha omitido el archivo "${removedFile.name}" para respetar el límite de ${MAX_FILES} archivos.`);
      }
    }

    if (newValidFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newValidFiles]);
      showCustomToast(`${newValidFiles.length} archivo(s) agregado(s).`, 'success');
    }

    if (messages.length > 0) {
      messages.forEach(msg => toast.error(msg, { duration: 5000 }));
    }
  }, [uploadedFiles, allowedTypes]);


  const removeFile = useCallback((indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    showCustomToast('Archivo removido.', 'info');
  }, []);

  const getFileIcon = useCallback((fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6 text-indigo-500" />;
    if (fileType.startsWith('video/')) return <Eye className="h-6 w-6 text-red-500" />;
    if (fileType === 'application/pdf') return <FileText className="h-6 w-6 text-purple-500" />;
    return <FileInput className="h-6 w-6 text-gray-500" />;
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario para continuar.', { duration: 4000 });
      const firstErrorField = document.querySelector('.border-red-500') as HTMLElement;
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      let departmentsFinal = [...formData.departamento];
      if (departmentsFinal.includes('Otro') && formData.otroDepartamentoEspecifico) {
        departmentsFinal = departmentsFinal.filter(dept => dept !== 'Otro');
        departmentsFinal.push(formData.otroDepartamentoEspecifico.trim());
      }

      const relevantQuestions = aclaracionPreguntas[formData.tipoProblema] || [];
      const finalAclaracionRespuestas: Record<string, string> = {};

      relevantQuestions.forEach((question, index) => {
        if (aclaracionRespuestas[index]) {
          finalAclaracionRespuestas[question] = aclaracionRespuestas[index];
        }
      });

      const reportDataToSend = {
        email: formData.email,
        telefono: formData.telefono,
        departamento: departmentsFinal,
        quienReporta: formData.quienReporta,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        tipoProblema: formData.tipoProblema,
        timestamp: new Date().toISOString(),
        status: 'Pendiente',
        aclaracionRespuestas: finalAclaracionRespuestas,
      };

      // Crear FormData para enviar los archivos y los datos del reporte
      const requestFormData = new FormData();

      // Agregar los datos del reporte como JSON string
      requestFormData.append('data', JSON.stringify(reportDataToSend));

      // Agregar los archivos
      uploadedFiles.forEach(file => {
        requestFormData.append('imagenes', file);
      });

      try {
        // Enviar los datos al servidor
        const response = await api.post(API_ENDPOINTS.REPORTES, requestFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.status === 201) {
          toast.success('🎉 ¡Reporte enviado! Nos pondremos en contacto contigo pronto.', { duration: 5000 });
        } else {
          throw new Error('Error al enviar el reporte');
        }
      } catch (error: any) {
        console.error('Error al enviar el reporte:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error al enviar el reporte';
        throw new Error(errorMessage);
      }

      setFormData({
        email: '',
        telefono: '',
        departamento: [],
        otroDepartamentoEspecifico: '',
        quienReporta: '',
        descripcion: '',
        prioridad: '',
        tipoProblema: ''
      });
      setUploadedFiles([]);
      setAclaracionRespuestas({});
      setErrors({});

    } catch (error: any) {
      console.error("ERROR AL ENVIAR REPORTE:", error);
      toast.error(`🚫 Error al enviar el reporte: ${error.message || 'Por favor, intenta de nuevo.'}`, { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, uploadedFiles, aclaracionRespuestas, validateForm]); // Dependencias al useCallback

  const showOtroInput = formData.departamento.includes('Otro');

  // Framer Motion Variants corregidos
  const fadeInGrowVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 70,
        damping: 10,
        when: "beforeChildren" as const,
        staggerChildren: 0.07
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const, // Corrected: use `as const` for string literal
        when: "beforeChildren" as const,
        staggerChildren: 0.05
      }
    }
  };

  const itemChildVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const // Corrected: use `as const`
      }
    }
  };

    // Código para generar el SVG de la flecha personalizada para los select
    const generateSvgArrow = useCallback((color: string) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-chevron-down'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E`, []);
    const defaultArrowColor = useMemo(() => encodeURIComponent('#6B7280'), []); // Tailwind's gray-500, hex code URL-encoded
    const focusArrowColor = useMemo(() => encodeURIComponent('#3B82F6'), []); // Tailwind's blue-500 for focus effect


  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInGrowVariants}
      className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 min-h-screen grid place-items-center py-16 px-4 sm:px-6 lg:px-8 font-inter antialiased relative overflow-hidden"
    >
      {/* Background blobs for an ethereal effect */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
        animate={{ scale: 1.2, opacity: [0.1, 0.3, 0.1], x: ['-50%', '-60%', '-50%'], y: ['-50%', '-40%', '-50%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" as const }}
        className="absolute top-[20%] left-[20%] w-96 h-96 rounded-full bg-blue-300 opacity-20 filter blur-3xl z-0"
      />
      <motion.div
        initial={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
        animate={{ scale: 1.1, opacity: [0.15, 0.25, 0.15], x: ['-50%', '-40%', '-50%'], y: ['-50%', '-60%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" as const, delay: 8 }}
        className="absolute bottom-[25%] right-[25%] w-[400px] h-[400px] rounded-full bg-purple-300 opacity-20 filter blur-3xl z-0"
      />
       <motion.div
        initial={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
        animate={{ scale: 1.3, opacity: [0.1, 0.2, 0.1], x: ['-50%', '-55%', '-50%'], y: ['-50%', '-55%', '-50%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" as const, delay: 16 }}
        className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-green-300 opacity-20 filter blur-3xl transform -translate-x-1/2 -translate-y-1/2 z-0"
      />

      {/* Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 12L0 6V0l6 6v6zM12 6L6 0h6v6z' fill='%239CA3AF' fill-opacity='0.1'/%3E%3C/svg%3E")` }}></div>
      
      {/* Partículas flotantes */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white z-0"
          style={{
            width: `${Math.random() * 10 + 2}px`,
            height: `${Math.random() * 10 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -Math.random() * 100 - 50],
            opacity: [0, Math.random() * 0.5 + 0.1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
        />
      ))}


      {/* Form Card */}
      <motion.div
        className="w-full max-w-4xl bg-white/95 backdrop-blur-xl p-8 sm:p-12 rounded-4xl border border-gray-100 shadow-4xl transform transition-all duration-300 relative overflow-hidden group hover:shadow-2xl hover:border-blue-200"
      >
        {/* Subtle decorative corners for hover effect */}
        <span className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-br-full opacity-30 transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out z-0"></span>
        <span className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-purple-300 to-pink-300 rounded-tl-full opacity-30 transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out delay-100 z-0"></span>
        
        {/* Línea decorativa animada */}
        <motion.div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Header Section (consistent with Home & Login) */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 rounded-4xl mb-12 shadow-xl shadow-indigo-900/40 relative overflow-hidden border border-white/20">
          {/* Efecto de brillo animado en el fondo */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />
          
          <div className="text-center relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" as const, stiffness: 260, damping: 20, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="h-24 w-24 sm:h-28 sm:w-28 bg-white rounded-full p-2 shadow-2xl border-4 border-yellow-300 flex items-center justify-center overflow-hidden relative">
                {/* Efecto de pulso en el logo */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-4 border-yellow-300"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <img
                  src="/Montemorelos.jpg"
                  alt="Logo Montemorelos"
                  className="h-full w-full object-contain rounded-full transform hover:rotate-6 hover:scale-110 transition-transform duration-300 relative z-10"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "https://via.placeholder.com/96x96?text=Logo";
                  }}
                />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-white"
            >
              Sistema de Reportes
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-lg sm:text-xl font-semibold opacity-90 text-blue-100"
            >
              Departamento de Sistemas
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-blue-200 opacity-80 text-base"
            >Presidencia Municipal de Montemorelos</motion.p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '150px' }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="h-2.5 mx-auto mt-6 rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 shadow-lg"
            ></motion.div>
          </div>
        </div>

        {/* Form sections */}
        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
          {/* Indicador de progreso */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso del formulario</span>
              <span className="text-sm font-medium text-blue-600">{progress}% completado</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          {/* Seccion: Contacto */}
          <motion.div variants={sectionVariants}>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 border-b pb-4 mb-8 flex items-center gap-3">
              <Mail className="h-7 w-7 text-blue-600" />
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Campo de Email */}
              <motion.div variants={itemChildVariants}>
                <label htmlFor="email-input" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-blue-600" /> CORREO ELECTRÓNICO <span className="text-red-500 ml-1 text-base">*</span>
                </label>
                <div className="relative group">
                  <input
                    id="email-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 transition-all duration-300 hover:border-blue-400 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium ${
                      errors.email ? 'border-red-500 animate-shake' : 'border-gray-300'
                    }`}
                    placeholder="ejemplo@montemorelos.gob.mx"
                    aria-required="true"
                    autoComplete="email"
                  />
                  <Mail className={`absolute inset-y-0 left-3 flex items-center text-blue-400 pointer-events-none transition-colors group-focus-within:text-blue-600 ${errors.email ? 'text-red-500' : ''}`} />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 flex items-center text-sm text-red-600 font-medium"
                    >
                      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Campo de Teléfono */}
              <motion.div variants={itemChildVariants}>
                <label htmlFor="telefono-input" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-green-600" /> TELÉFONO <span className="text-red-500 ml-1 text-base">*</span>
                </label>
                <div className="relative group">
                  <input
                    id="telefono-input"
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-green-500 focus:ring-offset-2 focus:border-green-500 transition-all duration-300 hover:border-green-400 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium ${
                      errors.telefono ? 'border-red-500 animate-shake' : 'border-gray-300'
                    }`}
                    placeholder="Ej. 8261234567 (10 dígitos)"
                    maxLength={10}
                    aria-required="true"
                    autoComplete="tel"
                  />
                  <Phone className={`absolute inset-y-0 left-3 flex items-center text-green-400 pointer-events-none transition-colors group-focus-within:text-green-600 ${errors.telefono ? 'text-red-500' : ''}`} />
                </div>
                <AnimatePresence>
                  {errors.telefono && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 flex items-center text-sm text-red-600 font-medium"
                    >
                      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {errors.telefono}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Campo Quién Reporta */}
            <motion.div variants={itemChildVariants} className="mt-8">
              <label htmlFor="quienReporta-input" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center">
                <User className="h-5 w-5 mr-2 text-purple-600" /> ¿QUIÉN REPORTA? <span className="text-red-500 ml-1 text-base">*</span>
              </label>
              <div className="relative group">
                <input
                  id="quienReporta-input"
                  type="text"
                  name="quienReporta"
                  value={formData.quienReporta}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500 transition-all duration-300 hover:border-purple-400 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium ${
                    errors.quienReporta ? 'border-red-500 animate-shake' : 'border-gray-300'
                  }`}
                  placeholder="Nombre completo del reportante"
                  aria-required="true"
                  autoComplete="name"
                />
                <User className={`absolute inset-y-0 left-3 flex items-center text-purple-400 pointer-events-none transition-colors group-focus-within:text-purple-600 ${errors.quienReporta ? 'text-red-500' : ''}`} />
              </div>
              <AnimatePresence>
                {errors.quienReporta && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 flex items-center text-sm text-red-600 font-medium"
                  >
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {errors.quienReporta}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Sección: Problema */}
          <motion.div variants={sectionVariants}>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 border-b pb-4 mb-8 flex items-center gap-3">
              <Lightbulb className="h-7 w-7 text-orange-600" />
              Detalles del Problema
            </h3>

            {/* Departamentos Checkboxes */}
            <motion.div variants={itemChildVariants}>
              <label id="department-label" className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-indigo-600" /> DEPARTAMENTO(S) AFECTADO(S) <span className="text-red-500 ml-1 text-base">*</span>
              </label>
              <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-5 border-2 rounded-xl bg-indigo-50/50 shadow-inner max-h-80 overflow-y-auto custom-scrollbar transition-all duration-300 ${
                errors.departamento ? 'border-red-500 ring-1 ring-red-500 animate-shake' : 'border-indigo-200'
              }`} role="group" aria-labelledby="department-label">
                {departamentosList.map((dept) => (
                  <label key={dept} className="relative flex items-center space-x-3 bg-white/70 hover:bg-white p-3.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-500 has-[:checked]:ring-1 has-[:checked]:ring-blue-500 border border-transparent">
                    <input
                      type="checkbox"
                      name="departamento"
                      value={dept}
                      checked={formData.departamento.includes(dept)}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded peer shrink-0 appearance-none bg-white
                                  checked:bg-indigo-600 checked:border-transparent checked:ring-0 checked:ring-offset-0
                                  hover:checked:bg-indigo-700
                                  transition-all duration-200"
                    />
                     <span className="absolute left-3 transform translate-y-[1px] opacity-0 peer-checked:opacity-100 transition-opacity duration-200">
                        <CheckCircle className="h-5 w-5 text-white fill-indigo-600" />
                    </span>
                    <span className="text-sm font-semibold text-gray-800 select-none ml-2">{dept}</span>
                  </label>
                ))}
              </div>

              <AnimatePresence>
                {showOtroInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" as const }}
                    className="mt-6 relative"
                  >
                    <label htmlFor="otroDepartamento-input" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-yellow-600 inline-block" />
                      Especifica el "Otro" Departamento: <span className="text-red-500 ml-1 text-base">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        id="otroDepartamento-input"
                        type="text"
                        name="otroDepartamentoEspecifico"
                        value={formData.otroDepartamentoEspecifico || ''}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-yellow-500 focus:ring-offset-2 focus:border-yellow-500 transition-all duration-300 hover:border-yellow-400 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium ${
                          errors.otroDepartamentoEspecifico ? 'border-red-500 animate-shake' : 'border-gray-300'
                        }`}
                        placeholder="Ej. Administración de Proyectos"
                        aria-required={showOtroInput ? "true" : "false"}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.otroDepartamentoEspecifico && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-2 flex items-center text-sm text-red-600 font-medium"
                        >
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {errors.otroDepartamentoEspecifico}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {errors.departamento && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 flex items-center text-sm text-red-600 font-medium"
                  >
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {errors.departamento}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Tipo de problema y aclaraciones */}
            <motion.div variants={itemChildVariants} className="mt-8">
              <label htmlFor="tipoProblema-select" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-orange-600" /> TIPO DE PROBLEMA <span className="text-red-500 ml-1 text-base">*</span>
              </label>
              <div className="relative group">
                <select
                  id="tipoProblema-select"
                  name="tipoProblema"
                  value={formData.tipoProblema}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-orange-500 focus:ring-offset-2 focus:border-orange-500 transition-all duration-300 hover:border-orange-400 bg-gray-50 text-gray-900 appearance-none font-medium cursor-pointer
                  bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.2rem]
                  group-hover:bg-[length:1.25rem_1.25rem] group-hover:bg-[right_0.7rem_center] group-focus-within:bg-[length:1.25rem_1.25rem] group-focus-within:bg-[right_0.7rem_center] ${
                    errors.tipoProblema ? 'border-red-500 animate-shake' : 'border-gray-300'
                  }`}
                  aria-required="true"
                  style={{
                    backgroundImage: `url("${generateSvgArrow(defaultArrowColor)}")`,
                  }}
                  onFocus={(e) => (e.target.style.backgroundImage = `url("${generateSvgArrow(focusArrowColor)}")`)}
                  onBlur={(e) => (e.target.style.backgroundImage = `url("${generateSvgArrow(defaultArrowColor)}")`)}
                >
                  <option value="" disabled>-- Selecciona el tipo de problema --</option>
                  {tiposProblema.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                <List className={`absolute inset-y-0 left-3 flex items-center text-orange-400 pointer-events-none transition-colors group-focus-within:text-orange-600 ${errors.tipoProblema ? 'text-red-500' : ''}`} />
              </div>
              <AnimatePresence>
                {errors.tipoProblema && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 flex items-center text-sm text-red-600 font-medium"
                  >
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {errors.tipoProblema}
                  </motion.p>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {formData.tipoProblema && aclaracionPreguntas[formData.tipoProblema] && aclaracionPreguntas[formData.tipoProblema].length > 0 && (
                  <motion.div
                    key={formData.tipoProblema}
                    initial={{ opacity: 0, height: 0, scaleY: 0.8 }}
                    animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
                    exit={{ opacity: 0, height: 0, scaleY: 0.8 }}
                    transition={{ duration: 0.4, ease: "easeOut" as const }}
                    className="mt-8 bg-blue-50/70 border-l-4 border-blue-400 p-6 rounded-xl shadow-lg origin-top"
                  >
                    <p className="font-semibold text-blue-800 mb-5 flex items-center gap-3">
                      <Sparkles className="h-6 w-6 text-blue-600 fill-blue-600/20" />
                      ¡Ayúdanos a comprender mejor! <span className="text-red-500 ml-1 text-base">*</span>
                    </p>
                    <ul className="list-none space-y-5">
                      {aclaracionPreguntas[formData.tipoProblema].map((pregunta, idx) => (
                        <li key={idx}>
                          <label htmlFor={`aclaracion-${idx}`} className="text-gray-900 text-base font-semibold block mb-2">
                            <span className="text-blue-600 text-lg mr-2">•</span> {pregunta}
                          </label>
                          <input
                            id={`aclaracion-${idx}`}
                            type="text"
                            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-3 focus:ring-blue-400 focus:border-blue-400 transition text-gray-900 bg-white/80 shadow-sm ${
                              errors.aclaracionRespuestas && (!aclaracionRespuestas[idx] || aclaracionRespuestas[idx].trim() === '') ? 'border-red-500 animate-shake' : 'border-gray-300'
                            }`}
                            placeholder="Tu respuesta detallada..."
                            value={aclaracionRespuestas[idx] || ''}
                            onChange={(e) => handleAclaracionChange(idx, e.target.value)}
                            aria-required="true"
                          />
                        </li>
                      ))}
                    </ul>
                    <AnimatePresence>
                      {errors.aclaracionRespuestas && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-4 flex items-center text-sm text-red-600 font-medium"
                        >
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {errors.aclaracionRespuestas}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Sección: Prioridad y Descripción */}
          <motion.div variants={sectionVariants}>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 border-b pb-4 mb-8 flex items-center gap-3">
              <Info className="h-7 w-7 text-gray-600" />
              Severidad y Descripción Detallada
            </h3>

            {/* Selector de Prioridad */}
            <motion.div variants={itemChildVariants}>
              <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" /> PRIORIDAD <span className="text-red-500 ml-1 text-base">*</span>
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {prioridades.map((prioridad) => (
                  <label key={prioridad.value} className="relative group cursor-pointer block">
                    <input
                      type="radio"
                      name="prioridad"
                      value={prioridad.value}
                      checked={formData.prioridad === prioridad.value}
                      onChange={handleInputChange}
                      className="sr-only peer"
                      aria-required="true"
                      aria-label={`Prioridad ${prioridad.label}`}
                    />
                    <div className={`p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-lg text-center
                      ${prioridad.hoverBg} group-hover:text-white
                      ${
                        formData.prioridad === prioridad.value
                          ? `bg-gradient-to-r ${prioridad.color} text-white border-transparent shadow-xl ring-2 ring-white ring-offset-2 ring-offset-${prioridad.ringColor}`
                          : `${errors.prioridad ? 'border-red-500' : 'border-gray-300'} bg-white text-gray-800 hover:border-gray-400`
                      }
                      `}>
                      <span className="font-extrabold text-lg sm:text-xl">{prioridad.label}</span>
                      {formData.prioridad === prioridad.value && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" as const, stiffness: 400, damping: 20 }}
                          className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 text-purple-600 shadow-md flex items-center justify-center"
                        >
                          <CheckCircle className="h-6 w-6" />
                        </motion.span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <AnimatePresence>
                {errors.prioridad && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 flex items-center text-sm text-red-600 font-medium"
                  >
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {errors.prioridad}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Descripción del Problema */}
            <motion.div variants={itemChildVariants} className="mt-8">
              <label htmlFor="descripcion-textarea" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" /> DESCRIPCIÓN DETALLADA DEL PROBLEMA <span className="text-red-500 ml-1 text-base">*</span>
              </label>
              <div className="relative group">
                  <textarea
                  id="descripcion-textarea"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500 transition-all duration-300 hover:border-blue-400 resize-y min-h-[160px] max-h-[300px] bg-gray-50 text-gray-900 placeholder-gray-400 font-medium ${
                    errors.descripcion ? 'border-red-500 animate-shake' : 'border-gray-300'
                  }`}
                  placeholder="Describe detalladamente el problema: cuándo y dónde ocurrió (ej. sala 205, equipo 1), si hay mensajes de error (incluye texto exacto), a quiénes afecta, qué has intentado para solucionarlo, y cualquier otra información relevante para una resolución rápida y eficaz. (Mínimo 20 caracteres)"
                  aria-required="true"
                  />
                  {formData.descripcion.length > 0 && (
                      <p className="absolute bottom-3 right-4 text-xs text-gray-500">
                          {formData.descripcion.length} / 20 caracteres mínimos
                      </p>
                  )}
              </div>
              <AnimatePresence>
                {errors.descripcion && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 flex items-center text-sm text-red-600 font-medium"
                  >
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {errors.descripcion}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Sección de Adjuntar Archivos */}
          <motion.div variants={sectionVariants}>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 border-b pb-4 mb-8 flex items-center gap-3">
              <UploadCloud className="h-7 w-7 text-pink-600" />
              Adjuntar Archivos (Opcional)
            </h3>

            <motion.div variants={itemChildVariants}>
              <label htmlFor="file-input" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center cursor-pointer">
                <FileInput className="h-5 w-5 mr-2 text-pink-600" /> IMÁGENES, VIDEOS O DOCUMENTOS (Arrastra y Suelta)
              </label>
              <div
                onClick={handleDropzoneClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-4 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 group ${
                  isDragActive
                    ? 'border-pink-500 bg-pink-50 animate-pulse-light'
                    : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/mp4,video/webm,application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-input"
                  ref={fileInputRef}
                />
                <div className="flex flex-col items-center justify-center">
                  <UploadCloud className="mx-auto h-16 w-16 text-gray-400 mb-4 transition-colors group-hover:text-pink-600 motion-safe:group-hover:animate-bounce" />
                  <p className="text-gray-700 font-semibold text-xl">
                    {isDragActive
                      ? '¡Suelta tus archivos aquí!'
                      : 'Arrastra y suelta aquí, o haz clic para seleccionar'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos permitidos: JPG, PNG, GIF, WEBP, MP4, WebM, PDF.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Máximo {MAX_FILES} archivos (hasta {MAX_SIZE / (1024 * 1024)}MB cada uno).
                  </p>
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" as const }}
                  className="mt-6 space-y-4 max-h-60 overflow-y-auto custom-scrollbar p-1"
                >
                  <p className="text-sm text-gray-700 font-bold mb-2 flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-blue-500" /> Archivos Adjuntos ({uploadedFiles.length}):
                  </p>
                  {uploadedFiles.map((file, index) => (
                    <motion.div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                      className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 shadow-sm transition-all duration-200 transform hover:scale-[1.005] cursor-default"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {getFileIcon(file.type)}
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-base text-gray-800 font-medium block truncate" title={file.name}>{file.name}</span>
                          <span className="text-sm text-gray-600 block">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFile(index)}
                        className="mt-3 sm:mt-0 p-2.5 bg-red-100 rounded-full text-red-600 hover:bg-red-200 hover:text-red-700 transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-300 flex-shrink-0"
                        title={`Eliminar archivo ${file.name}`}
                        aria-label={`Eliminar archivo ${file.name}`}
                      >
                        <X className="h-5 w-5 fill-red-400" />
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Botón de Enviar Reporte */}
          <motion.div variants={itemChildVariants} className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full relative overflow-hidden flex items-center justify-center space-x-3 px-8 py-5 rounded-2xl font-bold text-2xl transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-70 group
                ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:brightness-110 motion-safe:group-hover:animate-gradient-pulse'
                }`}
              aria-live="polite"
              aria-busy={isSubmitting}
            >
              {/* Efecto de onda en el botón */}
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {isSubmitting ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-white relative z-10" />
                  <span className="relative z-10">ENVIANDO REPORTE...</span>
                </>
              ) : (
                <>
                  <Send className="h-8 w-8 text-white transition-transform group-hover:translate-x-1 group-hover:scale-110 relative z-10" />
                  <span className="relative z-10">ENVIAR REPORTE</span>
                </>
              )}
            </button>
            
            {/* Texto de ayuda */}
            <p className="text-center text-gray-600 mt-4 text-sm">
              Al enviar este reporte, aceptas nuestros términos y condiciones de servicio.
            </p>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ReportForm;