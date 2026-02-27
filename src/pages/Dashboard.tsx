import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../services/apiConfig';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart, Legend, Brush
} from 'recharts';
import {
  Search, CheckCircle, Clock, TrendingUp, Users, FileText, RefreshCw, PieChart as PieChartIcon, Trash2, User, AlertTriangle, Settings,
  Loader2, DownloadCloud, Upload, Filter, ChevronLeft, ChevronRight,
  Pencil, Save, X, Calendar, MapPin, Activity, Database, Shield, Plus // X es usado para el botón de cancelar en la edición de tabla
} from 'lucide-react';
import Papa from 'papaparse';
import api from '../api'; // Asume que `api` ya configura el token.
import toast from 'react-hot-toast';

// region: Interfaces y Datos de Configuración

interface Reporte {
  _id: string;
  departamento: string[];
  descripcion: string;
  tipoProblema: string;
  quienReporta: string;
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  asignadoA?: string; // Hacemos `asignadoA` opcional
  status: 'Pendiente' | 'En Proceso' | 'Resuelto';
  timestamp: string;
  [key: string]: any;
}

const ESTADOS = [
  { name: 'Pendiente', color: '#ef4444' }, // red-500
  { name: 'En Proceso', color: '#facc15' }, // yellow-400
  { name: 'Resuelto', color: '#22c55e' }, // green-500
];

const PRIORIDADES = [
  { name: 'Baja', color: '#3b82f6' },   // blue-500
  { name: 'Media', color: '#facc15' },  // yellow-400
  { name: 'Alta', color: '#ef4444' },   // red-500
  { name: 'Crítica', color: '#8b5cf6' } // violet-500
];

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const FILTROS_FECHA = [
  { value: 'todos', label: 'Todas las fechas' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'ayer', label: 'Ayer' },
  { value: 'estaSemana', label: 'Esta semana' },
  { value: 'semanaPasada', label: 'Semana pasada' },
  { value: 'ultimos7', label: 'Últimos 7 días' },
  { value: 'ultimos30', label: 'Últimos 30 días' },
  { value: 'mes', label: 'Este mes' },
  { value: 'mesPasado', label: 'Mes pasado' },
  { value: 'trimestre', label: 'Este trimestre' },
  { value: 'trimestrePasado', label: 'Trimestre pasado' },
  { value: 'añoActual', label: 'Este año' },
  { value: 'añoPasado', label: 'Año pasado' },
  { value: '2024', label: 'Año 2024' },
  { value: '2025', label: 'Año 2025' }
];

const INTEGRANTES = [
  'Lic. Francisco Jahir Vazquez De Leon',
  'Ayudante Paco',
  'Roberto Carlos De La Cruz Gonzalez',
];

const tiposProblema = [
  'Hardware - Computadoras', 'Hardware - Impresoras', 'Hardware - Red/Internet',
  'Software - Instalación', 'Software - Configuración', 'Software - Licencias',
  'Sistemas - Base de datos', 'Sistemas - Aplicaciones web',
  'Soporte - Capacitación', 'Soporte - Mantenimiento', 'Otro'
];

// Clases de Tailwind para "glassmorphism"
const glassCard = "bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-3xl border border-gray-100 p-8 transform-gpu overflow-hidden";
const glassButton = "transition-all font-semibold border rounded-xl px-5 py-2.5 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-white active:scale-95 text-lg";
const btnPrimary = `${glassButton} bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-xl hover:shadow-2xl border-transparent`;
const btnSuccess = `${glassButton} bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-xl hover:shadow-2xl border-transparent`;
const btnInfo = `${glassButton} bg-gradient-to-r from-sky-500 to-cyan-600 text-white hover:from-sky-600 hover:to-cyan-700 shadow-xl hover:shadow-2xl border-transparent`;
const btnWarning = `${glassButton} bg-gradient-to-r from-amber-400 to-orange-500 text-orange-900 hover:from-amber-500 hover:to-orange-600 shadow-xl hover:shadow-2xl border-amber-500`;
// Modificado bg-right-arrow para que apunte al icono Lucide SVG
const glassSelect = `bg-white/80 border border-blue-200 rounded-xl px-4 py-2.5 font-medium shadow-md text-gray-800 focus:outline-none focus:ring-3 focus:ring-blue-300 transition-all duration-200 cursor-pointer appearance-none 
  bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-chevron-down'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] 
  bg-[right_0.75rem_center] bg-no-repeat bg-[length:1.25em_1.25em]`;
const glassInput = "bg-white/80 border border-blue-200 rounded-xl px-4 py-2.5 font-medium shadow-md text-gray-800 focus:outline-none focus:ring-3 focus:ring-blue-300 transition-all duration-200";
const glassTable = "rounded-[2.5rem] overflow-hidden shadow-3xl border border-blue-200 bg-white/90 backdrop-blur-xl";

// Función auxiliar para comparar arrays (para verificar cambios en departamentos)
const arraysEqual = (a: string[] | undefined, b: string[] | undefined): boolean => {
    if (!a && !b) return true; // Ambos undefined/null, son iguales
    if (!a || !b) return false; // Uno es undefined/null, el otro no
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    for (let i = 0; i < sortedA.length; i++) {
        if (sortedA[i] !== sortedB[i]) return false;
    }
    return true;
};

// endregion: Interfaces y Datos de Configuración

