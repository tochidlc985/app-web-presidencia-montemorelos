
import { useEffect, useCallback } from 'react';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Hook personalizado para integrar la configuración global con el tema de la aplicación
 * Permite que los componentes reaccionen a cambios en la configuración en tiempo real
 */
export const useAppSettings = () => {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useGlobalSettings();
  const { themeConfig, updateThemeConfig } = useTheme();

  // Sincronizar la configuración del tema con el ThemeContext cuando cambia la configuración global
  useEffect(() => {
    // Solo actualizamos si hay cambios reales para evitar bucles infinitos
    if (JSON.stringify(themeConfig) !== JSON.stringify(settings.theme)) {
      updateThemeConfig(settings.theme);
    }
  }, [settings.theme, themeConfig, updateThemeConfig]);

  // Función para actualizar cualquier parte de la configuración
  const updateAppSettings = useCallback((newSettings: Partial<typeof settings>) => {
    updateSettings(newSettings);
  }, [updateSettings]);

  // Función para actualizar solo la configuración del tema
  const updateThemeSettings = useCallback((newThemeSettings: Partial<typeof settings.theme>) => {
    updateSettings({
      theme: {
        ...settings.theme,
        ...newThemeSettings
      }
    });
  }, [settings.theme, updateSettings]);

  // Función para actualizar solo la configuración de notificaciones
  const updateNotificationSettings = useCallback((newNotificationSettings: Partial<typeof settings.notifications>) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        ...newNotificationSettings
      }
    });
  }, [settings.notifications, updateSettings]);

  // Función para actualizar solo la configuración de privacidad
  const updatePrivacySettings = useCallback((newPrivacySettings: Partial<typeof settings.privacy>) => {
    updateSettings({
      privacy: {
        ...settings.privacy,
        ...newPrivacySettings
      }
    });
  }, [settings.privacy, updateSettings]);

  // Función para actualizar solo la configuración avanzada
  const updateAdvancedSettings = useCallback((newAdvancedSettings: Partial<typeof settings.advanced>) => {
    updateSettings({
      advanced: {
        ...settings.advanced,
        ...newAdvancedSettings
      }
    });
  }, [settings.advanced, updateSettings]);

  return {
    // Configuración completa
    settings,

    // Funciones de actualización
    updateAppSettings,
    updateThemeSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    updateAdvancedSettings,

    // Funciones de utilidad
    resetSettings,
    exportSettings,
    importSettings,

    // Configuración específica para facilitar el acceso
    theme: settings.theme,
    notifications: settings.notifications,
    privacy: settings.privacy,
    advanced: settings.advanced,
  };
};
