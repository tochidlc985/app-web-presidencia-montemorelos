import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  BarChart3,
  QrCode,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Loader2,
  Info,
  X,
  Eye,
  // ChevronDown, // <-- ELIMINADO/COMENTADO: Ya no se usa directamente. La flecha es un SVG en backgroundImage.
} from 'lucide-react';
import { API_ENDPOINTS } from '../services/apiConfig';
import api from '../api';
// import type { AxiosRequestConfig } from 'axios';
// import { useRealtime } from '../services/realtimeService'; // <-- COMENTADO: No se usa actualmente.

// Interfaz para el tipo de Reporte original desde la API
interface Reporte {
  _id: string;
  departamento: string[] | string; // Puede ser un array o un string
  descripcion: string;
  prioridad: string;
  status: string;
  timestamp: string;
  quienReporta?: string;
  tipoProblema?: string;
}

// Interfaz para la actividad reciente (para mapear Reporte a un formato más manejable en la UI)
interface ActividadReciente {
  id: string;
  dept: string; // Departamento o departamentos unidos por coma
  priority: string;
  issue: string; // Descripcion breve (o titulo si existe)
  time: string;
  status: string;
  quienReporta?: string;
  tipoProblema?: string;
  colorClass: string;
  descripcion: string; // Descripción completa para el modal de detalle
}

// Definiciones de tooltips para KPIs
const KPI_TOOLTIPS: Record<string, string> = {
  'Reportes del Mes': 'Cantidad total de reportes registrados en el mes actual.',
  'Reportes Pendientes': 'Número de reportes que aún no han sido resueltos y están en espera.',
  'Reportes Críticos': 'Incidentes marcados con la máxima urgencia que requieren atención inmediata y pueden interrumpir operaciones.',
  'Departamentos Activos': 'Cantidad de departamentos que han reportado problemas en el sistema durante el mes actual.'
};

