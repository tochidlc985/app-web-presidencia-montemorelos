import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../services/apiConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart, Legend, Brush
} from 'recharts';
import {
  Search, CheckCircle, Clock, TrendingUp, Users, FileText, RefreshCw, PieChart as PieChartIcon, Trash2, User, AlertTriangle, Settings,
  Loader2, DownloadCloud, Upload, Filter, ChevronLeft, ChevronRight,
  Pencil, Save, X // X es usado para el botón de cancelar en la edición de tabla
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
    if (!a || !b) return a === b;
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
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('todos');
  const [filtroQuienReporta, setFiltroQuienReporta] = useState<string>('todos');
  const [filtroAsignadoA, setFiltroAsignadoA] = useState<string>('todos');
  const [feedback, setFeedback] = useState('');
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Reporte>>({});

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

  // Fetch reportes
  const fetchReportes = useCallback(async () => {
    setIsLoading(true);
    setFeedback('');
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const res = await api.get(API_ENDPOINTS.REPORTES, config);
      const data = res.data;

      // Verificar si data es un array, si no lo es, intentar obtener la propiedad correcta
      const dataArray = Array.isArray(data) ? data : ((data as any).reportes || (data as any).data || []);

      const adaptados: Reporte[] = (dataArray as any[]).map((r: any) => {
        const assignedTo = r.asignadoA && INTEGRANTES.includes(r.asignadoA) ? r.asignadoA : getRandomAsignadoA();

        return {
          _id: r._id || '',
          departamento: Array.isArray(r.departamento)
            ? r.departamento
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
      }).filter((r: Reporte) => r._id);

      setReportes(adaptados);
    } catch (e: any) {
      console.error('Error al cargar reportes:', e.response?.data?.message || e.message);
      setFeedback(`Error: ${e.response?.data?.message || 'No se pudieron cargar los reportes.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [getRandomAsignadoA]); // Dependencia getRandomAsignadoA para evitar eslint warnings si no la usaras directamente.

  useEffect(() => {
    fetchReportes();
    const interval = setInterval(fetchReportes, 90000);
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
    let yearToFilter = new Date().getFullYear();
    if (filtroFecha === 'añoPasado') yearToFilter = new Date().getFullYear() - 1;
    else if (filtroFecha.match(/^\d{4}$/)) yearToFilter = parseInt(filtroFecha, 10);
  
    for (let i = 0; i < 12; i++) dataMap[i] = { mes: MESES[i], reportes: 0, resueltos: 0 };
  
    reportesFiltrados.forEach(r => {
      const fecha = new Date(r.timestamp);
      if (fecha.getFullYear() === yearToFilter) {
        const mes = fecha.getMonth();
        if (dataMap[mes]) { dataMap[mes].reportes += 1; if (r.status === 'Resuelto') dataMap[mes].resueltos += 1; }
      }
    });
    return Object.values(dataMap);
  }, [reportesFiltrados, filtroFecha]);

  const reportesPorDiaSemana = useMemo(() => {
    const diasMap: Record<string, number> = { Lunes: 0, Martes: 0, 'Miércoles': 0, Jueves: 0, Viernes: 0 };
    reportesFiltrados.forEach(r => {
      const fecha = new Date(r.timestamp);
      const diaIdx = fecha.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado
      if (diaIdx >= 1 && diaIdx <= 5) {
        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        diasMap[dias[diaIdx - 1]] = (diasMap[dias[diaIdx - 1]] || 0) + 1;
      }
    });
    return Object.keys(diasMap).map(dia => ({ dia, reportes: diasMap[dia] }));
  }, [reportesFiltrados]);

  // Estado para auto-guardado
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Manejador de edición en línea
  const handleEditClick = useCallback((report: Reporte) => {
    setEditRowId(report._id);
    setEditData({ ...report }); // Clonar el objeto reporte para edición
    setAutoSaveStatus('idle');
  }, []);

  const handleEditChange = useCallback((field: keyof Reporte, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));

    // Configurar auto-guardado después de 2 segundos de inactividad
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    setAutoSaveStatus('idle');
    const timer = setTimeout(() => {
      if (editRowId) {
        handleAutoSave(editRowId);
      }
    }, 2000);

    setAutoSaveTimer(timer);
  }, [autoSaveTimer, editRowId]);

  // Función para auto-guardar cambios
  const handleAutoSave = useCallback(async (reportId: string) => {
    const currentReport = reportes.find(r => r._id === reportId);
    if (!currentReport) {
      setAutoSaveStatus('error');
      return;
    }

    // Obtener solo los campos que han sido modificados para enviar
    const updatedFields: Partial<Reporte> = {};
    Object.keys(editData).forEach(key => {
        const field = key as keyof Reporte;
        if (field === 'departamento') {
          // Special handling for array field 'departamento'
          const currentDepArray = (currentReport.departamento || []).sort();
          const editedDepArray = (editData.departamento as string[] || []).sort();
          if (!arraysEqual(currentDepArray, editedDepArray)) {
              updatedFields.departamento = editedDepArray; // Set the sorted array for update
          }
        } else if (String(editData[field]) !== String(currentReport[field])) { // General comparison for other fields
            updatedFields[field] = editData[field];
        }
    });

    if (Object.keys(updatedFields).length === 0) {
      setAutoSaveStatus('idle');
      return;
    }

    try {
      setAutoSaveStatus('saving');
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // Convertir `departamento` a un array de strings si es necesario (cuando viene de input)
      if (updatedFields.departamento !== undefined && typeof updatedFields.departamento === 'string') {
        updatedFields.departamento = (updatedFields.departamento as string).split(',').map(d => d.trim()).filter(Boolean);
      } else if (Array.isArray(updatedFields.departamento)) {
        // Asegurar que si ya es un array, se limpia y se hace trim a cada elemento
        updatedFields.departamento = (updatedFields.departamento as string[]).map(d => d.trim()).filter(Boolean);
      }

      // AsignadoA a undefined si es vacío
      if (updatedFields.asignadoA === '') {
        updatedFields.asignadoA = undefined;
      }

      await api.patch(`${API_ENDPOINTS.REPORTES}/${reportId}`, updatedFields, config);
      setAutoSaveStatus('saved');

      // Actualizar el reporte en el estado local
      setReportes(prev => prev.map(r => r._id === reportId ? { ...r, ...updatedFields } : r));

      // Después de 3 segundos, volver el estado a idle
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Error al auto-guardar reporte:', err);
      console.error('Respuesta del servidor:', err.response);
      setAutoSaveStatus('error');
    }
  }, [reportes, editData]);

  const handleSaveEdit = useCallback(async (reportId: string) => {
    const currentReport = reportes.find(r => r._id === reportId);
    if (!currentReport) {
      showThemedToast('Reporte no encontrado.', 'error');
      setEditRowId(null);
      setEditData({});
      return;
    }
    
    // Obtener solo los campos que han sido modificados para enviar
    const updatedFields: Partial<Reporte> = {};
    Object.keys(editData).forEach(key => {
        const field = key as keyof Reporte;
        if (field === 'departamento') {
          // Special handling for array field 'departamento'
          const currentDepArray = (currentReport.departamento || []).sort();
          const editedDepArray = (editData.departamento as string[] || []).sort();
          if (!arraysEqual(currentDepArray, editedDepArray)) {
              updatedFields.departamento = editedDepArray; // Set the sorted array for update
          }
        } else if (String(editData[field]) !== String(currentReport[field])) { // General comparison for other fields
            updatedFields[field] = editData[field];
        }
    });

    if (Object.keys(updatedFields).length === 0) {
      showThemedToast('No se detectaron cambios.', 'info');
      setEditRowId(null);
      setEditData({});
      return;
    }

    try {
      showThemedToast('Guardando cambios...', 'info');
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // Convertir `departamento` a un array de strings si es necesario (cuando viene de input)
      if (updatedFields.departamento !== undefined && typeof updatedFields.departamento === 'string') {
        updatedFields.departamento = (updatedFields.departamento as string).split(',').map(d => d.trim()).filter(Boolean);
      } else if (Array.isArray(updatedFields.departamento)) {
        // Asegurar que si ya es un array, se limpia y se hace trim a cada elemento
        updatedFields.departamento = (updatedFields.departamento as string[]).map(d => d.trim()).filter(Boolean);
      }

      // AsignadoA a undefined si es vacío
      if (updatedFields.asignadoA === '') {
        updatedFields.asignadoA = undefined;
      }
      
      await api.patch(`${API_ENDPOINTS.REPORTES}/${reportId}`, updatedFields, config);
      showThemedToast('Reporte actualizado con éxito.', 'success');
      
      setReportes(prev => prev.map(r => r._id === reportId ? { ...r, ...updatedFields } : r));

    } catch (err: any) {
      console.error('Error al actualizar reporte:', err);
      console.error('Respuesta del servidor:', err.response);
      showThemedToast(`Error al guardar: ${err.response?.data?.message || err.message || 'Hubo un problema.'}`, 'error');
    } finally {
      setEditRowId(null);
      setEditData({});
    }
  }, [reportes, showThemedToast, editData]);

  const handleCancelEdit = useCallback(() => {
    setEditRowId(null);
    setEditData({});
    showThemedToast('Edición cancelada.', 'info');
  }, [showThemedToast]);


  // Función para eliminar un reporte
  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este reporte? Esta acción es irreversible.')) return;
    showThemedToast('Eliminando reporte...', 'info');
    setIsLoading(true);
    
    const originalReports = reportes;
    setReportes(prev => prev.filter(r => r._id !== id));
    
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await api.delete(`${API_ENDPOINTS.REPORTES}/${id}`, config);
      showThemedToast('Reporte eliminado correctamente.', 'success');
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      showThemedToast(err.response?.data?.message || err.message || 'Error al eliminar el reporte.', 'error');
      setReportes(originalReports);
    } finally {
      setIsLoading(false);
    }
  }, [reportes, showThemedToast]);

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
          tipoProblema: r.TipoProblema || 'Otro',
          quienReporta: r.QuienReporta || 'Desconocido',
          prioridad: ['Baja', 'Media', 'Alta', 'Crítica'].includes(r.Prioridad) ? r.Prioridad : 'Baja',
          asignadoA: r.AsignadoA && INTEGRANTES.includes(r.AsignadoA) ? r.AsignadoA : INTEGRANTES[0],
          status: ['Pendiente', 'En Proceso', 'Resuelto'].includes(r.Estado) ? r.Estado : 'Pendiente',
          timestamp: r.FechaHora ? new Date(r.FechaHora).toISOString() : new Date().toISOString()
        })).filter((r: Partial<Reporte>) => r.departamento && r.descripcion);

        for (const rep of reportsToUpload) {
          try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            await api.post(API_ENDPOINTS.REPORTES, rep, config);
            successCount++;
          } catch (error) {
            console.error('Error uploading:', rep, error);
            failCount++;
          }
        }
        showThemedToast(`Importación CSV terminada. Éxitos: ${successCount}, Fallos: ${failCount}.`, successCount > 0 ? 'success' : 'error');
        fetchReportes();
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
        departamento: typeof r.Departamento === 'string'
          ? (r.Departamento as string).split(',').map((d: string) => d.trim()).filter(Boolean)
          : Array.isArray(r.departamento) ? r.departamento : [],
        descripcion: r.Descripcion || r.descripcion || '',
        tipoProblema: r.TipoProblema || r.tipoProblema || 'Otro',
        quienReporta: r.QuienReporta || r.quienReporta || 'Desconocido',
        prioridad: ['Baja', 'Media', 'Alta', 'Crítica'].includes(r.Prioridad || r.prioridad) ? (r.Prioridad || r.prioridad) : 'Baja',
        asignadoA: (r.AsignadoA && INTEGRANTES.includes(r.AsignadoA)) ? r.AsignadoA : INTEGRANTES[0],
        status: ['Pendiente', 'En Proceso', 'Resuelto'].includes(r.Estado || r.status) ? (r.Estado || r.status) : 'Pendiente',
        timestamp: r.FechaHora ? new Date(r.FechaHora).toISOString() : (r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString())
      })).filter((r: Partial<Reporte>) => r.departamento && r.descripcion);

      for (const rep of reportsToUpload) {
        try {
          const token = localStorage.getItem('token');
          const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
          await api.post('/api/reportes', rep, config);
          successCount++;
        } catch (error) {
          console.error('Error uploading:', rep, error);
          failCount++;
        }
      }
      showThemedToast(`Importación JSON terminada. Éxitos: ${successCount}, Fallos: ${failCount}.`, successCount > 0 ? 'success' : 'error');
      fetchReportes();
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
        {/* Notificación de Feedback: se muestra en la parte superior central */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -50, x: '-50%' }}
              transition={{ duration: 0.3, type: 'spring' as const, damping: 10, stiffness: 100 }}
              className="fixed top-8 left-1/2 z-50 bg-green-500 text-white rounded-full shadow-xl px-6 py-3 flex items-center gap-3 max-w-md w-full"
            >
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold text-lg">{feedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Encabezado Principal del Dashboard con logo, título y botones de acción global */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className={`${glassCard} flex flex-col lg:flex-row lg:items-center lg:justify-between border-blue-200 shadow-3xl bg-opacity-90 relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 via-white to-purple-50 opacity-30 z-0 rounded-[2.5rem]"></div>
          <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-6 mb-6 lg:mb-0 relative z-10 text-center sm:text-left">
            <motion.img
              initial={{ scale: 0.8, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring" as const, stiffness: 200, damping: 20, delay: 0.2 }}
              src="/Montemorelos.jpg"
              alt="Escudo de Montemorelos"
              className="h-24 w-24 sm:h-28 sm:w-28 object-contain rounded-full shadow-2xl border-4 border-yellow-400 p-1.5 transform hover:scale-110 transition-transform duration-300 ring-4 ring-purple-300 ring-opacity-70 mx-auto sm:mx-0 mb-4 sm:mb-0"
            />
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-blue-900 via-indigo-700 to-purple-600 bg-clip-text text-transparent leading-tight drop-shadow-xl mb-1">
                Panel de Control
              </h1>
              <p className="text-lg sm:text-xl font-medium text-gray-700 mt-2">
                Monitoreo integral y gestión avanzada de reportes.
              </p>
              <span className="mt-3 text-sm font-semibold bg-blue-100 rounded-full px-4 py-2 inline-block text-blue-800 shadow-md">
                Horario de atención: Lunes a viernes de 8:00 am a 3:00 pm
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 relative z-10 pt-4 lg:pt-0">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('reportes-table-section')?.scrollIntoView({ behavior: 'smooth' })}
              className={`${btnPrimary} flex items-center gap-3 px-8 py-3 rounded-2xl text-lg`}
            >
              <FileText className="h-6 w-6 transition-transform group-hover:rotate-6" />
              Ver Reportes
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchReportes}
              className={`${btnSuccess} flex items-center gap-3 px-8 py-3 rounded-2xl text-lg`}
            >
              <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : 'transition-transform group-hover:rotate-6'}`} />
              Actualizar Datos
            </motion.button>
          </div>
        </motion.div>

        {/* KPIs (Key Performance Indicators) Sección de métricas clave */}
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
        >
            {[
              { label: 'Total Reportes', value: kpis.total, icon: FileText, iconColor: 'text-blue-600', hoverBg: 'bg-blue-100' },
              { label: 'Pendientes', value: kpis.pendientes, icon: Clock, iconColor: 'text-red-600', hoverBg: 'bg-red-100' },
              { label: 'En Proceso', value: kpis.enProceso, icon: TrendingUp, iconColor: 'text-orange-500', hoverBg: 'bg-orange-100' },
              { label: 'Resueltos', value: kpis.resueltos, icon: CheckCircle, iconColor: 'text-green-600', hoverBg: 'bg-green-100' },
              { label: 'Usuarios Únicos', value: kpis.usuarios, icon: User, iconColor: 'text-purple-700', hoverBg: 'bg-purple-100' },
              { label: 'Tipos de Problema', value: kpis.tipos, icon: Settings, iconColor: 'text-yellow-600', hoverBg: 'bg-yellow-100' }
            ].map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.08 }}
                  whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)" }}
                  className={`bg-white/85 backdrop-blur-md rounded-2xl shadow-lg border border-gray-300 p-6 flex flex-col items-center justify-center text-center transition-transform duration-300 transform-gpu cursor-pointer hover:${kpi.hoverBg}`}
                >
                  <Icon className={`h-12 w-12 mb-3 drop-shadow-md ${kpi.iconColor}`} />
                  <p className="text-gray-700 text-sm font-semibold">{kpi.label}</p>
                  <p className={`mt-2 text-4xl font-extrabold ${kpi.iconColor.replace('text', 'text')}`}>{kpi.value}</p>
                </motion.div>
              );
            })}
        </motion.div>

        {/* Sección de Filtros y Búsqueda */}
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className={`${glassCard} flex flex-wrap items-center justify-between gap-4 md:gap-6 border-blue-200 shadow-2xl bg-opacity-90 p-6 sm:p-8`}
        >
          <div className="flex items-center gap-3 text-lg font-bold text-gray-800 flex-shrink-0 mb-2 md:mb-0">
            <Filter className="h-6 w-6 text-indigo-600" /> Filtros:
          </div>
          <div className="flex flex-wrap items-center gap-4 flex-grow justify-center md:justify-start">
            <div className="relative flex-grow max-w-[400px] min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar (ID, Dept, Desc, Asignado...)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`${glassInput} pl-10 pr-4 w-full text-base`}
                aria-label="Campo de búsqueda de reportes"
              />
            </div>
            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className={`${glassSelect} min-w-[160px] text-base`}
              aria-label="Filtrar reportes por rango de fechas"
            >
              {FILTROS_FECHA.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className={`${glassSelect} min-w-[160px] text-base`}
              aria-label="Filtrar reportes por prioridad"
            >
              <option value="todos">Prioridad</option>
              {PRIORIDADES.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className={`${glassSelect} min-w-[160px] text-base`}
              aria-label="Filtrar reportes por tipo de problema"
            >
              <option value="todos">Tipo de Problema</option>
              {tiposProblema.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className={`${glassSelect} min-w-[160px] text-base`}
              aria-label="Filtrar reportes por departamento"
            >
              <option value="todos">Departamento</option>
              {departamentosUnicos.map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
            <select
              value={filtroQuienReporta}
              onChange={(e) => setFiltroQuienReporta(e.target.value)}
              className={`${glassSelect} min-w-[160px] text-base`}
              aria-label="Filtrar reportes por persona que reporta"
            >
              <option value="todos">Reportado Por</option>
              {usuariosUnicos.map((usuario) => (
                <option key={usuario} value={usuario}>{usuario}</option>
              ))}
            </select>
            <select
              value={filtroAsignadoA}
              onChange={(e) => setFiltroAsignadoA(e.target.value)}
              className={`${glassSelect} min-w-[160px] text-base`}
              aria-label="Filtrar reportes por persona asignada"
            >
              <option value="todos">Asignado A</option>
              {INTEGRANTES.map((integrante) => (
                <option key={integrante} value={integrante}>{integrante}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Sección de Gráficos (3 filas, 2 columnas cada una) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          {/* Gráfico: Reportes por Departamento */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.8 }} className={glassCard}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Users className="h-7 w-7 text-blue-600 drop-shadow-sm" />
              Reportes por Departamento
            </h3>
            {reportesPorDepartamento.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg">
                    <AlertTriangle className="w-12 h-12 mb-4 text-orange-400" />
                    <p className="text-center">No hay datos de reportes por departamento para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={reportesPorDepartamento} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid stroke="#e0e7ff" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5563' }} angle={-45} textAnchor="end" interval={0} height={100} />
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
                />
                <Bar dataKey="reportes" fill="#6366f1" radius={[10,10,0,0]} />
                <Brush dataKey="name" height={30} stroke="#6366f1" y={295} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </motion.div>

          {/* Gráfico: Distribución por Prioridad */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.9 }} className={glassCard}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <PieChartIcon className="h-7 w-7 text-pink-600 drop-shadow-sm" />
              Distribución por Prioridad
            </h3>
            {reportesPorPrioridad.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg">
                    <AlertTriangle className="w-12 h-12 mb-4 text-orange-400" />
                    <p className="text-center">No hay datos de prioridades para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={reportesPorPrioridad}
                  cx="50%" cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={800}
                >
                  {reportesPorPrioridad.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
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
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          {/* Gráfico: Tipos de Problema Más Comunes */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 1.0 }} className={glassCard}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <BarChart className="h-7 w-7 text-green-600 drop-shadow-sm" />
              Tipos de Problema Más Comunes
            </h3>
            {reportesPorTipo.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg">
                    <AlertTriangle className="w-12 h-12 mb-4 text-orange-400" />
                    <p className="text-center">No hay datos de tipos de problema para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={reportesPorTipo} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid stroke="#bbf7d0" strokeDasharray="5 5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#065F46' }} angle={-45} textAnchor="end" interval={0} />
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
                />
                <Bar dataKey="value" fill="#10B981" radius={[10,10,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </motion.div>

          {/* Gráfico: Reportes por Quién Reporta */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 1.1 }} className={glassCard}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <User className="h-7 w-7 text-purple-600 drop-shadow-sm" />
              Reportes por Quién Reporta
            </h3>
            {reportesPorUsuario.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg">
                    <AlertTriangle className="w-12 h-12 mb-4 text-orange-400" />
                    <p className="text-center">No hay datos de quién reporta para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={reportesPorUsuario} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid stroke="#a78bfa" strokeDasharray="5 5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7c3aed' }} angle={-45} textAnchor="end" interval={0} />
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
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[10,10,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          {/* Gráfico: Tendencia Mensual */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 1.2 }} className={glassCard}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <TrendingUp className="h-7 w-7 text-teal-600 drop-shadow-sm" />
              Tendencia Mensual
              <span className="text-base text-gray-500 ml-auto font-medium">
                Año {filtroFecha === 'añoActual' ? new Date().getFullYear() :
                  filtroFecha === 'añoPasado' ? (new Date().getFullYear() - 1) :
                  filtroFecha.match(/^\d{4}$/) ? filtroFecha : new Date().getFullYear()
                }
              </span>
            </h3>
            {tendencia.length === 0 || tendencia.every(d => d.reportes === 0 && d.resueltos === 0) ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg">
                    <AlertTriangle className="w-12 h-12 mb-4 text-orange-400" />
                    <p className="text-center">No hay datos de tendencia mensual para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={tendencia} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="#a5f3fc" strokeDasharray="5 5" />
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
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="resueltos"
                  name="Reportes Resueltos"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </motion.div>

          {/* Gráfico: Reportes por Día de la Semana (solo Lunes a Viernes) */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 1.3 }} className={glassCard}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Clock className="h-7 w-7 text-indigo-600 drop-shadow-sm" />
              Reportes por Día Hábil
            </h3>
            {reportesPorDiaSemana.length === 0 || reportesPorDiaSemana.every(d => d.reportes === 0) ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-lg">
                    <AlertTriangle className="w-12 h-12 mb-4 text-orange-400" />
                    <p className="text-center">No hay datos de reportes por día hábil para mostrar con los filtros aplicados.</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={reportesPorDiaSemana} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid stroke="#c7d2fe" strokeDasharray="5 5" />
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
                />
                <Bar dataKey="reportes" fill="#6366f1" radius={[10,10,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Tabla de Reportes: Detalle y Acciones */}
        <motion.div
          id="reportes-table-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className={`${glassTable} mt-10 shadow-3xl border-blue-200 bg-opacity-90 relative`}
        >
          {/* Encabezado de la tabla y botones de Importar/Exportar */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-t-[2.5rem] border-b-2 border-indigo-700 flex flex-col md:flex-row md:justify-between md:items-center gap-4 relative z-10">
            <h3 className="text-3xl font-extrabold flex items-center gap-3 drop-shadow-md">
              <FileText className="h-8 w-8 text-yellow-300" />
              Detalle de Reportes
            </h3>
            <div className="flex flex-wrap justify-between md:justify-end gap-3 w-full">
            {/* Indicador de auto-guardado */}
            {editRowId && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                    <span className="text-blue-300 text-sm font-medium">Guardando...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-300" />
                    <span className="text-green-300 text-sm font-medium">Guardado</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-300" />
                    <span className="text-red-300 text-sm font-medium">Error al guardar</span>
                  </>
                )}
              </div>
            )}
            <div className="flex flex-wrap justify-center md:justify-end gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportarCSV} className={`${btnInfo} text-white flex items-center gap-2 text-base py-2.5 px-5 rounded-xl`}>
                <DownloadCloud className="h-5 w-5" /> CSV
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportarJSON} className={`${btnInfo} text-white flex items-center gap-2 text-base py-2.5 px-5 rounded-xl`}>
                <DownloadCloud className="h-5 w-5" /> JSON
              </motion.button>
              <label className={`${btnWarning} flex items-center gap-2 text-base py-2.5 px-5 rounded-xl cursor-pointer`}>
                <Upload className="h-5 w-5" /> CSV
                <input type="file" accept=".csv" onChange={importarCSV} className="hidden" />
              </label>
              <label className={`${btnWarning} flex items-center gap-2 text-base py-2.5 px-5 rounded-xl cursor-pointer`}>
                <Upload className="h-5 w-5" /> JSON
                <input type="file" accept=".json" onChange={importarJSON} className="hidden" />
              </label>
            </div>
          </div>
          </div>

          {/* Contenedor con scroll horizontal para la tabla */}
          <div className="overflow-x-auto custom-scrollbar rounded-b-[2.5rem]">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Encabezado de la tabla con anchos fijos y sticky */}
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[120px]">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px]">Departamento(s)</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[300px]">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px]">Tipo Problema</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px]">Reportado por</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[120px]">Prioridad</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[120px]">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[240px]">Asignado a</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px]">Fecha y Hora</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[100px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {/* Mensaje de carga o sin reportes */}
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-blue-600 font-semibold text-xl flex flex-col items-center justify-center">
                      <Loader2 className="animate-spin h-10 w-10 text-blue-500 mb-3" />
                      Cargando reportes...
                    </td>
                  </tr>
                ) : currentReports.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-500 font-semibold text-lg">
                      No hay reportes para mostrar con los filtros aplicados.
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
                        (idx % 2 === 0 ? 'bg-white' : 'bg-blue-50') +
                        ' hover:bg-blue-100 hover:shadow-sm transition-all duration-300 transform-gpu ' + // Removido cursor-pointer si es editable
                        (editRowId === r._id ? 'ring-2 ring-blue-400 ring-opacity-70 bg-blue-100/30 shadow-md' : '')
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-semibold">
                        {r._id.substring(0, 8)}...
                      </td>
                      {/* Celdas editables con inputs/selects y lógica de click/blur para activar edición y guardar */}
                      <td className="px-6 py-4 text-sm">
                        {editRowId === r._id ? (
                            <input
                              type="text"
                              value={(editData.departamento || []).join(', ')} // Asegurar que sea array
                              onChange={(e) => handleEditChange('departamento', e.target.value.split(',').map(s => s.trim()))}
                              className={`${glassInput} text-sm w-full py-2 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4`}
                              aria-label={`Departamento de reporte ${r._id.substring(0, 8)}`}
                            />
                        ) : (
                            <span className="cursor-pointer" onClick={() => handleEditClick(r)}>{r.departamento.join(', ')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-normal">
                        {editRowId === r._id ? (
                            <textarea
                              rows={2}
                              value={editData.descripcion || ''}
                              onChange={(e) => handleEditChange('descripcion', e.target.value)}
                              className={`${glassInput} text-sm w-full resize-y py-2 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4 transition-all duration-200`}
                              placeholder="Ingrese una descripción detallada..."
                              aria-label={`Descripción de reporte ${r._id.substring(0, 8)}`}
                              autoFocus
                            />
                        ) : (
                            <span className="cursor-pointer line-clamp-2 hover:text-blue-600 transition-colors duration-200" onClick={() => handleEditClick(r)}>{r.descripcion}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editRowId === r._id ? (
                            <select
                              value={editData.tipoProblema || ''}
                              onChange={(e) => handleEditChange('tipoProblema', e.target.value)}
                              className={`${glassSelect} text-sm w-full py-2 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4`}
                              aria-label={`Tipo de problema de reporte ${r._id.substring(0, 8)}`}
                            >
                              {tiposProblema.map((tipo) => (<option key={tipo} value={tipo}>{tipo}</option>))}
                            </select>
                        ) : (
                            <span className="cursor-pointer" onClick={() => handleEditClick(r)}>{r.tipoProblema}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editRowId === r._id ? (
                            <input
                              type="text"
                              value={editData.quienReporta || ''}
                              onChange={(e) => handleEditChange('quienReporta', e.target.value)}
                              className={`${glassInput} text-sm w-full py-2 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4`}
                              aria-label={`Persona que reporta en reporte ${r._id.substring(0, 8)}`}
                            />
                        ) : (
                            <span className="cursor-pointer" onClick={() => handleEditClick(r)}>{r.quienReporta}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {editRowId === r._id ? (
                            <select
                              value={editData.prioridad || ''}
                              onChange={(e) => handleEditChange('prioridad', e.target.value as Reporte['prioridad'])}
                              className={`${glassSelect} text-sm w-full text-center py-2 px-3 font-bold focus:ring-blue-500 border-blue-300 focus:ring-4`}
                              style={{ backgroundColor: PRIORIDADES.find(p => p.name === (editData.prioridad || r.prioridad))?.color || 'white', color: (editData.prioridad || r.prioridad) === 'Media' ? '#4B5563' : 'white' }}
                              aria-label={`Prioridad de reporte ${r._id.substring(0, 8)}`}
                            >
                              {PRIORIDADES.map((p) => (<option key={p.name} value={p.name} style={{ backgroundColor: p.color, color: p.name === 'Media' ? '#4B5563' : 'white' }}>{p.name}</option>))}
                            </select>
                        ) : (
                            <span className="cursor-pointer font-semibold" style={{ color: PRIORIDADES.find(p => p.name === r.prioridad)?.name === 'Media' ? '#4B5563' : 'white', backgroundColor: PRIORIDADES.find(p => p.name === r.prioridad)?.color, padding: '0.25rem 0.75rem', borderRadius: '0.5rem', display: 'inline-block' }} onClick={() => handleEditClick(r)}>{r.prioridad}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {editRowId === r._id ? (
                            <select
                              value={editData.status || ''}
                              onChange={(e) => handleEditChange('status', e.target.value as Reporte['status'])}
                              className={`${glassSelect} text-sm w-full text-center py-2 px-3 font-bold focus:ring-blue-500 border-blue-300 focus:ring-4`}
                              style={{ backgroundColor: ESTADOS.find(s => s.name === (editData.status || r.status))?.color || 'white', color: 'white' }}
                              aria-label={`Estado de reporte ${r._id.substring(0, 8)}`}
                            >
                              {ESTADOS.map((s) => (<option key={s.name} value={s.name} style={{ backgroundColor: s.color, color: 'white' }}>{s.name}</option>))}
                            </select>
                        ) : (
                            <span className="cursor-pointer font-semibold" style={{ color: 'white', backgroundColor: ESTADOS.find(s => s.name === r.status)?.color, padding: '0.25rem 0.75rem', borderRadius: '0.5rem', display: 'inline-block' }} onClick={() => handleEditClick(r)}>{r.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editRowId === r._id ? (
                            <select
                              value={editData.asignadoA || ''} // Ensure default value is an empty string for select to handle null/undefined correctly
                              onChange={(e) => handleEditChange('asignadoA', e.target.value === "" ? undefined : e.target.value)} // Set to undefined if empty string
                              className={`${glassSelect} text-sm w-full py-2 px-3 text-gray-900 focus:ring-blue-500 border-blue-300 focus:ring-4`}
                              aria-label={`Asignado a en reporte ${r._id.substring(0, 8)}`}
                            >
                              {INTEGRANTES.map((integrante) => (<option key={integrante} value={integrante}>{integrante}</option>))}
                              {/* Option for unassigned */}
                              <option value="">(Sin asignar)</option>
                            </select>
                        ) : (
                            <span className="cursor-pointer" onClick={() => handleEditClick(r)}>{r.asignadoA || '(Sin asignar)'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(r.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex gap-2 justify-center items-center">
                            {editRowId === r._id ? (
                                <>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    // Cancelar cualquier auto-guardado pendiente
                                    if (autoSaveTimer) {
                                      clearTimeout(autoSaveTimer);
                                      setAutoSaveTimer(null);
                                    }
                                    handleSaveEdit(r._id);
                                  }}
                                  className="p-2 rounded-full border border-green-300 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 shadow-md transition-all"
                                  title="Guardar cambios manualmente"
                                  aria-label={`Guardar cambios para reporte ${r._id.substring(0, 8)}`}
                                >
                                    <Save className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    // Cancelar cualquier auto-guardado pendiente
                                    if (autoSaveTimer) {
                                      clearTimeout(autoSaveTimer);
                                      setAutoSaveTimer(null);
                                    }
                                    handleCancelEdit();
                                  }}
                                  className="p-2 rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800 shadow-md transition-all"
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
                                  whileHover={{ scale: 1.15, rotate: 15 }} whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDelete(r._id)}
                                  className="p-2 rounded-full border border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 shadow-md transition-all group"
                                  title="Eliminar reporte"
                                  aria-label={`Eliminar reporte ${r._id.substring(0, 8)}`}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
                                  onClick={() => handleEditClick(r)}
                                  className="p-2 rounded-full border border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 shadow-md transition-all group"
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

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="py-4 px-6 bg-white/90 border-t border-gray-100 flex justify-between items-center text-gray-700 font-semibold text-sm rounded-b-[2.5rem]">
              <motion.button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Anterior
              </motion.button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <motion.button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;