// Hook para "debounce"
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Dashboard: React.FC = () => {
  const { usuario } = useAuth();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReporte, setNewReporte] = useState<Partial<Reporte>>({
    departamento: [],
    descripcion: '',
    tipoProblema: tiposProblema[0],
    quienReporta: '',
    prioridad: 'Baja',
    status: 'Pendiente',
    asignadoA: ''
  });
  
  // Verificar si el usuario tiene permiso para editar (incluyendo 'técnico')
  const canEdit = usuario && (
    (usuario.roles && Array.isArray(usuario.roles) && 
     (usuario.roles.includes('administrador') || usuario.roles.includes('jefe_departamento') || usuario.roles.includes('técnico'))) ||
    (usuario.rol === 'administrador' || usuario.rol === 'jefe_departamento' || usuario.rol === 'técnico')
  );
  const [filtroFecha, setFiltroFecha] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('todos');
  const [filtroQuienReporta, setFiltroQuienReporta] = useState<string>('todos');
  const [filtroAsignadoA, setFiltroAsignadoA] = useState<string>('todos');

  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Reporte>>({}); // Para almacenar cambios temporales de la fila en edición
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const busquedaDebounced = useDebounce<string>(busqueda, 500);

  // Helper para mostrar un toast
  const showThemedToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    let bgColor = '#3B82F6';
    let icon = '💡';
    switch (type) {
      case 'success': bgColor = '#22C55E'; icon = '🎉'; break;
      case 'error': bgColor = '#EF4444'; icon = '🚫'; break;
      case 'info': bgColor = '#3B82F6'; icon = '💡'; break;
    }

    toast(message, {
      icon: icon,
      style: {
        borderRadius: '10px',
        background: bgColor,
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      },
      duration: 3000,
      position: 'top-right',
    });
  }, []);

  // Función para obtener un integrante aleatorio para asignación
  const getRandomAsignadoA = useCallback(() => {
    return INTEGRANTES[Math.floor(Math.random() * INTEGRANTES.length)];
  }, []);

  // Función para crear un nuevo reporte
  const handleCreateReporte = useCallback(async () => {
    // Verificar si el usuario tiene permiso para crear
    if (!canEdit) {
      showThemedToast('No tienes permisos para crear reportes.', 'error');
      return;
    }

    // Validar campos requeridos
    if (!newReporte.departamento || newReporte.departamento.length === 0 || 
        !newReporte.descripcion || !newReporte.quienReporta) {
      showThemedToast('Por favor, completa todos los campos requeridos.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      showThemedToast('Creando reporte...', 'info');

      const reporteToCreate = {
        ...newReporte,
        timestamp: new Date().toISOString(),
        asignadoA: newReporte.asignadoA || getRandomAsignadoA(),
      };

      const response = await api.post(API_ENDPOINTS.REPORTES, reporteToCreate);
      
      if (response.data) {
        // Agregar el nuevo reporte a la lista local
        const reporteCreado: Reporte = {
          ...reporteToCreate,
          _id: (response.data as any).insertedId || (response.data as any)._id || Date.now().toString(),
          departamento: reporteToCreate.departamento || [],
          descripcion: reporteToCreate.descripcion || '',
          tipoProblema: reporteToCreate.tipoProblema || '',
          quienReporta: reporteToCreate.quienReporta || '',
          prioridad: reporteToCreate.prioridad || 'Baja',
          status: reporteToCreate.status || 'Pendiente',
          asignadoA: reporteToCreate.asignadoA,
          timestamp: reporteToCreate.timestamp,
        };

        setReportes(prev => [reporteCreado, ...prev]);
        showThemedToast('Reporte creado con éxito.', 'success');
        
        // Limpiar el formulario
        setNewReporte({
          departamento: [],
          descripcion: '',
          tipoProblema: tiposProblema[0],
          quienReporta: '',
          prioridad: 'Baja',
          status: 'Pendiente',
          asignadoA: ''
        });
        
        // Cerrar el formulario
        setShowCreateForm(false);
      }
    } catch (err: any) {
      console.error('Error al crear reporte:', err);
      
      if (err.response?.status === 403) {
        showThemedToast('No tienes permisos para crear reportes. Por favor, inicia sesión nuevamente.', 'error');
      } else if (err.response?.status === 400) {
        showThemedToast(`Error de validación: ${err.response?.data?.message || 'Datos inválidos'}`, 'error');
      } else {
        showThemedToast(`Error al crear reporte: ${err.response?.data?.message || err.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, newReporte, getRandomAsignadoA, showThemedToast]);

  // Fetch reportes
  const fetchReportes = useCallback(async (showSuccessMessage = false) => {
    // Cancelar cualquier edición en curso al recargar datos
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setEditRowId(null);
    setEditData({});
    setAutoSaveStatus('idle');

    setIsLoading(true);

    try {
      console.log('Cargando reportes desde la API...');
      const res = await api.get(API_ENDPOINTS.REPORTES);
      const data = res.data;

      const dataArray = Array.isArray(data) ? data : ((data as any).reportes || (data as any).data || []);

      if (!Array.isArray(dataArray)) {
        throw new Error('La respuesta del servidor no contiene un array de reportes válido');
      }

      const adaptados: Reporte[] = (dataArray as any[]).map((r: any) => {
        // Validar que el reporte tenga los campos mínimos requeridos
        if (!r._id) {
          console.warn('Reporte sin ID encontrado:', r);
          return null;
        }

        const assignedTo = r.asignadoA && INTEGRANTES.includes(r.asignadoA) ? r.asignadoA : getRandomAsignadoA();

        const reporte: Reporte = {
          _id: r._id.toString(), // Asegurar que sea string
          departamento: Array.isArray(r.departamento)
            ? r.departamento.map((d: string) => d.trim()).filter(Boolean)
            : typeof r.departamento === 'string'
              ? (r.departamento as string).split(',').map((d: string) => d.trim()).filter(Boolean)
              : [],
          descripcion: r.descripcion || '',
          tipoProblema: r.tipoProblema || '',
          quienReporta: r.quienReporta || '',
          prioridad: ['Baja', 'Media', 'Alta', 'Crítica'].includes(r.prioridad) ? r.prioridad : 'Baja',
          status: ['Pendiente', 'En Proceso', 'Resuelto'].includes(r.status) ? r.status : 'Pendiente',
          asignadoA: assignedTo,
          timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
        };
        return reporte;
      }).filter((r: Reporte | null): r is Reporte => r !== null && r._id !== '');

      console.log(`Cargados ${adaptados.length} reportes correctamente`);
      setReportes(adaptados);
      
      if (showSuccessMessage) {
        showThemedToast(`${adaptados.length} reportes cargados correctamente.`, 'success');
      }

    } catch (e: any) {
      console.error('Error al cargar reportes:', e.response?.data?.message || e.message);
      
      if (e.response?.status === 401 || e.response?.status === 403) {
        showThemedToast('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
      } else if (e.response?.status === 500) {
        showThemedToast('Error del servidor. Intentando nuevamente en unos segundos...', 'error');
      } else if (e.code === 'ECONNABORTED' || e.message === 'Network Error') {
        showThemedToast('Error de conexión. Verifica tu conexión a internet.', 'error');
      } else {
        showThemedToast(`Error al cargar reportes: ${e.response?.data?.message || e.message}`, 'error');
      }
      
      // En caso de error, mantener los reportes actuales si los hay
      if (reportes.length === 0) {
        setReportes([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getRandomAsignadoA, showThemedToast, reportes.length]);

  useEffect(() => {
    fetchReportes(true); // Mostrar mensaje de éxito en la carga inicial
    const interval = setInterval(() => {
      fetchReportes(false); // No mostrar mensaje en actualizaciones automáticas
    }, 30000); // Refresca cada 30 segundos para mejor sincronización
    return () => clearInterval(interval);
  }, [fetchReportes]);


  // Filtros y cálculos memorizados
  const departamentosUnicos = useMemo(() => {
    const deps = new Set<string>();
    reportes.forEach(r => r.departamento.forEach(dep => deps.add(dep)));
    return Array.from(deps).sort();
  }, [reportes]);

  const usuariosUnicos = useMemo(() => {
    const usuarios = new Set<string>();
    reportes.forEach(r => {
      if (r.quienReporta) usuarios.add(r.quienReporta);
      if (r.asignadoA) usuarios.add(r.asignadoA);
    });
    return Array.from(usuarios).sort();
  }, [reportes]);

  const reportesFiltrados = useMemo(() => {
    return reportes.filter(r => {
      const fecha = new Date(r.timestamp);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let passesDateFilter = true;
      if (filtroFecha !== 'todos') {
        const reportDateNormalized = new Date(fecha);
        reportDateNormalized.setHours(0, 0, 0, 0);

        switch (filtroFecha) {
          case 'hoy': passesDateFilter = reportDateNormalized.getTime() === now.getTime(); break;
          case 'ayer':
            const ayer = new Date(now); ayer.setDate(now.getDate() - 1);
            passesDateFilter = reportDateNormalized.getTime() === ayer.getTime();
            break;
          case 'estaSemana':
            const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
            startOfWeek.setHours(0,0,0,0);
            const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23,59,59,999);
            passesDateFilter = fecha >= startOfWeek && fecha <= endOfWeek;
            break;
          case 'semanaPasada':
            const startOfLastWeek = new Date(now); startOfLastWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) - 7);
            startOfLastWeek.setHours(0,0,0,0);
            const endOfLastWeek = new Date(startOfLastWeek); endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
            endOfLastWeek.setHours(23,59,59,999);
            passesDateFilter = fecha >= startOfLastWeek && fecha <= endOfLastWeek;
            break;
          case 'ultimos7':
            const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6);
            sevenDaysAgo.setHours(0,0,0,0);
            passesDateFilter = fecha >= sevenDaysAgo && fecha <= new Date(now.setHours(23,59,59,999));
            break;
          case 'ultimos30':
            const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 29);
            thirtyDaysAgo.setHours(0,0,0,0);
            passesDateFilter = fecha >= thirtyDaysAgo && fecha <= new Date(now.setHours(23,59,59,999));
            break;
          case 'mes':
            passesDateFilter = fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
            break;
          case 'mesPasado':
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            passesDateFilter = fecha.getMonth() === prevMonth.getMonth() && fecha.getFullYear() === prevMonth.getFullYear();
            break;
          case 'trimestre':
            const currentQuarter = Math.floor(now.getMonth() / 3);
            passesDateFilter = Math.floor(fecha.getMonth() / 3) === currentQuarter && fecha.getFullYear() === now.getFullYear();
            break;
          case 'trimestrePasado':
            let pastMonthStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            passesDateFilter = fecha.getFullYear() === pastMonthStart.getFullYear() && Math.floor(fecha.getMonth() / 3) === Math.floor(pastMonthStart.getMonth() / 3);
            break;
          case 'añoActual': passesDateFilter = fecha.getFullYear() === now.getFullYear(); break;
          case 'añoPasado': passesDateFilter = fecha.getFullYear() === now.getFullYear() - 1; break;
          case '2024': passesDateFilter = fecha.getFullYear() === 2024; break;
          case '2025': passesDateFilter = fecha.getFullYear() === 2025; break;
        }
      }

      const busq = busquedaDebounced.toLowerCase();
      
      const passesDepartamentoFilter = filtroDepartamento === 'todos' || r.departamento.some(dep => dep.toLowerCase() === filtroDepartamento.toLowerCase());
      const passesQuienReportaFilter = filtroQuienReporta === 'todos' || (r.quienReporta && r.quienReporta.toLowerCase() === filtroQuienReporta.toLowerCase());
      const passesAsignadoAFilter = filtroAsignadoA === 'todos' || (r.asignadoA && r.asignadoA.toLowerCase() === filtroAsignadoA.toLowerCase());
      
      return (
        passesDateFilter &&
        (filtroPrioridad === 'todos' || r.prioridad === filtroPrioridad) &&
        (filtroTipo === 'todos' || r.tipoProblema === filtroTipo) &&
        passesDepartamentoFilter &&
        passesQuienReportaFilter &&
        passesAsignadoAFilter &&
        (busq === '' ||
          r._id.toLowerCase().includes(busq) ||
          r.departamento.join(', ').toLowerCase().includes(busq) ||
          r.descripcion.toLowerCase().includes(busq) ||
          r.tipoProblema.toLowerCase().includes(busq) ||
          r.quienReporta.toLowerCase().includes(busq) ||
          (r.asignadoA && r.asignadoA.toLowerCase().includes(busq)) ||
          r.status.toLowerCase().includes(busq)
        )
      );
    });
  }, [reportes, filtroFecha, filtroPrioridad, filtroTipo, busquedaDebounced, filtroDepartamento, filtroQuienReporta, filtroAsignadoA]);

  const totalPages = Math.ceil(reportesFiltrados.length / itemsPerPage);
  const currentReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return reportesFiltrados.slice(startIndex, endIndex);
  }, [reportesFiltrados, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    const total = reportesFiltrados.length;
    const pendientes = reportesFiltrados.filter(r => r.status === 'Pendiente').length;
    const enProceso = reportesFiltrados.filter(r => r.status === 'En Proceso').length;
    const resueltos = reportesFiltrados.filter(r => r.status === 'Resuelto').length;
    const usuarios = new Set(reportesFiltrados.map(r => r.quienReporta)).size;
    const tipos = new Set(reportesFiltrados.map(r => r.tipoProblema)).size;
    return { total, pendientes, enProceso, resueltos, usuarios, tipos };
  }, [reportesFiltrados]);

  // Preparación de datos para gráficos
  const reportesPorDepartamento = useMemo(() => {
    const depMap: Record<string, number> = {};
    reportesFiltrados.forEach(r => r.departamento.forEach(dep => depMap[dep] = (depMap[dep] || 0) + 1));
    return Object.entries(depMap).map(([name, reportes]) => ({ name, reportes })).sort((a,b) => b.reportes - a.reportes).slice(0, 10);
  }, [reportesFiltrados]);

  const reportesPorPrioridad = useMemo(() => {
    return PRIORIDADES.map(p => ({
      name: p.name,
      color: p.color,
      value: reportesFiltrados.filter(r => r.prioridad === p.name).length,
    })).filter(item => item.value > 0);
  }, [reportesFiltrados]);

  const reportesPorTipo = useMemo(() => {
    const map: Record<string, number> = {};
    reportesFiltrados.forEach(r => { if (r.tipoProblema) map[r.tipoProblema] = (map[r.tipoProblema] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);
  }, [reportesFiltrados]);

  const reportesPorUsuario = useMemo(() => {
    const map: Record<string, number> = {};
    reportesFiltrados.forEach(r => { if (r.quienReporta) map[r.quienReporta] = (map[r.quienReporta] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10);
  }, [reportesFiltrados]);

  const tendencia = useMemo(() => {
    const dataMap: Record<number, { mes: string; reportes: number; resueltos: number }> = {};
    for (let i = 0; i < 12; i++) dataMap[i] = { mes: MESES[i], reportes: 0, resueltos: 0 };
  
    reportesFiltrados.forEach(r => {
      const mes = new Date(r.timestamp).getMonth();
      if (dataMap[mes]) { dataMap[mes].reportes += 1; if (r.status === 'Resuelto') dataMap[mes].resueltos += 1; }
    });
    return Object.values(dataMap);
  }, [reportesFiltrados]);

  const reportesPorDiaSemana = useMemo(() => {
    const diasMap: Record<string, number> = { Lunes: 0, Martes: 0, 'Miércoles': 0, Jueves: 0, Viernes: 0 };
    reportesFiltrados.forEach(r => {
      const fecha = new Date(r.timestamp);
      const diaIdx = fecha.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado
      if (diaIdx >= 1 && diaIdx <= 5) { // Solo días de semana (Lunes=1 a Viernes=5)
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        diasMap[dias[diaIdx - 1]] = (diasMap[dias[diaIdx - 1]] || 0) + 1;
      }
    });
    // Convertir a array de objetos para BarChart, manteniendo el orden
    const orderedDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    return orderedDays.map(dia => ({ dia, reportes: diasMap[dia] }));
  }, [reportesFiltrados]);

  // Manejador de edición en línea
  const handleEditClick = useCallback((report: Reporte) => {
    // Verificar si el usuario tiene permiso para editar
    if (!canEdit) {
      toast.error('No tienes permisos para editar reportes.', { 
        style: { 
          background: 'linear-gradient(to right, #ef4444, #dc2626)', 
          color: '#fff' 
        }
      });
      return;
    }
    
    if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
    }
    setEditRowId(report._id);
    // Clonar el objeto reporte para edición
    // Asegurar que 'departamento' es un array de strings si por alguna razón no lo fuera ya.
    const initialEditData = {
        ...report,
        departamento: Array.isArray(report.departamento) ? report.departamento : String(report.departamento || '').split(',').map(s => s.trim()).filter(Boolean),
        asignadoA: report.asignadoA || '', // Convertir undefined a string vacío para select
    };
    setEditData(initialEditData);
    setAutoSaveStatus('idle'); // Reiniciar estado de autoguardado
  }, [canEdit]);

  const handleAutoSave = useCallback(async (reportId: string, updatedLocalData: Partial<Reporte>) => {
    // Verificar si el usuario tiene permiso para guardar cambios
    if (!canEdit) {
      setAutoSaveStatus('error');
      console.error('Usuario no tiene permisos para guardar cambios');
      showThemedToast('No tienes permisos para guardar cambios.', 'error');
      return;
    }
    // Necesitamos el reporte original para comparar si ha habido un cambio.
    const currentReport = reportes.find(r => r._id === reportId);
    if (!currentReport) {
        setAutoSaveStatus('error');
        console.error('Reporte original no encontrado para autoguardado.');
        showThemedToast('Error: Reporte no encontrado para guardar.', 'error');
        return;
    }

    const changedFields: Partial<Reporte> = {};
    let changesDetected = false;

    // Comparar `updatedLocalData` (lo que el usuario ha tecleado) con `currentReport` (lo de la BD)
    for (const key of Object.keys(updatedLocalData) as (keyof Reporte)[]) {
        if (key === '_id' || key === 'timestamp') continue; // Ignorar campos de solo lectura o ID

        if (key === 'departamento') {
            const currentDeps = currentReport.departamento || [];
            const updatedDeps = Array.isArray(updatedLocalData.departamento) ? updatedLocalData.departamento.map(d => d.trim()).filter(Boolean) : [];
            if (!arraysEqual(currentDeps, updatedDeps)) {
                changedFields.departamento = updatedDeps;
                changesDetected = true;
            }
        } else if (key === 'asignadoA') {
            const currentAssigned = currentReport.asignadoA === '' ? undefined : currentReport.asignadoA;
            const updatedAssigned = updatedLocalData.asignadoA === '' ? undefined : updatedLocalData.asignadoA;
            if (currentAssigned !== updatedAssigned) {
                changedFields.asignadoA = updatedAssigned;
                changesDetected = true;
            }
        } else {
            // Comparación simple para otros tipos (string, number, boolean, enum)
            if (updatedLocalData[key] !== currentReport[key]) {
                changedFields[key] = updatedLocalData[key];
                changesDetected = true;
            }
        }
    }
    
    if (!changesDetected) {
      setAutoSaveStatus('idle'); // Si no hay cambios, vuelve a idle.
      return;
    }

    try {
      setAutoSaveStatus('saving');
      console.log('Auto-guardando cambios para el reporte:', reportId, changedFields);
      const response = await api.patch(`${API_ENDPOINTS.REPORTES}/${reportId}`, changedFields);
      
      // Actualizar el estado local con los cambios guardados
      if ((response.data as any).reporte) {
        // Si el servidor devuelve el reporte actualizado, usarlo
        setReportes(prev => prev.map(r => r._id === reportId ? { ...(response.data as any).reporte, _id: (response.data as any).reporte._id.toString() } : r));
      } else {
        // Fallback: actualizar con los campos enviados
        setReportes(prev => prev.map(r => r._id === reportId ? { ...r, ...changedFields } : r));
      }
      
      // Forzar actualización de datos desde el servidor para sincronizar
      setTimeout(() => fetchReportes(false), 500);

      setAutoSaveStatus('saved');
      showThemedToast('Cambios guardados automáticamente', 'success');
      
      // Después de un tiempo, volver el estado a idle
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => setAutoSaveStatus('idle'), 3000);

    } catch (err: any) {
      console.error('Error al auto-guardar reporte:', err.response?.data?.message || err.message);
      setAutoSaveStatus('error');

      if (err.response?.status === 403) {
        showThemedToast('No tienes permisos para guardar cambios. Por favor, inicia sesión nuevamente.', 'error');
      } else if (err.response?.status === 400) {
        showThemedToast(`Error de validación: ${err.response?.data?.message || 'Datos inválidos'}`, 'error');
      } else if (err.response?.status === 404) {
        showThemedToast('El reporte ya no existe. Recargando datos...', 'error');
        fetchReportes(); // Recargar datos si el reporte no existe
      } else {
        showThemedToast(`Error al guardar: ${err.response?.data?.message || err.message}`, 'error');
      }
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); // Detener el timer de "saved" en caso de error.
      autoSaveTimerRef.current = setTimeout(() => setAutoSaveStatus('idle'), 5000); // Volver a idle después de un error
    }
  }, [reportes, canEdit, showThemedToast, fetchReportes]);

  const handleEditChange = useCallback((field: keyof Reporte, value: any) => {
    // Verificar si el usuario tiene permiso para editar
    if (!canEdit) {
      showThemedToast('No tienes permisos para editar reportes.', 'error');
      return;
    }
    // Actualiza editData de forma inmediata
    const newEditData = { ...editData, [field]: value };
    setEditData(newEditData);
    setAutoSaveStatus('idle');

    // Limpiar el timer existente para autoguardado
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Configurar nuevo timer para autoguardado después de 1 segundo de inactividad
    autoSaveTimerRef.current = setTimeout(() => {
      if (editRowId) {
        // Asegurarse de pasar la nueva data actualizada por el estado.
        handleAutoSave(editRowId, newEditData); 
      }
    }, 1000); // 1 segundo para autoguardar
  }, [editData, editRowId, handleAutoSave, canEdit, showThemedToast]); // Incluir `handleAutoSave` aquí

  const handleSaveEdit = useCallback(async (reportId: string) => {
    // Verificar si el usuario tiene permiso para guardar cambios
    if (!canEdit) {
      showThemedToast('No tienes permisos para guardar cambios.', 'error');
      return;
    }
    // Asegúrate de limpiar el timer de autoguardado si existía uno antes de un guardado manual
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const currentReport = reportes.find(r => r._id === reportId);
    if (!currentReport) {
      showThemedToast('Reporte no encontrado.', 'error');
      setEditRowId(null);
      setEditData({});
      setAutoSaveStatus('idle');
      return;
    }
    
    // Obtener solo los campos que han sido modificados para enviar
    const updatedFields: Partial<Reporte> = {};
    let changesDetected = false;

    for (const key of Object.keys(editData) as (keyof Reporte)[]) {
        if (key === '_id' || key === 'timestamp') continue;

        if (key === 'departamento') {
            const currentDepartments = currentReport.departamento || [];
            const editedDepartments = Array.isArray(editData.departamento) ? editData.departamento.map(d => d.trim()).filter(Boolean) : [];
            if (!arraysEqual(currentDepartments, editedDepartments)) {
                updatedFields.departamento = editedDepartments;
                changesDetected = true;
            }
        } else if (key === 'asignadoA') {
            const currentAsignadoA = currentReport.asignadoA === '' ? undefined : currentReport.asignadoA;
            const editedAsignadoA = editData.asignadoA === '' ? undefined : editData.asignadoA;
            if (currentAsignadoA !== editedAsignadoA) {
                updatedFields.asignadoA = editedAsignadoA;
                changesDetected = true;
            }
        } else if (String(editData[key]) !== String(currentReport[key])) {
            updatedFields[key] = editData[key];
            changesDetected = true;
        }
    }

    if (!changesDetected) {
      showThemedToast('No se detectaron cambios para guardar.', 'info');
      setEditRowId(null);
      setEditData({});
      setAutoSaveStatus('idle');
      return;
    }

    try {
      showThemedToast('Guardando cambios manualmente...', 'info');
      
      const response = await api.patch(`${API_ENDPOINTS.REPORTES}/${reportId}`, updatedFields);
      showThemedToast('Reporte actualizado con éxito.', 'success');
      
      // Actualizar el reporte en el estado local inmediatamente
      if ((response.data as any).reporte) {
        // Si el servidor devuelve el reporte actualizado, usarlo
        setReportes(prev => prev.map(r => r._id === reportId ? { ...(response.data as any).reporte, _id: (response.data as any).reporte._id.toString() } : r));
      } else {
        // Fallback: actualizar con los campos enviados
        setReportes(prev => prev.map(r => r._id === reportId ? { ...r, ...updatedFields } : r));
      }
      
      // Forzar actualización de datos desde el servidor para sincronizar
      setTimeout(() => fetchReportes(false), 500);

    } catch (err: any) {
      console.error('Error al actualizar reporte manualmente:', err.response?.data?.message || err.message);
      
      if (err.response?.status === 403) {
        showThemedToast('No tienes permisos para guardar cambios. Por favor, inicia sesión nuevamente.', 'error');
      } else if (err.response?.status === 400) {
        showThemedToast(`Error de validación: ${err.response?.data?.message || 'Datos inválidos'}`, 'error');
      } else if (err.response?.status === 404) {
        showThemedToast('El reporte ya no existe. Recargando datos...', 'error');
        fetchReportes(); // Recargar datos si el reporte no existe
      } else {
        showThemedToast(`Error al guardar: ${err.response?.data?.message || err.message || 'Hubo un problema.'}`, 'error');
      }
    } finally {
      setEditRowId(null);
      setEditData({});
      setAutoSaveStatus('idle');
    }
  }, [reportes, canEdit, showThemedToast, editData]);

  const handleCancelEdit = useCallback(() => {
    if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
    }
    setEditRowId(null);
    setEditData({});
    setAutoSaveStatus('idle');
    showThemedToast('Edición cancelada.', 'info');
  }, [showThemedToast]);


  // Función para eliminar un reporte
  const handleDelete = useCallback(async (id: string) => {
    // Verificar si el usuario tiene permiso para eliminar
    if (!canEdit) {
      showThemedToast('No tienes permisos para eliminar reportes.', 'error');
      return;
    }
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar este reporte? Esta acción es irreversible.')) return;
    
    // Cancelar cualquier edición en curso si es el mismo reporte
    if (editRowId === id) {
      handleCancelEdit();
    }
    
    // Eliminación optimista: eliminar de la UI inmediatamente
    const originalReports = reportes;
    setReportes(prev => prev.filter(r => r._id !== id));
    showThemedToast('Eliminando reporte...', 'info');
    
    try {
      const response = await api.delete(`${API_ENDPOINTS.REPORTES}/${id}`);
      showThemedToast('Reporte eliminado correctamente.', 'success');
      console.log('Reporte eliminado:', response.data);
      
      // Forzar actualización de datos desde el servidor para sincronizar
      setTimeout(() => fetchReportes(false), 500);
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      
      if (err.response?.status === 403) {
        showThemedToast('No tienes permisos para eliminar reportes. Por favor, inicia sesión nuevamente.', 'error');
      } else if (err.response?.status === 400) {
        showThemedToast(`Error de validación: ${err.response?.data?.message || 'ID inválido'}`, 'error');
      } else if (err.response?.status === 404) {
        showThemedToast('El reporte ya no existe. Actualizando lista...', 'info');
        fetchReportes(); // Recargar datos para sincronizar
        return; // No hacer rollback si el reporte ya no existe
      } else {
        showThemedToast(`Error al eliminar: ${err.response?.data?.message || err.message || 'Error desconocido'}`, 'error');
      }
      
      // Rollback en caso de error (excepto 404)
      setReportes(originalReports);
    }
  }, [reportes, canEdit, showThemedToast, editRowId, handleCancelEdit, fetchReportes]);

  // Funciones para exportar datos
  const exportarCSV = useCallback(() => {
    const csv = Papa.unparse(reportesFiltrados.map(r => ({
      ID: r._id,
      Departamento: r.departamento.join(', '),
      Descripcion: r.descripcion,
      TipoProblema: r.tipoProblema,
      QuienReporta: r.quienReporta,
      Prioridad: r.prioridad,
      Estado: r.status,
      AsignadoA: r.asignadoA || 'N/A',
      FechaHora: new Date(r.timestamp).toLocaleString()
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reportes_sistemas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showThemedToast('Reportes exportados a CSV.', 'info');
  }, [reportesFiltrados, showThemedToast]);

  const exportarJSON = useCallback(() => {
    const json = JSON.stringify(reportesFiltrados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reportes_sistemas_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showThemedToast('Reportes exportados a JSON.', 'info');
  }, [reportesFiltrados, showThemedToast]);

  // Funciones para importar datos
  const importarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showThemedToast('Iniciando importación CSV...', 'info');
    setIsLoading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        const data = results.data;
        let successCount = 0;
        let failCount = 0;
        
        const reportsToUpload: Partial<Reporte>[] = data.map((r: any) => ({
          departamento: typeof r.Departamento === 'string' ? (r.Departamento as string).split(',').map((d: string) => d.trim()).filter(Boolean) : [],
          descripcion: r.Descripcion || '',
          tipoProblema: tiposProblema.includes(r.TipoProblema) ? r.TipoProblema : 'Otro',
          quienReporta: r.QuienReporta || 'Desconocido',
          prioridad: ['Baja', 'Media', 'Alta', 'Crítica'].includes(r.Prioridad) ? r.Prioridad : 'Baja',
          asignadoA: r.AsignadoA && INTEGRANTES.includes(r.AsignadoA) ? r.AsignadoA : getRandomAsignadoA(),
          status: ['Pendiente', 'En Proceso', 'Resuelto'].includes(r.Estado) ? r.Estado : 'Pendiente',
          timestamp: r.FechaHora ? new Date(r.FechaHora).toISOString() : new Date().toISOString()
        })).filter((r: Partial<Reporte>) => r.departamento && r.descripcion);

        // Subir reportes en paralelo
        const uploadPromises = reportsToUpload.map(async (rep) => {
          try {
            await api.post(API_ENDPOINTS.REPORTES, rep);
            successCount++;
          } catch (error) {
            console.error('Error uploading:', rep, error);
            failCount++;
          }
        });
        await Promise.all(uploadPromises);

        showThemedToast(`Importación CSV terminada. Éxitos: ${successCount}, Fallos: ${failCount}.`, successCount > 0 ? 'success' : 'error');
        fetchReportes(); // Recargar todos los reportes para asegurar consistencia
        setIsLoading(false);
        if (e.target) e.target.value = '';
      },
      error: (err) => {
        showThemedToast('Error al parsear CSV: ' + err.message, 'error');
        setIsLoading(false);
        if (e.target) e.target.value = '';
      }
    });
  };

  const importarJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showThemedToast('Iniciando importación JSON...', 'info');
    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('El archivo JSON debe contener un arreglo de reportes.');

      let successCount = 0;
      let failCount = 0;
      
      const reportsToUpload: Partial<Reporte>[] = data.map((r: any) => ({
        departamento: Array.isArray(r.departamento)
          ? r.departamento.map((d: string) => d.trim()).filter(Boolean)
          : typeof r.Departamento === 'string'
            ? (r.Departamento as string).split(',').map((d: string) => d.trim()).filter(Boolean)
            : [],
        descripcion: r.Descripcion || r.descripcion || '',
        tipoProblema: tiposProblema.includes(r.TipoProblema || r.tipoProblema) ? (r.TipoProblema || r.tipoProblema) : 'Otro',
        quienReporta: r.QuienReporta || r.quienReporta || 'Desconocido',
        prioridad: ['Baja', 'Media', 'Alta', 'Crítica'].includes(r.Prioridad || r.prioridad) ? (r.Prioridad || r.prioridad) : 'Baja',
        asignadoA: (r.AsignadoA && INTEGRANTES.includes(r.AsignadoA)) ? r.AsignadoA : (r.asignadoA && INTEGRANTES.includes(r.asignadoA) ? r.asignadoA : getRandomAsignadoA()),
        status: ['Pendiente', 'En Proceso', 'Resuelto'].includes(r.Estado || r.status) ? (r.Estado || r.status) : 'Pendiente',
        timestamp: r.FechaHora ? new Date(r.FechaHora).toISOString() : (r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString())
      })).filter((r: Partial<Reporte>) => r.departamento && r.descripcion);
      
      const uploadPromises = reportsToUpload.map(async (rep) => {
        try {
          await api.post(API_ENDPOINTS.REPORTES, rep);
          successCount++;
        } catch (error) {
          console.error('Error uploading:', rep, error);
          failCount++;
        }
      });
      await Promise.all(uploadPromises);


      showThemedToast(`Importación JSON terminada. Éxitos: ${successCount}, Fallos: ${failCount}.`, successCount > 0 ? 'success' : 'error');
      fetchReportes(); // Recargar todos los reportes para asegurar consistencia
    } catch (err: any) {
      showThemedToast('Error al importar JSON: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    // CAMBIO 1: Fondo general más sofisticado con burbujas y degradados. `overflow-hidden` esencial.
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200 p-4 sm:p-6 lg:p-8 font-inter antialiased relative overflow-hidden">
      {/* Formulario de creación de reportes */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`${glassCard} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Reporte</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departamento(s)</label>
                  <input
                    type="text"
                    value={(newReporte.departamento as string[] || []).join(', ')}
                    onChange={(e) => setNewReporte({...newReporte, departamento: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    className={glassInput}
                    placeholder="Ingrese departamentos separados por coma"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={newReporte.descripcion || ''}
                    onChange={(e) => setNewReporte({...newReporte, descripcion: e.target.value})}
                    className={glassInput}
                    placeholder="Descripción detallada del problema"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Problema</label>
                  <select
                    value={newReporte.tipoProblema || tiposProblema[0]}
                    onChange={(e) => setNewReporte({...newReporte, tipoProblema: e.target.value})}
                    className={glassSelect}
                  >
                    {tiposProblema.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reportado por</label>
                  <input
                    type="text"
                    value={newReporte.quienReporta || ''}
                    onChange={(e) => setNewReporte({...newReporte, quienReporta: e.target.value})}
                    className={glassInput}
                    placeholder="Nombre de quien reporta"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                    <select
                      value={newReporte.prioridad || 'Baja'}
                      onChange={(e) => setNewReporte({...newReporte, prioridad: e.target.value as Reporte['prioridad']})}
                      className={glassSelect}
                    >
                      {PRIORIDADES.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
                    <select
                      value={newReporte.asignadoA || ''}
                      onChange={(e) => setNewReporte({...newReporte, asignadoA: e.target.value})}
                      className={glassSelect}
                    >
                      <option value="">(Sin asignar)</option>
                      {INTEGRANTES.map((integrante) => (
                        <option key={integrante} value={integrante}>{integrante}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateReporte}
                  disabled={isLoading}
                  className={`${btnSuccess} px-4 py-2 rounded-lg text-white ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Creando...' : 'Crear Reporte'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Círculos de fondo animados (blobs) - Asegúrate que `animate-blob` está en tu tailwind.config.js */}
      <motion.div
        initial={{ x: -100, y: -100, scale: 0.5, opacity: 0 }}
        animate={{ x: [-100, 1000], y: [-100, 800], scale: [0.5, 1.2, 0.5], opacity: [0, 0.4, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" as const }}
        className="w-80 h-80 rounded-full bg-blue-300 absolute blur-2xl z-0"
      ></motion.div>
      <motion.div
        initial={{ x: 800, y: 100, scale: 0.5, opacity: 0 }}
        animate={{ x: [800, -200], y: [100, 900], scale: [0.5, 1.1, 0.5], opacity: [0, 0.4, 0] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" as const, delay: 5 }}
        className="w-96 h-96 rounded-full bg-purple-300 absolute blur-2xl z-0"
      ></motion.div>
      <motion.div
        initial={{ x: 400, y: 700, scale: 0.5, opacity: 0 }}
        animate={{ x: [400, 0], y: [700, -200], scale: [0.5, 1.3, 0.5], opacity: [0, 0.3, 0] }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" as const, delay: 10 }}
        className="w-72 h-72 rounded-full bg-pink-300 absolute blur-2xl z-0"
      ></motion.div>

      {/* Contenedor principal de contenido del dashboard (superpuesto a las burbujas) */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 py-4">
        {/* Encabezado Principal del Dashboard con logo, título y botones de acción global */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className={`${glassCard} flex flex-col lg:flex-row lg:items-center lg:justify-between border-blue-200 shadow-3xl bg-opacity-90 relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 via-white to-purple-50 opacity-30 z-0 rounded-[2.5rem]"></div>
          <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-6 mb-6 lg:mb-0 relative z-10 text-center sm:text-left">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-md opacity-70 animate-pulse"></div>
              <motion.img
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring" as const, stiffness: 200, damping: 20, delay: 0.2 }}
                src="/Montemorelos.jpg"
                alt="Escudo de Montemorelos"
                className="h-28 w-28 sm:h-32 sm:w-32 object-contain rounded-full shadow-2xl border-4 border-yellow-400 p-1.5 transform hover:scale-110 transition-transform duration-300 ring-4 ring-purple-300 ring-opacity-70 mx-auto sm:mx-0 mb-4 sm:mb-0 relative z-10"
              />
            </motion.div>
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-blue-900 via-indigo-700 to-purple-600 bg-clip-text text-transparent leading-tight drop-shadow-xl mb-1">
                Panel de Control
              </h1>
              <p className="text-lg sm:text-xl font-medium text-gray-700 mt-1 flex items-center justify-center sm:justify-start gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Monitoreo integral y gestión avanzada de reportes
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                <span className="text-sm font-semibold bg-blue-100 rounded-full px-4 py-2 inline-flex items-center gap-2 text-blue-800 shadow-md transition-all hover:bg-blue-200 hover:shadow-lg">
                  <Clock className="h-4 w-4" />
                  Horario: 8:00 am - 3:00 pm
                </span>
                <span className="text-sm font-semibold bg-green-100 rounded-full px-4 py-2 inline-flex items-center gap-2 text-green-800 shadow-md transition-all hover:bg-green-200 hover:shadow-lg">
                  <MapPin className="h-4 w-4" />
                  Presidencia Montemorelos
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 relative z-10 pt-4 lg:pt-0">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(true)}
              className={`${btnSuccess} flex items-center gap-3 px-8 py-3 rounded-2xl text-lg shadow-lg`}
              aria-label="Crear nuevo reporte"
            >
              <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
              Nuevo Reporte
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('reportes-table-section')?.scrollIntoView({ behavior: 'smooth' })}
              className={`${btnPrimary} flex items-center gap-3 px-8 py-3 rounded-2xl text-lg shadow-lg`}
              aria-label="Ir a la tabla de reportes"
            >
              <FileText className="h-6 w-6 transition-transform group-hover:rotate-6" />
              Ver Reportes
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchReportes(true)}
              className={`${btnSuccess} flex items-center gap-3 px-8 py-3 rounded-2xl text-lg shadow-lg`}
              aria-label="Actualizar datos del dashboard"
            >
              <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : 'transition-transform group-hover:rotate-180'}`} />
              Actualizar Datos
            </motion.button>
          </div>
        </motion.div>

        {/* KPIs (Key Performance Indicators) Sección de métricas clave mejorada */}
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
        >
            {[
              { label: 'Total Reportes', value: kpis.total, icon: FileText, iconColor: 'text-blue-600', hoverBg: 'bg-blue-100', bgColor: 'from-blue-50 to-blue-100' },
              { label: 'Pendientes', value: kpis.pendientes, icon: Clock, iconColor: 'text-red-600', hoverBg: 'bg-red-100', bgColor: 'from-red-50 to-red-100' },
              { label: 'En Proceso', value: kpis.enProceso, icon: TrendingUp, iconColor: 'text-orange-500', hoverBg: 'bg-orange-100', bgColor: 'from-orange-50 to-orange-100' },
              { label: 'Resueltos', value: kpis.resueltos, icon: CheckCircle, iconColor: 'text-green-600', hoverBg: 'bg-green-100', bgColor: 'from-green-50 to-green-100' },
              { label: 'Usuarios Únicos', value: kpis.usuarios, icon: User, iconColor: 'text-purple-700', hoverBg: 'bg-purple-100', bgColor: 'from-purple-50 to-purple-100' },
              { label: 'Tipos de Problema', value: kpis.tipos, icon: Settings, iconColor: 'text-yellow-600', hoverBg: 'bg-yellow-100', bgColor: 'from-yellow-50 to-yellow-100' }
            ].map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.08 }}
                  whileHover={{ scale: 1.05, y: -5, boxShadow: "0px 15px 35px rgba(0, 0, 0, 0.15)" }}
                  className={`bg-gradient-to-br ${kpi.bgColor} backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center text-center transition-all duration-300 transform-gpu cursor-pointer hover:${kpi.hoverBg} relative overflow-hidden group`}
                >
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="relative z-10">
                    <div className={`p-3 rounded-full bg-white/80 shadow-md mb-4 ${kpi.hoverBg.replace('bg', 'text').replace('100', '500')}`}>
                      <Icon className={`h-8 w-8 ${kpi.iconColor}`} />
                    </div>
                    <p className="text-gray-700 text-sm font-semibold mb-1">{kpi.label}</p>
                    <p className={`mt-1 text-4xl font-extrabold ${kpi.iconColor.replace('text', 'text')}`}>{kpi.value}</p>
                  </div>
                </motion.div>
              );
            })}
        </motion.div>

        {/* Sección de Filtros y Búsqueda mejorada */}
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className={`${glassCard} flex flex-col gap-6 border-blue-200 shadow-2xl bg-opacity-90 p-6 sm:p-8`}
        >
          <div className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
              <Filter className="h-6 w-6" />
            </div>
            Filtros y Búsqueda
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar reportes..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`${glassInput} pl-10 pr-4 w-full text-base`}
                aria-label="Campo de búsqueda de reportes"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className={`${glassSelect} pl-10 pr-10 w-full text-base`}
                aria-label="Filtrar reportes por rango de fechas"
              >
                {FILTROS_FECHA.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
                className={`${glassSelect} pl-10 pr-10 w-full text-base`}
                aria-label="Filtrar reportes por prioridad"
              >
                <option value="todos">Prioridad</option>
                {PRIORIDADES.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className={`${glassSelect} pl-10 pr-10 w-full text-base`}
                aria-label="Filtrar reportes por tipo de problema"
              >
                <option value="todos">Tipo de Problema</option>
                {tiposProblema.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filtroDepartamento}
                onChange={(e) => setFiltroDepartamento(e.target.value)}
                className={`${glassSelect} pl-10 pr-10 w-full text-base`}
                aria-label="Filtrar reportes por departamento"
              >
                <option value="todos">Departamento</option>
                {departamentosUnicos.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filtroQuienReporta}
                onChange={(e) => setFiltroQuienReporta(e.target.value)}
                className={`${glassSelect} pl-10 pr-10 w-full text-base`}
                aria-label="Filtrar reportes por persona que reporta"
              >
                <option value="todos">Reportado Por</option>
                {usuariosUnicos.map((usuario) => (
                  <option key={usuario} value={usuario}>{usuario}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filtroAsignadoA}
                onChange={(e) => setFiltroAsignadoA(e.target.value)}
                className={`${glassSelect} pl-10 pr-10 w-full text-base`}
                aria-label="Filtrar reportes por persona asignada"
              >
                <option value="todos">Asignado A</option>
                {INTEGRANTES.map((integrante) => (
                  <option key={integrante} value={integrante}>{integrante}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Sección de Gráficos mejorada */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          {/* Gráfico: Reportes por Departamento mejorado */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.7, delay: 0.8 }} 
            className={`${glassCard} hover:shadow-4xl transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
                  <Users className="h-6 w-6" />
                </div>
                Reportes por Departamento
              </h3>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Top 10
              </div>
            </div>
            {reportesPorDepartamento.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200">
                    <AlertTriangle className="w-16 h-16 mb-4 text-orange-400" />
                    <p className="text-center max-w-md">No hay datos de reportes por departamento para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={reportesPorDepartamento} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
                <CartesianGrid stroke="#e0e7ff" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} angle={-45} textAnchor="end" interval="preserveStartEnd" height={100} />
                <YAxis tick={{ fontSize: 12, fill: '#4B5563' }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid #c7d2fe',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                    backdropFilter: 'blur(8px)',
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                  itemStyle={{ color: '#4B5563' }}
                  formatter={(value) => [`${value} reportes`, "Cantidad"]}
                />
                <Bar 
                  dataKey="reportes" 
                  fill="url(#colorDepartamento)" 
                  radius={[10,10,0,0]}
                  animationDuration={1500}
                >
                  {reportesPorDepartamento.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`rgba(99, 102, 241, ${0.4 + (index / reportesPorDepartamento.length) * 0.6})`} 
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorDepartamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <Brush dataKey="name" height={30} stroke="#6366f1" y={295} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </motion.div>

          {/* Gráfico: Distribución por Prioridad - Mejorado */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.7, delay: 0.9 }} 
            className={`${glassCard} hover:shadow-4xl transition-all duration-300 border-purple-200`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg">
                  <PieChartIcon className="h-6 w-6" />
                </div>
                Distribución por Prioridad
              </h3>
              <div className="text-sm font-medium bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                Total: {reportesPorPrioridad.reduce((sum, item) => sum + item.value, 0)}
              </div>
            </div>
            {reportesPorPrioridad.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg bg-purple-50/50 rounded-2xl p-6 border-2 border-dashed border-purple-200">
                    <AlertTriangle className="w-16 h-16 mb-4 text-orange-400" />
                    <p className="text-center font-medium">No hay datos de prioridades para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <div className="bg-white/70 rounded-2xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={reportesPorPrioridad}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1000}
                    animationBegin={200}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {reportesPorPrioridad.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="#fff" 
                        strokeWidth={2} 
                        className="hover:opacity-80 transition-opacity duration-300"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #c7d2fe',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                      backdropFilter: 'blur(8px)',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                    itemStyle={{ color: '#4B5563' }}
                    formatter={(value: number, name: string) => [`${value} reportes`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    layout="horizontal"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          {/* Gráfico: Tipos de Problema Más Comunes - Mejorado */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.7, delay: 1.0 }} 
            className={`${glassCard} hover:shadow-4xl transition-all duration-300 border-green-200`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
                  <BarChart className="h-6 w-6" />
                </div>
                Tipos de Problema Más Comunes
              </h3>
              <div className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Top 10
              </div>
            </div>
            {reportesPorTipo.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg bg-green-50/50 rounded-2xl p-6 border-2 border-dashed border-green-200">
                    <AlertTriangle className="w-16 h-16 mb-4 text-orange-400" />
                    <p className="text-center font-medium">No hay datos de tipos de problema para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <div className="bg-white/70 rounded-2xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportesPorTipo} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
                  <CartesianGrid stroke="#bbf7d0" strokeDasharray="5 5" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#065F46' }} angle={-45} textAnchor="end" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12, fill: '#065F46' }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(16,185,129,0.1)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #86efac',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                      backdropFilter: 'blur(8px)',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#10B981' }}
                    itemStyle={{ color: '#4B5563' }}
                    formatter={(value) => [`${value} reportes`, "Cantidad"]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#colorTipo)" 
                    radius={[10,10,0,0]}
                    animationDuration={1500}
                  >
                    {reportesPorTipo.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`rgba(16, 185, 129, ${0.4 + (index / reportesPorTipo.length) * 0.6})`} 
                      />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="colorTipo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <Brush dataKey="name" height={30} stroke="#10B981" y={295} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </motion.div>

          {/* Gráfico: Reportes por Quién Reporta - Mejorado */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.7, delay: 1.1 }} 
            className={`${glassCard} hover:shadow-4xl transition-all duration-300 border-purple-200`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg">
                  <User className="h-6 w-6" />
                </div>
                Reportes por Quién Reporta
              </h3>
              <div className="text-sm font-medium bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                Top 10
              </div>
            </div>
            {reportesPorUsuario.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg bg-purple-50/50 rounded-2xl p-6 border-2 border-dashed border-purple-200">
                    <AlertTriangle className="w-16 h-16 mb-4 text-orange-400" />
                    <p className="text-center font-medium">No hay datos de quién reporta para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <div className="bg-white/70 rounded-2xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportesPorUsuario} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
                  <CartesianGrid stroke="#a78bfa" strokeDasharray="5 5" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7c3aed' }} angle={-45} textAnchor="end" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12, fill: '#7c3aed' }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(124,58,237,0.1)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #c7d2fe',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
                      backdropFilter: 'blur(8px)',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#8B5CF6' }}
                    itemStyle={{ color: '#4B5563' }}
                    formatter={(value) => [`${value} reportes`, "Cantidad"]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#colorUsuario)" 
                    radius={[10,10,0,0]}
                    animationDuration={1500}
                  >
                    {reportesPorUsuario.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`rgba(139, 92, 246, ${0.4 + (index / reportesPorUsuario.length) * 0.6})`} 
                      />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="colorUsuario" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <Brush dataKey="name" height={30} stroke="#8B5CF6" y={295} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          {/* Gráfico: Tendencia Mensual - Mejorado */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.7, delay: 1.2 }} 
            className={`${glassCard} hover:shadow-4xl transition-all duration-300 border-teal-200`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                Tendencia Mensual
              </h3>
              <div className="text-sm font-medium bg-teal-100 text-teal-800 px-3 py-1 rounded-full flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {filtroFecha === 'añoActual' ? `Año ${new Date().getFullYear()}` :
                  filtroFecha === 'añoPasado' ? `Año ${new Date().getFullYear() - 1}` :
                  filtroFecha.match(/^\d{4}$/) ? `Año ${filtroFecha}` : 'Todos los meses'
                }
              </div>
            </div>
            {tendencia.length === 0 || tendencia.every(d => d.reportes === 0 && d.resueltos === 0) ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg bg-teal-50/50 rounded-2xl p-6 border-2 border-dashed border-teal-200">
                    <AlertTriangle className="w-16 h-16 mb-4 text-orange-400" />
                    <p className="text-center font-medium">No hay datos de tendencia mensual para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <div className="bg-white/70 rounded-2xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={tendencia} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke="#a5f3fc" strokeDasharray="5 5" strokeOpacity={0.5} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#0F766E' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#0F766E' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #2DD4BF',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(45,212,191,0.3)',
                      backdropFilter: 'blur(8px)',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#0F766E' }}
                    itemStyle={{ color: '#4B5563' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="rect" />
                  <Area
                    type="monotone"
                    dataKey="reportes"
                    name="Reportes Creados"
                    stroke="url(#colorReportes)"
                    fill="url(#fillReportes)"
                    fillOpacity={0.6}
                    strokeWidth={3}
                    animationDuration={2000}
                  />
                  <Area
                    type="monotone"
                    dataKey="resueltos"
                    name="Reportes Resueltos"
                    stroke="url(#colorResueltos)"
                    fill="url(#fillResueltos)"
                    fillOpacity={0.6}
                    strokeWidth={3}
                    animationDuration={2000}
                  />
                  <defs>
                    <linearGradient id="colorReportes" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                    <linearGradient id="fillReportes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorResueltos" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                    <linearGradient id="fillResueltos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            )}
          </motion.div>

          {/* Gráfico: Reportes por Día de la Semana (solo Lunes a Viernes) - Mejorado */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.7, delay: 1.3 }} 
            className={`${glassCard} hover:shadow-4xl transition-all duration-300 border-indigo-200`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg">
                  <Clock className="h-6 w-6" />
                </div>
                Reportes por Día Hábil
              </h3>
              <div className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Lunes a Viernes
              </div>
            </div>
            {reportesPorDiaSemana.length === 0 || reportesPorDiaSemana.every(d => d.reportes === 0) ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg bg-indigo-50/50 rounded-2xl p-6 border-2 border-dashed border-indigo-200">
                    <AlertTriangle className="w-16 h-16 mb-4 text-orange-400" />
                    <p className="text-center font-medium">No hay datos de reportes por día hábil para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <div className="bg-white/70 rounded-2xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportesPorDiaSemana} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid stroke="#c7d2fe" strokeDasharray="5 5" strokeOpacity={0.5} />
                  <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#4338CA' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#4338CA' }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(67,56,202,0.1)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #818cf8',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(67,56,202,0.3)',
                      backdropFilter: 'blur(8px)',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#6366F1' }}
                    itemStyle={{ color: '#4B5563' }}
                    formatter={(value) => [`${value} reportes`, "Cantidad"]}
                  />
                  <Bar 
                    dataKey="reportes" 
                    fill="url(#colorDia)" 
                    radius={[10,10,0,0]}
                    animationDuration={1500}
                  >
                    {reportesPorDiaSemana.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`rgba(99, 102, 241, ${0.4 + (index / reportesPorDiaSemana.length) * 0.6})`} 
                      />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#818CF8" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <Brush dataKey="name" height={30} stroke="#6366F1" y={295} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </motion.div>
        </div>

        {/* Tabla de Reportes: Detalle y Acciones - Mejorada */}
        <motion.div
          id="reportes-table-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className={`${glassTable} mt-10 shadow-4xl border-blue-200 bg-opacity-90 relative hover:shadow-5xl transition-all duration-300`}
        >
          {/* Encabezado de la tabla y botones de Importar/Exportar - Mejorado */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 text-white p-6 rounded-t-[2.5rem] border-b-2 border-indigo-700 flex flex-col md:flex-row md:justify-between md:items-center gap-4 relative z-10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <FileText className="h-8 w-8 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-3xl font-extrabold drop-shadow-md">Detalle de Reportes</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-semibold text-blue-200 bg-white/10 rounded-full px-4 py-1 flex items-center gap-1">
                    <Database className="h-4 w-4" />
                    {reportesFiltrados.length} encontrados
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full">
            {/* Indicador de auto-guardado - Mejorado */}
            {editRowId && (
              <AnimatePresence mode="wait">
              <motion.div
                key="autosave-status"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg"
              >
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-300" />
                    <span className="text-blue-300 text-sm font-medium">Guardando cambios...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span className="text-green-300 text-sm font-medium">Cambios guardados</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-300" />
                    <span className="text-red-300 text-sm font-medium">Error al guardar</span>
                  </>
                )}
                 {autoSaveStatus === 'idle' && (Object.keys(editData).length > 0) && ( // Sólo mostrar si hay edición y está idle
                  <>
                    <Clock className="h-5 w-5 text-yellow-300" />
                    <span className="text-yellow-300 text-sm font-medium">Esperando cambios...</span>
                  </>
                )}
              </motion.div>
              </AnimatePresence>
            )}
            <div className="flex flex-wrap justify-center md:justify-end gap-3">
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={exportarCSV} 
                className={`${btnInfo} text-white flex items-center gap-2 text-base py-2.5 px-5 rounded-xl shadow-lg`} 
                aria-label="Exportar a CSV"
              >
                <DownloadCloud className="h-5 w-5" /> 
                <span>Exportar CSV</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={exportarJSON} 
                className={`${btnInfo} text-white flex items-center gap-2 text-base py-2.5 px-5 rounded-xl shadow-lg`} 
                aria-label="Exportar a JSON"
              >
                <DownloadCloud className="h-5 w-5" /> 
                <span>Exportar JSON</span>
              </motion.button>
              <label 
                className={`${btnWarning} flex items-center gap-2 text-base py-2.5 px-5 rounded-xl cursor-pointer shadow-lg transition-all hover:shadow-xl`} 
                aria-label="Importar desde CSV"
              >
                <Upload className="h-5 w-5" /> 
                <span>Importar CSV</span>
                <input type="file" accept=".csv" onChange={importarCSV} className="hidden" />
              </label>
              <label 
                className={`${btnWarning} flex items-center gap-2 text-base py-2.5 px-5 rounded-xl cursor-pointer shadow-lg transition-all hover:shadow-xl`} 
                aria-label="Importar desde JSON"
              >
                <Upload className="h-5 w-5" /> 
                <span>Importar JSON</span>
                <input type="file" accept=".json" onChange={importarJSON} className="hidden" />
              </label>
            </div>
          </div>
          </div>

          {/* Contenedor con scroll horizontal para la tabla - Mejorado */}
          <div className="overflow-x-auto custom-scrollbar rounded-b-[2.5rem] bg-white/30 backdrop-blur-sm">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Encabezado de la tabla con anchos fijos y sticky - Mejorado */}
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 sticky top-0 z-20 shadow-lg">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[120px] border-r border-indigo-800/30">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px] border-r border-indigo-800/30">Departamento(s)</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[300px] border-r border-indigo-800/30">Descripción</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px] border-r border-indigo-800/30">Tipo Problema</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px] border-r border-indigo-800/30">Reportado por</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[120px] border-r border-indigo-800/30">Prioridad</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[120px] border-r border-indigo-800/30">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[240px] border-r border-indigo-800/30">Asignado a</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px] border-r border-indigo-800/30">Fecha y Hora</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[100px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 divide-y divide-gray-100/50 backdrop-blur-sm">
                {/* Mensaje de carga o sin reportes - Mejorado */}
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-blue-600 font-semibold text-xl flex flex-col items-center justify-center bg-blue-50/30">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-30"></div>
                        <Loader2 className="animate-spin h-12 w-12 text-blue-500 relative z-10" />
                      </div>
                      <span className="text-lg">Cargando reportes...</span>
                    </td>
                  </tr>
                ) : currentReports.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-gray-500 font-semibold text-lg bg-gray-50/30 rounded-b-2xl">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                          <AlertTriangle className="h-10 w-10 text-gray-400" />
                        </div>
                        <span className="text-lg">No hay reportes para mostrar con los filtros aplicados.</span>
                        <span className="text-sm text-gray-400 mt-2">Prueba ajustando los filtros para ver resultados</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Mapeo de reportes filtrados a filas de la tabla
                  currentReports.map((r, idx) => (
                    <motion.tr
                      key={r._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className={
                        (idx % 2 === 0 ? 'bg-white/80 hover:bg-white/90' : 'bg-blue-50/70 hover:bg-blue-100/80') +
                        ' hover:shadow-md transition-all duration-300 transform-gpu backdrop-blur-sm ' +
                        (editRowId === r._id ? 'ring-2 ring-blue-400 ring-opacity-70 bg-blue-100/50 shadow-lg z-10' : '')
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-mono text-xs">
                            {r._id.substring(0, 2)}
                          </span>
                          <span className="text-blue-900 font-mono">{r._id.substring(0, 8)}...</span>
                        </div>
                      </td>
                      {/* Celdas editables con inputs/selects y lógica de click/blur para activar edición y guardar */}
                      <td className="px-6 py-4 text-sm">
                        {editRowId === r._id ? (
                            <input
                              type="text"
                              value={(editData.departamento as string[] || []).join(', ')}
                              onChange={(e) => handleEditChange('departamento', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              className={`${glassInput} text-sm w-full py-2.5 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4 shadow-sm transition-all`}
                              aria-label={`Departamento de reporte ${r._id.substring(0, 8)}`}
                              placeholder="Ingrese departamentos separados por coma"
                            />
                        ) : (
                            <div className="flex flex-wrap gap-1 cursor-pointer group" onClick={() => handleEditClick(r)}>
                              {r.departamento.map((dep, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors">
                                  {dep}
                                </span>
                              ))}
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-normal max-w-xs">
                        {editRowId === r._id ? (
                            <textarea
                              rows={2}
                              value={editData.descripcion || ''}
                              onChange={(e) => handleEditChange('descripcion', e.target.value)}
                              className={`${glassInput} text-sm w-full resize-y py-2.5 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4 shadow-sm transition-all duration-200`}
                              placeholder="Ingrese una descripción detallada..."
                              aria-label={`Descripción de reporte ${r._id.substring(0, 8)}`}
                              autoFocus
                            />
                        ) : (
                            <div className="group cursor-pointer" onClick={() => handleEditClick(r)}>
                              <p className="line-clamp-2 text-gray-700 group-hover:text-blue-600 transition-colors duration-200">{r.descripcion}</p>
                              <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center text-xs text-blue-500">
                                <Pencil className="h-3 w-3 mr-1" /> Haz clic para editar
                              </div>
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editRowId === r._id ? (
                            <select
                              value={editData.tipoProblema || ''}
                              onChange={(e) => handleEditChange('tipoProblema', e.target.value)}
                              className={`${glassSelect} text-sm w-full py-2.5 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4 shadow-sm transition-all`}
                              aria-label={`Tipo de problema de reporte ${r._id.substring(0, 8)}`}
                            >
                              {tiposProblema.map((tipo) => (<option key={tipo} value={tipo}>{tipo}</option>))}
                            </select>
                        ) : (
                            <div className="group cursor-pointer flex items-center" onClick={() => handleEditClick(r)}>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 group-hover:bg-indigo-200 transition-colors">
                                {r.tipoProblema}
                              </span>
                              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Pencil className="h-3 w-3 text-indigo-500" />
                              </div>
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editRowId === r._id ? (
                            <input
                              type="text"
                              value={editData.quienReporta || ''}
                              onChange={(e) => handleEditChange('quienReporta', e.target.value)}
                              className={`${glassInput} text-sm w-full py-2.5 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4 shadow-sm transition-all`}
                              aria-label={`Persona que reporta en reporte ${r._id.substring(0, 8)}`}
                              placeholder="Nombre de quien reporta"
                            />
                        ) : (
                            <div className="group cursor-pointer flex items-center" onClick={() => handleEditClick(r)}>
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                                  <User className="h-3 w-3 text-purple-600" />
                                </div>
                                <span className="text-gray-700 group-hover:text-purple-600 transition-colors">{r.quienReporta}</span>
                              </div>
                              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Pencil className="h-3 w-3 text-purple-500" />
                              </div>
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {editRowId === r._id ? (
                            <select
                              value={editData.prioridad || ''}
                              onChange={(e) => handleEditChange('prioridad', e.target.value as Reporte['prioridad'])}
                              className={`${glassSelect} text-sm w-full text-center py-2.5 px-3 font-bold focus:ring-blue-500 border-blue-300 focus:ring-4 shadow-sm transition-all`}
                              style={{ backgroundColor: PRIORIDADES.find(p => p.name === (editData.prioridad || r.prioridad))?.color || 'white', color: (editData.prioridad || r.prioridad) === 'Media' ? '#4B5563' : 'white' }}
                              aria-label={`Prioridad de reporte ${r._id.substring(0, 8)}`}
                            >
                              {PRIORIDADES.map((p) => (<option key={p.name} value={p.name} style={{ backgroundColor: p.color, color: p.name === 'Media' ? '#4B5563' : 'white' }}>{p.name}</option>))}
                            </select>
                        ) : (
                            <div className="flex justify-center">
                              <span 
                                className="cursor-pointer font-semibold inline-flex items-center px-3 py-1 rounded-full text-sm shadow-sm transition-all hover:shadow-md transform hover:scale-105" 
                                style={{ 
                                  color: PRIORIDADES.find(p => p.name === r.prioridad)?.name === 'Media' ? '#4B5563' : 'white', 
                                  backgroundColor: PRIORIDADES.find(p => p.name === r.prioridad)?.color,
                                }} 
                                onClick={() => handleEditClick(r)}
                              >
                                {r.prioridad}
                              </span>
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {editRowId === r._id ? (
                            <select
                              value={editData.status || ''}
                              onChange={(e) => handleEditChange('status', e.target.value as Reporte['status'])}
                              className={`${glassSelect} text-sm w-full text-center py-2.5 px-3 font-bold focus:ring-blue-500 border-blue-300 focus:ring-4 shadow-sm transition-all`}
                              style={{ backgroundColor: ESTADOS.find(s => s.name === (editData.status || r.status))?.color || 'white', color: 'white' }}
                              aria-label={`Estado de reporte ${r._id.substring(0, 8)}`}
                            >
                              {ESTADOS.map((s) => (<option key={s.name} value={s.name} style={{ backgroundColor: s.color, color: 'white' }}>{s.name}</option>))}
                            </select>
                        ) : (
                            <div className="flex justify-center">
                              <span 
                                className="cursor-pointer font-semibold inline-flex items-center px-3 py-1 rounded-full text-sm shadow-sm transition-all hover:shadow-md transform hover:scale-105" 
                                style={{ 
                                  color: 'white', 
                                  backgroundColor: ESTADOS.find(s => s.name === r.status)?.color,
                                }} 
                                onClick={() => handleEditClick(r)}
                              >
                                {r.status}
                              </span>
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editRowId === r._id ? (
                            <select
                              value={editData.asignadoA === undefined ? "" : editData.asignadoA} // Convertir undefined a "" para el select
                              onChange={(e) => handleEditChange('asignadoA', e.target.value === "" ? undefined : e.target.value)} // Convertir "" de vuelta a undefined
                              className={`${glassSelect} text-sm w-full py-2.5 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4 shadow-sm transition-all`}
                              aria-label={`Asignado a en reporte ${r._id.substring(0, 8)}`}
                            >
                              <option value="">(Sin asignar)</option> {/* Opción para no asignar */}
                              {INTEGRANTES.map((integrante) => (<option key={integrante} value={integrante}>{integrante}</option>))}
                            </select>
                        ) : (
                            <div className="group cursor-pointer flex items-center" onClick={() => handleEditClick(r)}>
                              {r.asignadoA ? (
                                <>
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                                      <User className="h-3 w-3 text-green-600" />
                                    </div>
                                    <span className="text-gray-700 group-hover:text-green-600 transition-colors">{r.asignadoA}</span>
                                  </div>
                                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Pencil className="h-3 w-3 text-green-500" />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                                      <User className="h-3 w-3 text-gray-400" />
                                    </div>
                                    <span className="text-gray-400 group-hover:text-gray-600 transition-colors">(Sin asignar)</span>
                                  </div>
                                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Pencil className="h-3 w-3 text-gray-400" />
                                  </div>
                                </>
                              )}
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Fecha</div>
                            <div className="font-medium">{new Date(r.timestamp).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Hora</div>
                            <div className="font-medium">{new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex gap-2 justify-center items-center">
                            {editRowId === r._id ? (
                                <>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }}
                                  onClick={() => handleSaveEdit(r._id)}
                                  className="p-2.5 rounded-full border border-green-300 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 shadow-md transition-all hover:shadow-lg"
                                  title="Guardar cambios manualmente"
                                  aria-label={`Guardar cambios para reporte ${r._id.substring(0, 8)}`}
                                >
                                    <Save className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }}
                                  onClick={handleCancelEdit}
                                  className="p-2.5 rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800 shadow-md transition-all hover:shadow-lg"
                                  title="Cancelar edición"
                                  aria-label={`Cancelar edición para reporte ${r._id.substring(0, 8)}`}
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                                </>
                            ) : (
                                <>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.15, rotate: 15, y: -2 }} whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDelete(r._id)}
                                  className="p-2.5 rounded-full border border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 shadow-md transition-all hover:shadow-lg group"
                                  title="Eliminar reporte"
                                  aria-label={`Eliminar reporte ${r._id.substring(0, 8)}`}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }}
                                  onClick={() => handleEditClick(r)}
                                  className="p-2.5 rounded-full border border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 shadow-md transition-all hover:shadow-lg group"
                                  title="Editar reporte (se guardará automáticamente)"
                                  aria-label={`Editar reporte ${r._id.substring(0, 8)}`}
                                >
                                    <Pencil className="w-5 h-5" />
                                </motion.button>
                                </>
                            )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación - Mejorado */}
          {totalPages > 1 && (
            <div className="py-5 px-6 bg-gradient-to-r from-white/90 to-blue-50/90 border-t border-gray-200 flex justify-between items-center text-gray-700 font-semibold text-sm rounded-b-[2.5rem] backdrop-blur-sm shadow-inner">
              <motion.button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-5 h-5" /> 
                <span>Anterior</span>
              </motion.button>
              
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center justify-center px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <span className="text-gray-700">Página </span>
                  <span className="mx-1 px-2 py-0.5 bg-blue-500 text-white rounded-md min-w-[2rem] text-center">{currentPage}</span>
                  <span className="text-gray-700"> de {totalPages}</span>
                </div>
                
                {/* Paginación simplificada para móviles */}
                <div className="sm:hidden flex items-center justify-center px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <span className="text-gray-700">{currentPage}/{totalPages}</span>
                </div>
              </div>
              
              <motion.button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                aria-label="Página siguiente"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
