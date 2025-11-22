
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppSettings } from '../hooks/useGlobalSettings';
import { toast } from 'react-hot-toast';

const Settings: React.FC = () => {
  const { 
    settings, 
    updateThemeSettings, 
    updateNotificationSettings, 
    updatePrivacySettings, 
    updateAdvancedSettings,
    resetSettings,
    exportSettings,
    importSettings
  } = useAppSettings();

  const [activeTab, setActiveTab] = useState('theme');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState('');

  // Función para manejar la exportación de configuración
  const handleExportSettings = () => {
    setIsExporting(true);
    try {
      const data = exportSettings();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'app-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Configuración exportada correctamente');
    } catch (error) {
      toast.error('Error al exportar la configuración');
      console.error('Error al exportar la configuración:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Función para manejar la importación de configuración
  const handleImportSettings = () => {
    if (!importData.trim()) {
      toast.error('Por favor, introduce los datos de configuración');
      return;
    }

    setIsImporting(true);
    try {
      const success = importSettings(importData);
      if (success) {
        toast.success('Configuración importada correctamente');
        setImportData('');
      } else {
        toast.error('Error al importar la configuración. Formato inválido.');
      }
    } catch (error) {
      toast.error('Error al importar la configuración');
      console.error('Error al importar la configuración:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Función para manejar el restablecimiento de configuración
  const handleResetSettings = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer toda la configuración a los valores predeterminados?')) {
      resetSettings();
      toast.success('Configuración restablecida a los valores predeterminados');
    }
  };

  // Función para leer un archivo de configuración
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  // Pestañas de configuración
  const tabs = [
    { id: 'theme', label: 'Tema y Apariencia', icon: '🎨' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'privacy', label: 'Privacidad', icon: '🔒' },
    { id: 'advanced', label: 'Avanzado', icon: '⚙️' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Configuración</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Personaliza la apariencia y el comportamiento de la aplicación
          </p>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Navegación de pestañas */}
          <div className="w-full md:w-64 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Acciones de configuración */}
            <div className="p-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Acciones
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleExportSettings}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isExporting ? 'Exportando...' : 'Exportar Configuración'}
                </button>
                <button
                  onClick={handleResetSettings}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Restablecer Valores
                </button>
              </div>
            </div>
          </div>

          {/* Contenido de la pestaña activa */}
          <div className="flex-1 p-6">
            {/* Pestaña de Tema y Apariencia */}
            {activeTab === 'theme' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Tema y Apariencia</h2>

                {/* Selector de tema (claro/oscuro/sistema) */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Modo de Tema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Claro', icon: '☀️' },
                      { value: 'dark', label: 'Oscuro', icon: '🌙' },
                      { value: 'system', label: 'Sistema', icon: '💻' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeSettings({ theme: option.value as any })}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center space-y-2 transition-colors ${
                          settings.theme.theme === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de color de tema */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Color del Tema</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { value: 'blue', label: 'Azul', color: 'bg-blue-500' },
                      { value: 'green', label: 'Verde', color: 'bg-green-500' },
                      { value: 'purple', label: 'Púrpura', color: 'bg-purple-500' },
                      { value: 'red', label: 'Rojo', color: 'bg-red-500' },
                      { value: 'amber', label: 'Ámbar', color: 'bg-amber-500' },
                      { value: 'teal', label: 'Turquesa', color: 'bg-teal-500' },
                      { value: 'indigo', label: 'Índigo', color: 'bg-indigo-500' },
                      { value: 'pink', label: 'Rosa', color: 'bg-pink-500' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeSettings({ colorTheme: option.value as any })}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center space-y-2 transition-colors ${
                          settings.theme.colorTheme === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full ${option.color}`}></span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de tamaño de fuente */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Tamaño de Fuente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'small', label: 'Pequeño', preview: 'Texto pequeño' },
                      { value: 'medium', label: 'Mediano', preview: 'Texto mediano' },
                      { value: 'large', label: 'Grande', preview: 'Texto grande' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeSettings({ fontSize: option.value as any })}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center space-y-2 transition-colors ${
                          settings.theme.fontSize === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className={`font-medium text-gray-700 dark:text-gray-300 ${
                          option.value === 'small' ? 'text-sm' : 
                          option.value === 'medium' ? 'text-base' : 'text-lg'
                        }`}>
                          {option.preview}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de radio de borde */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Radio de Borde</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'none', label: 'Sin borde', preview: '□' },
                      { value: 'small', label: 'Pequeño', preview: '▢' },
                      { value: 'medium', label: 'Mediano', preview: '◻' },
                      { value: 'large', label: 'Grande', preview: '◼' },
                      { value: 'full', label: 'Redondo', preview: '●' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeSettings({ borderRadius: option.value as any })}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center space-y-2 transition-colors ${
                          settings.theme.borderRadius === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl text-gray-700 dark:text-gray-300">{option.preview}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de densidad de diseño */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Densidad de Diseño</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'compact', label: 'Compacto', icon: '📱' },
                      { value: 'comfortable', label: 'Cómodo', icon: '💻' },
                      { value: 'spacious', label: 'Espacioso', icon: '🖥️' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateThemeSettings({ layoutDensity: option.value as any })}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center space-y-2 transition-colors ${
                          settings.theme.layoutDensity === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opciones de accesibilidad */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Accesibilidad</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">Alto Contraste</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Mejora el contraste de colores para mejor visibilidad
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.theme.highContrast}
                          onChange={(e) => updateThemeSettings({ highContrast: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">Reducir Animaciones</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Minimiza las animaciones y efectos de movimiento
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.theme.reduceAnimations}
                          onChange={(e) => updateThemeSettings({ reduceAnimations: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pestaña de Notificaciones */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Notificaciones</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Notificaciones por Email</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Recibe notificaciones importantes en tu correo electrónico
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => updateNotificationSettings({ email: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Notificaciones del Navegador</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Muestra notificaciones emergentes en tu navegador
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.browser}
                        onChange={(e) => updateNotificationSettings({ browser: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Sonidos de Notificación</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Reproduce sonidos para las notificaciones importantes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.sound}
                        onChange={(e) => updateNotificationSettings({ sound: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pestaña de Privacidad */}
            {activeTab === 'privacy' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Privacidad</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Visibilidad del Perfil</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: 'public', label: 'Público', description: 'Visible para todos' },
                        { value: 'private', label: 'Privado', description: 'Solo visible para ti' },
                        { value: 'contacts', label: 'Contactos', description: 'Visible solo para contactos' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updatePrivacySettings({ profileVisibility: option.value as any })}
                          className={`p-4 rounded-lg border flex flex-col items-center justify-center space-y-2 transition-colors ${
                            settings.privacy.profileVisibility === option.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300">{option.label}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{option.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Estado de Actividad</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Muestra tu estado de actividad a otros usuarios
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.activityStatus}
                        onChange={(e) => updatePrivacySettings({ activityStatus: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Recopilación de Datos</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Permite la recopilación de datos anónimos para mejorar la aplicación
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.privacy.dataCollection}
                        onChange={(e) => updatePrivacySettings({ dataCollection: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pestaña de Configuración Avanzada */}
            {activeTab === 'advanced' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Configuración Avanzada</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Guardado Automático</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Guarda automáticamente los cambios sin necesidad de confirmar
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.advanced.autoSave}
                        onChange={(e) => updateAdvancedSettings({ autoSave: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Modo Depuración</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Habilita mensajes de depuración en la consola del navegador
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.advanced.debugMode}
                        onChange={(e) => updateAdvancedSettings({ debugMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Caché Habilitado</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Almacena datos localmente para mejorar el rendimiento
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.advanced.cacheEnabled}
                        onChange={(e) => updateAdvancedSettings({ cacheEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Modo Desarrollador</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Habilita herramientas y opciones para desarrolladores
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.advanced.developerMode}
                        onChange={(e) => updateAdvancedSettings({ developerMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">Características Experimentales</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Habilita funciones experimentales que están en desarrollo
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.advanced.experimentalFeatures}
                        onChange={(e) => updateAdvancedSettings({ experimentalFeatures: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Importación/Exportación de configuración */}
                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Importar/Exportar Configuración</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Importar desde archivo
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        dark:file:bg-blue-900/30 dark:file:text-blue-300"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      O pegar datos JSON
                    </label>
                    <textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      rows={5}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Pega aquí los datos JSON de configuración..."
                    ></textarea>
                  </div>

                  <button
                    onClick={handleImportSettings}
                    disabled={isImporting || !importData.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isImporting ? 'Importando...' : 'Importar Configuración'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