// Helper function to determine activity item color class
const getActivityColorClass = (status: string): string => {
  switch (status) {
    case 'Pendiente':
      return 'bg-red-500 text-white';
    case 'En Proceso':
      return 'bg-amber-500 text-white';
    case 'Resuelto':
      return 'bg-emerald-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Array<{
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }>>([
    { label: 'Reportes del Mes', value: '...', icon: FileText, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Reportes Pendientes', value: '...', icon: Clock, color: 'from-amber-500 to-orange-600', bgColor: 'bg-orange-50' },
    { label: 'Reportes Críticos', value: '...', icon: AlertTriangle, color: 'from-red-600 to-red-700', bgColor: 'bg-red-50' },
    { label: 'Departamentos Activos', value: '...', icon: Users, color: 'from-emerald-500 to-green-600', bgColor: 'bg-green-50' },
  ]);
  const [recentActivity, setRecentActivity] = useState<ActividadReciente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalReportes, setTotalReportes] = useState<number>(0);
  const [resueltos, setResueltos] = useState<number>(0);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const [detalleReporte, setDetalleReporte] = useState<ActividadReciente | null>(null);

  const quickActions = useMemo(() => [
    {
      title: 'Crear Nuevo Reporte',
      description: 'Reporta un problema o solicitud de forma ágil y sencilla en pocos pasos.',
      icon: FileText,
      link: '/reporte',
      color: 'from-indigo-600 to-blue-700',
      hoverColor: 'group-hover:from-indigo-700 group-hover:to-blue-800',
      textColor: 'text-indigo-900',
    },
    {
      title: 'Ver Dashboard',
      description: 'Accede a métricas detalladas y gráficos de rendimiento para un seguimiento óptimo.',
      icon: BarChart3,
      link: '/dashboard',
      color: 'from-emerald-600 to-green-700',
      hoverColor: 'group-hover:from-emerald-700 group-hover:to-green-800',
      textColor: 'text-emerald-900',
    },
    {
      title: 'Generar Códigos QR',
      description: 'Crea códigos QR personalizados para un acceso rápido a formularios específicos.',
      icon: QrCode,
      link: '/qr',
      color: 'from-rose-500 to-red-600',
      hoverColor: 'group-hover:from-rose-600 group-hover:to-red-700',
      textColor: 'text-red-900',
    },
  ], []);

  // Function to handle API errors
  const handleApiError = useCallback((err: any) => {
    let errorMessage: string;
    console.error('Error detallado al cargar datos:', err);

    if (err.name === 'AbortError') {
      errorMessage = 'La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo.';
    } else if (err.response) {
      if (err.response.status === 500) {
        errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
      } else if (err.response.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión de nuevo.';
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
      } else if (err.response.status === 404) {
        errorMessage = 'Recurso no encontrado. Verifica la configuración.';
      } else {
        errorMessage = `Error del servidor: ${err.response.status}`;
      }
    } else if (err.request) {
      errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
    } else if (err.message === 'Network Error') {
      errorMessage = 'Error de red. Por favor, verifica tu conexión a internet.';
    } else {
      errorMessage = err.message || 'Error desconocido al cargar los datos';
    }

    setError(errorMessage);
    setStats([
      { label: 'Reportes del Mes', value: 'N/A', icon: FileText, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Reportes Pendientes', value: 'N/A', icon: Clock, color: 'from-amber-500 to-orange-600', bgColor: 'bg-orange-50' },
      { label: 'Reportes Críticos', value: 'N/A', icon: AlertTriangle, color: 'from-red-600 to-red-700', bgColor: 'bg-red-50' },
      { label: 'Departamentos Activos', value: 'N/A', icon: Users, color: 'from-emerald-500 to-green-600', bgColor: 'bg-green-50' },
    ]);
    setRecentActivity([]);
    setTotalReportes(0);
    setResueltos(0);
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // El interceptor de `api.ts` maneja el token automáticamente.
        if (!localStorage.getItem('token')) {
          throw new Error("No hay token de autenticación. Por favor, inicia sesión.");
        }

        try {
          // `api` ya tiene el token gracias al interceptor.
          const res = await api.get(API_ENDPOINTS.REPORTES, {
            timeout: 10000 // 10 seconds timeout
          });
          
          if (!res.data) {
            throw new Error('No se recibieron datos del servidor');
          }

          const responseData = res.data as any;
          const reportes: Reporte[] = Array.isArray(responseData) ? responseData : (responseData?.reportes || responseData?.data || []);

          if (!Array.isArray(reportes)) {
            console.error('API response structure:', responseData); // Log for debugging
            throw new Error('Formato de datos de reportes incorrecto o estructura inesperada.');
          }

          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          const reportesMes = reportes.filter(r => {
            const fecha = new Date(r.timestamp);
            return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
          });
          const pendientes = reportes.filter(r => r.status === 'Pendiente').length;
          const criticos = reportes.filter(r => r.prioridad === 'Crítica').length;
          const resueltosCount = reportes.filter(r => r.status === 'Resuelto').length;
          setTotalReportes(reportes.length);
          setResueltos(resueltosCount);

          const departamentosSet = new Set<string>();
          reportesMes.forEach(r => {
            if (Array.isArray(r.departamento)) {
              r.departamento.forEach((d: string) => departamentosSet.add(d));
            } else if (typeof r.departamento === 'string') {
              departamentosSet.add(r.departamento);
            }
          });

          setStats([
            { label: 'Reportes del Mes', value: reportesMes.length, icon: FileText, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
            { label: 'Reportes Pendientes', value: pendientes, icon: Clock, color: 'from-amber-500 to-orange-600', bgColor: 'bg-orange-50' },
            { label: 'Reportes Críticos', value: criticos, icon: AlertTriangle, color: criticos > 0 ? 'from-red-600 to-red-700' : 'from-red-500 to-red-600', bgColor: 'bg-red-50' },
            { label: 'Departamentos Activos', value: departamentosSet.size, icon: Users, color: 'from-emerald-500 to-green-600', bgColor: 'bg-green-50' },
          ]);

          const sortedReports = [...reportes].sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return dateB - dateA;
          });

          setRecentActivity(
            sortedReports
              .slice(0, 15) // Mostrar solo los 15 más recientes
              .map((r) => ({
                id: r._id,
                dept: Array.isArray(r.departamento) ? r.departamento.join(', ') : (r.departamento || 'N/A'),
                priority: r.prioridad,
                issue: r.descripcion.length > 80 ? r.descripcion.substring(0, 80) + '...' : r.descripcion,
                time: r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A',
                status: r.status,
                quienReporta: r.quienReporta || 'N/A',
                tipoProblema: r.tipoProblema || 'N/A',
                descripcion: r.descripcion,
                colorClass: getActivityColorClass(r.status),
              }))
          );
        } catch (err) {
          handleApiError(err);
        } finally {
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Error de autenticación. Por favor, inicia sesión de nuevo.');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [handleApiError]);

  // Use a ref for allStatuses and allPriorities to ensure stable identity
  const allStatuses = useMemo(() => {
    const statuses = Array.from(new Set(recentActivity.map(r => r.status)));
    return ['todos', ...statuses];
  }, [recentActivity]);

  const allPriorities = useMemo(() => {
    const priorities = Array.from(new Set(recentActivity.map(r => r.priority)));
    return ['todos', ...priorities];
  }, [recentActivity]);


  const actividadFiltrada = useMemo(() => {
    return recentActivity.filter(r =>
      (filtroEstado === 'todos' || r.status === filtroEstado) &&
      (filtroPrioridad === 'todos' || r.priority === filtroPrioridad)
    );
  }, [recentActivity, filtroEstado, filtroPrioridad]);


  // Código para generar el SVG de la flecha personalizada para los select
  const generateSvgArrow = useCallback((color: string) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-chevron-down'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E`, []);
  const defaultArrowColor = useMemo(() => encodeURIComponent('#6B7280'), []); // Tailwind's gray-500, hex code URL-encoded
  const focusArrowColor = useMemo(() => encodeURIComponent('#3B82F6'), []); // Tailwind's blue-500 for focus effect

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200 font-inter antialiased pt-24 pb-16 overflow-hidden">
      {/* Patrón de ondas SVG estático en el fondo */}
      <div className="absolute inset-x-0 bottom-0 h-96 z-0 overflow-hidden opacity-50 pointer-events-none select-none">
        <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            d="M0,192L80,186.7C160,181,320,171,480,186.7C640,203,800,245,960,240C1120,235,1280,181,1360,154.7L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
            fill="url(#gradientWaves)"
          />
          <defs>
            <linearGradient id="gradientWaves" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: "rgb(150, 190, 255)", stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: "rgb(190, 220, 255)", stopOpacity: 0.2 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Burbujas flotantes de fondo (opcional, si no usas BackgroundMedia con video/imagen) */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none select-none">
        <motion.div
          className="absolute w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-1/4 left-1/4"
          animate={{ x: [0, 80, 0], y: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 bottom-1/4 right-1/4"
          animate={{ x: [0, -60, 0], y: [0, 70, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 top-1/2 right-1/4"
          animate={{ x: [0, 90, 0], y: [0, -80, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-16 px-4 sm:px-6 lg:px-8 z-10">
        {/* Encabezado Principal y Logo */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center bg-gradient-to-br from-white to-blue-50 rounded-5xl p-8 sm:p-12 shadow-3xl border border-white/70 backdrop-blur-md relative overflow-hidden"
        >
          {/* Efecto de brillo animado en el fondo */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />
          
          <motion.div className="flex justify-center mb-8 z-10 relative">
            <div className="relative">
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-30 blur-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <img
                src="/Montemorelos.jpg"
                alt="Logo Montemorelos"
                className="h-40 w-40 sm:h-48 sm:w-48 object-contain rounded-full shadow-2xl p-2 bg-white transform transition-all duration-300 hover:scale-105 relative z-10"
              />
            </div>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-800 mb-6 leading-tight tracking-tight drop-shadow-lg">
            Plataforma de Gestión de Servicios
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 max-w-4xl mx-auto font-medium leading-relaxed sm:leading-loose drop-shadow-sm mb-8">
            Optimiza y coordina los procesos del <span className="text-blue-800 font-bold text-2xl">Departamento de Sistemas</span> de la Presidencia Municipal de Montemorelos.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <motion.div 
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: "80px" }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <motion.div 
              className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: "60px" }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Sección de Indicadores Clave (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mt-16">
          {stats.map((stat, index) => {
            const Icon: React.ElementType = stat.icon;
            // Extracted priority specific color logic
            const valueColor = stat.label === 'Reportes Críticos' && stat.value !== 'N/A' && stat.value !== 0 ? 'text-red-700' : 'text-blue-950';

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5, boxShadow: "0px 18px 36px rgba(0,0,0,0.18)" }}
                className={`relative rounded-3xl p-8 shadow-xl border border-white/70 ${stat.bgColor} flex flex-col justify-between transition-all duration-300 overflow-hidden cursor-pointer transform will-change-transform group`}
              >
                {/* Elemento que crea el "brillo" al hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-white opacity-0 transform -rotate-12 translate-x-1/2 group-hover:opacity-10 transition-all duration-700 ease-out z-0"></div>
                
                {/* Efecto de onda animada */}
                <motion.div 
                  className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white opacity-10"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <div className="flex items-start justify-between z-10">
                  <div>
                    <p className="text-gray-700 text-lg font-semibold flex items-center gap-2 mb-3 group-hover:text-gray-900 transition-colors">
                      {stat.label}
                      <span className="relative group/tooltip">
                        <Info className="h-4 w-4 text-blue-500 inline-block cursor-help hover:text-blue-600 transition-colors" />
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-indigo-800 text-white text-xs rounded-lg shadow-2xl p-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 z-50 text-left leading-snug">
                          {KPI_TOOLTIPS[stat.label]}
                        </span>
                      </span>
                    </p>
                    <p className={`text-6xl lg:text-7xl font-extrabold leading-tight transition-colors drop-shadow-xl ${valueColor}`}>
                      {stat.value}
                    </p>
                  </div>
                  <motion.div
                    className={`p-5 rounded-full shadow-lg transform -rotate-12 bg-gradient-to-br ${stat.color} transition-all duration-300 group-hover:scale-115 group-hover:rotate-6`}
                    initial={{ rotate: 0 }}
                    whileHover={{ rotate: 20 }}
                  >
                    <Icon className="h-10 w-10 text-white" />
                  </motion.div>
                </div>
                
                {/* Barra de progreso visual */}
                <div className="mt-6 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <motion.div 
                    className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: stat.value !== 'N/A' && typeof stat.value === 'number' ? `${Math.min(100, stat.value * 10)}%` : '30%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Sección de Acciones Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pt-16">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.link} className="focus:outline-none focus:ring-4 focus:ring-blue-400 rounded-3xl group">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 + index * 0.18 }}
                  whileHover={{ scale: 1.05, y: -10, boxShadow: "0px 25px 50px rgba(0,0,0,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative rounded-3xl p-8 sm:p-10 shadow-xl border border-white/60 bg-white/80 backdrop-blur-lg transition-all duration-400 overflow-hidden cursor-pointer hover:border-blue-300`}
                >
                  {/* Efecto de brillo animado */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                  />
                  
                  {/* Efecto de onda en el fondo */}
                  <motion.div 
                    className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-20"
                    style={{ background: action.color.replace('to-', '') }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <div className={`bg-gradient-to-r ${action.color} ${action.hoverColor} w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all duration-500 ease-in-out group-hover:scale-[1.15] group-hover:rotate-6 relative z-10`}>
                    <Icon className="h-16 w-16 text-white transition-transform duration-500 group-hover:rotate-12" />
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-snug tracking-tight drop-shadow-sm transition-colors duration-300 relative z-10" style={{ color: action.textColor }}>
                    {action.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg sm:text-xl group-hover:text-gray-900 transition-colors relative z-10">
                    {action.description}
                  </p>
                  
                  {/* Indicador de enlace */}
                  <div className="flex justify-center mt-6 relative z-10">
                    <motion.div 
                      className="text-sm font-medium flex items-center gap-1 px-4 py-2 rounded-full bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors duration-300"
                      whileHover={{ x: 5 }}
                    >
                      Acceder
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Reportes Resueltos vs Total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            whileHover={{ scale: 1.03, boxShadow: "0px 12px 24px rgba(0,0,0,0.1)" }}
            className="rounded-3xl p-8 sm:p-10 h-56 sm:h-auto border border-white/70 shadow-md bg-white/80 backdrop-blur-lg flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 hover:shadow-xl group"
          >
            <CheckCircle className="h-16 w-16 text-emerald-600 mb-5 drop-shadow-md group-hover:scale-[1.10] transition-transform" />
            <span className="text-6xl sm:text-7xl font-extrabold text-emerald-700 drop-shadow-sm leading-tight">{resueltos}</span>
            <span className="text-2xl text-gray-700 font-semibold mt-2">Reportes Resueltos</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            whileHover={{ scale: 1.03, boxShadow: "0px 12px 24px rgba(0,0,0,0.1)" }}
            className="rounded-3xl p-8 sm:p-10 h-56 sm:h-auto border border-white/70 shadow-md bg-white/80 backdrop-blur-lg flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 hover:shadow-xl group"
          >
            <TrendingUp className="h-16 w-16 text-blue-600 mb-5 drop-shadow-md group-hover:scale-[1.10] transition-transform" />
            <span className="text-6xl sm:text-7xl font-extrabold text-blue-700 drop-shadow-sm leading-tight">{totalReportes}</span>
            <span className="text-2xl text-gray-700 font-semibold mt-2">Total de Reportes Registrados</span>
          </motion.div>
        </div>

        {/* Filtros de Actividad Reciente */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-col sm:flex-row flex-wrap gap-6 items-center mt-16 bg-white/85 backdrop-blur-xl p-8 rounded-4xl shadow-xl border border-white/70"
        >
          <label htmlFor="filterStatus" className="text-2xl font-bold text-blue-900 mr-4 flex-shrink-0">Filtros:</label>
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative flex items-center gap-3 group"> {/* Añadido 'group' para efectos de hover */}
              <span className="text-gray-700 text-lg font-semibold group-focus-within:text-blue-700 transition-colors">Estado:</span>
              <select
                id="filterStatus"
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 p-3.5 shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 transition cursor-pointer text-lg text-blue-900 font-medium appearance-none pr-10 hover:shadow-md
                bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.2rem] // Default styles for custom arrow
                group-hover:bg-[length:1.25rem_1.25rem] group-hover:bg-[right_0.7rem_center] group-focus-within:bg-[length:1.25rem_1.25rem] group-focus-within:bg-[right_0.7rem_center]" // Hover/Focus styles
                style={{
                  backgroundImage: `url("${generateSvgArrow(defaultArrowColor)}")`,
                }}
                onFocus={(e) => (e.target.style.backgroundImage = `url("${generateSvgArrow(focusArrowColor)}")`)}
                onBlur={(e) => (e.target.style.backgroundImage = `url("${generateSvgArrow(defaultArrowColor)}")`)}
              >
                {allStatuses.map(e => (
                  <option key={e} value={e}>
                    {e === 'todos' ? 'Todos los Estados' : e}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative flex items-center gap-3 group">
              <span className="text-gray-700 text-lg font-semibold group-focus-within:text-blue-700 transition-colors">Prioridad:</span>
              <select
                id="filterPriority"
                value={filtroPrioridad}
                onChange={e => setFiltroPrioridad(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 p-3.5 shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 transition cursor-pointer text-lg text-blue-900 font-medium appearance-none pr-10 hover:shadow-md
                bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.2rem]
                group-hover:bg-[length:1.25rem_1.25rem] group-hover:bg-[right_0.7rem_center] group-focus-within:bg-[length:1.25rem_1.25rem] group-focus-within:bg-[right_0.7rem_center]"
                style={{
                  backgroundImage: `url("${generateSvgArrow(defaultArrowColor)}")`,
                }}
                onFocus={(e) => (e.target.style.backgroundImage = `url("${generateSvgArrow(focusArrowColor)}")`)}
                onBlur={(e) => (e.target.style.backgroundImage = `url("${generateSvgArrow(defaultArrowColor)}")`)}
              >
                {allPriorities.map(p => (
                  <option key={p} value={p}>
                    {p === 'todos' ? 'Todas las Prioridades' : p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Sección de Actividad Reciente */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-16"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-4xl shadow-3xl border border-white/70 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-7 sm:p-9 flex items-center justify-center border-b-2 border-indigo-700 relative overflow-hidden">
              {/* Efecto de brillo animado */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              />
              
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-4 drop-shadow-lg relative z-10">
                <TrendingUp className="h-10 w-10 text-yellow-300" /> Actividad Reciente
              </h2>
            </div>
            <div className="p-7 sm:p-9">
              <div className="space-y-8">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 bg-blue-50 rounded-2xl shadow-inner border border-blue-100">
                    <Loader2 className="animate-spin h-24 w-24 text-blue-600 mb-6" />
                    <span className="text-4xl font-extrabold text-blue-800 mb-2">Cargando datos...</span>
                    <p className="text-blue-500 mt-2 text-xl">Por favor espera un momento, estamos buscando tus reportes.</p>
                  </div>
                )}
                {error && (
                  <div className="text-center py-16 bg-red-50 rounded-2xl shadow-md border border-red-100">
                    <AlertTriangle className="h-14 w-14 text-red-500 mx-auto mb-6" />
                    <p className="text-red-700 text-3xl font-bold mb-4">{error}</p>
                    <p className="text-red-500 text-lg mt-3">Puede que haya un problema con la conexión o el servidor.</p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 transition shadow-lg flex items-center gap-3 mx-auto text-xl transform hover:scale-105"
                      >
                        <Loader2 className="h-7 w-7" />
                        Reintentar
                      </button>
                      <button
                        onClick={() => navigate('/login')}
                        className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-3 mx-auto text-xl transform hover:scale-105"
                      >
                        Ir a Login
                      </button>
                    </div>
                  </div>
                )}
                {!isLoading && !error && actividadFiltrada.length === 0 && (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl shadow-inner border border-gray-100">
                    <Info className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    <span className="text-3xl font-bold text-gray-700 mb-3">No se encontraron reportes.</span>
                    <p className="text-gray-600 mt-2 text-xl">Intenta ajustar tus filtros o ¡crea el primer reporte!</p>
                    <Link to="/reporte" className="mt-8 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300">
                      <FileText className="h-6 w-6 mr-3" />
                      Crear Nuevo Reporte
                    </Link>
                  </div>
                )}
                {!isLoading && !error && actividadFiltrada.length > 0 && actividadFiltrada.map((item, index) => {
                  // Extracted priority text color logic
                  const getPriorityColorClasses = () => {
                    switch (item.priority) {
                      case 'Crítica': return 'bg-red-600 text-white';
                      case 'Alta': return 'bg-orange-500 text-white';
                      case 'Media': return 'bg-yellow-500 text-gray-900';
                      case 'Baja': return 'bg-green-500 text-white';
                      default: return 'bg-gray-500 text-white';
                    }
                  };
                  
                  // Obtener color para la barra lateral según la prioridad
                  const getPriorityBarColor = () => {
                    switch (item.priority) {
                      case 'Crítica': return 'bg-gradient-to-b from-red-500 to-red-700';
                      case 'Alta': return 'bg-gradient-to-b from-orange-500 to-orange-700';
                      case 'Media': return 'bg-gradient-to-b from-yellow-500 to-yellow-700';
                      case 'Baja': return 'bg-gradient-to-b from-green-500 to-green-700';
                      default: return 'bg-gradient-to-b from-gray-500 to-gray-700';
                    }
                  };
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                      whileHover={{ scale: 1.015, boxShadow: "0px 10px 25px rgba(0,0,0,0.15)" }}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-7 bg-white border border-gray-200 rounded-3xl shadow-lg transition-transform duration-300 cursor-pointer hover:border-blue-300 relative overflow-hidden`}
                    >
                      {/* Barra lateral de color según prioridad */}
                      <div className={`absolute left-0 top-0 bottom-0 w-2 ${getPriorityBarColor()}`}></div>
                      
                      {/* Efecto de brillo sutil */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0"
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      <div className="flex-1 space-y-3 mb-5 md:mb-0 pl-2">
                        <div className="flex items-center space-x-4 flex-wrap gap-y-3">
                          <span className="font-extrabold text-lg text-gray-800 p-2 px-4 bg-blue-100 text-blue-800 rounded-xl shadow-inner transition-colors">
                            {item.dept}
                          </span>
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-colors ${getPriorityColorClasses()}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug tracking-tight mt-2.5">{item.issue}</p>
                        <div className="text-sm sm:text-base text-gray-600 space-y-2">
                          <div className="flex flex-wrap items-center gap-x-3">
                            <span className="font-bold text-gray-700">ID del Reporte:</span>
                            <span className="text-blue-600 font-mono text-xs sm:text-sm bg-blue-50 p-1 px-2.5 rounded shadow-sm cursor-text select-all">{item.id}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <p><span className="font-bold text-gray-700">Reportado por:</span> {item.quienReporta || 'Desconocido'}</p>
                            <p><span className="font-bold text-gray-700">Tipo de Problema:</span> {item.tipoProblema || 'General'}</p>
                            <p className="sm:col-span-2"><span className="font-bold text-gray-700">Fecha y Hora:</span> {item.time || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-5 flex-shrink-0">
                        <span className={`px-6 py-2.5 rounded-full text-base font-extrabold shadow-lg min-w-[140px] text-center ${item.colorClass}`}>{item.status}</span>
                        <motion.button
                          whileHover={{ scale: 1.15, boxShadow: "0px 8px 20px rgba(0,0,255,0.25)" }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3.5 bg-blue-100 hover:bg-blue-200 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          title="Ver detalles"
                          onClick={() => setDetalleReporte(item)}
                        >
                          <Eye className="h-8 w-8 text-blue-700" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modal de Detalle de Reporte */}
        <AnimatePresence>
          {detalleReporte && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setDetalleReporte(null)} // Cerrar modal al clickear fuera
            >
              <motion.div
                initial={{ scale: 0.8, y: -50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: -50, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-3xl max-w-xl w-full p-8 relative border border-blue-200 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()} // Evitar cerrar modal al clickear dentro
              >
                {/* Efecto de brillo animado en el fondo */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-3xl"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                />
                
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 z-10"
                  onClick={() => setDetalleReporte(null)}
                  title="Cerrar"
                >
                  <X className="h-7 w-7" />
                </button>
                
                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-blue-900 flex items-center gap-4 border-b-2 pb-5 border-blue-100 leading-snug">
                    <div className="p-3 rounded-full bg-blue-100">
                      <FileText className="h-10 w-10 text-blue-600" />
                    </div>
                    Detalles del Reporte
                  </h2>
                  
                  <div className="space-y-6 text-lg text-gray-800 leading-relaxed">
                    <DetailItem label="ID del Reporte" value={detalleReporte.id} isId />
                    <DetailItem label="Departamento(s)" value={detalleReporte.dept} />
                    <DetailItem label="Prioridad" value={detalleReporte.priority} type="priority" />
                    <DetailItem label="Estado" value={detalleReporte.status} type="status" />
                    <DetailItem label="Tipo de Problema" value={detalleReporte.tipoProblema} />
                    <DetailItem label="Reportado por" value={detalleReporte.quienReporta} />
                    <DetailItem label="Fecha y Hora" value={detalleReporte.time} />

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mt-8 border border-blue-100 shadow-inner">
                      <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Descripción Completa:
                      </h3>
                      <div className="bg-white p-5 rounded-lg text-gray-700 border border-gray-100 shadow-inner text-base whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                        {detalleReporte.descripcion || 'Sin descripción detallada.'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setDetalleReporte(null)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center gap-2"
                    >
                      Cerrar
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sección de Ayuda / Información */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        className="flex justify-center mt-20 mb-12"
      >
        <Link to="/ayuda"
          className="flex items-center text-blue-700 hover:text-blue-900 font-bold text-xl hover:underline transition-all group p-5 px-8 bg-white/70 backdrop-blur-lg rounded-full shadow-lg border border-white/60 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 transform hover:scale-105"
        >
          <Info className="h-7 w-7 mr-3 text-blue-600 transition-transform group-hover:scale-[1.10] group-hover:-rotate-6" />
          Necesitas ayuda? Accede a nuestro <span className="font-extrabold text-blue-800 ml-1">Centro de Soporte</span>
          <span className="ml-4 text-blue-500 text-2xl transition-transform group-hover:translate-x-2 transform duration-300">→</span>
        </Link>
      </motion.div>
    </div>
  );
};

// Componente auxiliar para el detalle del reporte
interface DetailItemProps {
  label: string;
  value: string | number | undefined | null;
  type?: 'priority' | 'status';
  isId?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, type, isId }) => {
  const displayValue = value || 'N/A';
  let valueClasses = "ml-0 sm:ml-4 text-gray-700 sm:text-right w-full sm:w-auto";

  if (isId) {
    valueClasses += " font-mono text-sm sm:text-base bg-blue-50 px-2 py-1 rounded shadow-sm break-all";
  }

  const getValueColorClass = (itemType: 'priority' | 'status' | undefined, itemValue: string | number | undefined | null): string => {
    switch (itemType) {
      case 'priority':
        if (itemValue === 'Crítica') return 'text-red-600';
        if (itemValue === 'Alta') return 'text-orange-500';
        if (itemValue === 'Media') return 'text-yellow-600';
        if (itemValue === 'Baja') return 'text-green-600';
        return 'text-gray-700';
      case 'status':
        if (itemValue === 'Pendiente') return 'text-red-500';
        if (itemValue === 'En Proceso') return 'text-amber-600';
        if (itemValue === 'Resuelto') return 'text-emerald-600';
        return 'text-gray-500';
      default:
        return 'text-gray-700';
    }
  };

  if (type) {
    valueClasses = `sm:ml-4 font-extrabold sm:text-right w-full sm:w-auto ${getValueColorClass(type, value)}`;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-2 border-b border-gray-100 last:border-b-0">
      <span className="font-bold text-gray-900 flex-shrink-0 text-xl sm:text-lg">{label}:</span>
      <span className={valueClasses}>{displayValue}</span>
    </div>
  );
};

export default Home;