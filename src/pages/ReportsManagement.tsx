import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Filter, Trash2, Eye, X, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { API_ENDPOINTS } from '../services/apiConfig';

// Interfaces
interface Report {
  _id: string;
  email: string;
  telefono: string;
  departamento: string[];
  quienReporta: string;
  descripcion: string;
  prioridad: string;
  tipoProblema: string;
  timestamp: string;
  status: string;
  aclaracionRespuestas?: Record<string, string>;
  imagenes?: string[];
}

interface FilterOptions {
  status: string;
  prioridad: string;
  departamento: string;
  tipoProblema: string;
}

const ReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    prioridad: '',
    departamento: '',
    tipoProblema: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Report[]>(API_ENDPOINTS.REPORTES);
      setReports(response.data);
      setFilteredReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Real-time polling - refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReports();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchReports]);

  // Filter and search
  useEffect(() => {
    let filtered = reports;

    // Search
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.quienReporta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.tipoProblema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.departamento.some(dept => dept.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filters
    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }
    if (filters.prioridad) {
      filtered = filtered.filter(report => report.prioridad === filters.prioridad);
    }
    if (filters.departamento) {
      filtered = filtered.filter(report =>
        report.departamento.includes(filters.departamento)
      );
    }
    if (filters.tipoProblema) {
      filtered = filtered.filter(report => report.tipoProblema === filters.tipoProblema);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, filters]);

  // Update report status
  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      setUpdating(true);
      await api.patch(`${API_ENDPOINTS.REPORTES}/${reportId}`, { status: newStatus });

      // Update local state immediately
      setReports(prev => prev.map(report =>
        report._id === reportId ? { ...report, status: newStatus } : report
      ));

      toast.success('Estado del reporte actualizado');
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Error al actualizar el reporte');
    } finally {
      setUpdating(false);
    }
  };

  // Delete report
  const deleteReport = async (reportId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) return;

    try {
      setUpdating(true);
      await api.delete(`${API_ENDPOINTS.REPORTES}/${reportId}`);

      // Update local state immediately
      setReports(prev => prev.filter(report => report._id !== reportId));
      setFilteredReports(prev => prev.filter(report => report._id !== reportId));

      toast.success('Reporte eliminado correctamente');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Error al eliminar el reporte');
    } finally {
      setUpdating(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'En Progreso': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Resuelto': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'Baja': return 'bg-emerald-100 text-emerald-800';
      case 'Media': return 'bg-amber-100 text-amber-800';
      case 'Alta': return 'bg-orange-100 text-orange-800';
      case 'Crítica': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique values for filters
  const getUniqueValues = (key: keyof Report) => {
    const values = new Set<string>();
    reports.forEach(report => {
      if (Array.isArray(report[key])) {
        (report[key] as string[]).forEach(item => values.add(item));
      } else {
        values.add(report[key] as string);
      }
    });
    return Array.from(values);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Gestión de Reportes
              </h1>
              <p className="text-gray-600">Administra y supervisa todos los reportes del sistema</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchReports}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={updating}
              >
                <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar reportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filtros
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    {getUniqueValues('status').map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <select
                    value={filters.prioridad}
                    onChange={(e) => setFilters(prev => ({ ...prev, prioridad: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las prioridades</option>
                    {getUniqueValues('prioridad').map(prioridad => (
                      <option key={prioridad} value={prioridad}>{prioridad}</option>
                    ))}
                  </select>

                  <select
                    value={filters.tipoProblema}
                    onChange={(e) => setFilters(prev => ({ ...prev, tipoProblema: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los tipos</option>
                    {getUniqueValues('tipoProblema').map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>

                  <select
                    value={filters.departamento}
                    onChange={(e) => setFilters(prev => ({ ...prev, departamento: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los departamentos</option>
                    {getUniqueValues('departamento').flat().map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Reports List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No se encontraron reportes</h3>
              <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reporte
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <motion.tr
                      key={report._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{report.quienReporta}</div>
                          <div className="text-sm text-gray-600">{report.tipoProblema}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {report.departamento.join(', ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={report.status}
                          onChange={(e) => updateReportStatus(report._id, e.target.value)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(report.status)}`}
                          disabled={updating}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Progreso">En Progreso</option>
                          <option value="Resuelto">Resuelto</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(report.prioridad)}`}>
                          {report.prioridad}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(report.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteReport(report._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                            disabled={updating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Detalle del Reporte</h2>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Reportado por
                        </label>
                        <p className="text-gray-900">{selectedReport.quienReporta}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email
                        </label>
                        <p className="text-gray-900">{selectedReport.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <p className="text-gray-900">{selectedReport.telefono}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Departamento(s)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.departamento.map((dept, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tipo de Problema
                        </label>
                        <p className="text-gray-900">{selectedReport.tipoProblema}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Prioridad
                        </label>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(selectedReport.prioridad)}`}>
                          {selectedReport.prioridad}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Estado
                        </label>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(selectedReport.status)}`}>
                          {selectedReport.status}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Fecha de Creación
                        </label>
                        <p className="text-gray-900">{formatDate(selectedReport.timestamp)}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Descripción
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                          {selectedReport.descripcion}
                        </p>
                      </div>

                      {selectedReport.aclaracionRespuestas && Object.keys(selectedReport.aclaracionRespuestas).length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Respuestas de Aclaración
                          </label>
                          <div className="space-y-3">
                            {Object.entries(selectedReport.aclaracionRespuestas).map(([question, answer], index) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-medium text-gray-800 mb-2">{question}</p>
                                <p className="text-gray-700">{answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedReport.imagenes && selectedReport.imagenes.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Archivos Adjuntos
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            {selectedReport.imagenes.map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={`http://localhost:5000${image}`}
                                  alt={`Archivo ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportsManagement;
