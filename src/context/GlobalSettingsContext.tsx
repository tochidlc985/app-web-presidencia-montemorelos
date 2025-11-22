
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { GlobalSettings } from '../services/settingsService';
import settingsService from '../services/settingsService';

interface GlobalSettingsContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: Partial<GlobalSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

interface GlobalSettingsProviderProps {
  children: ReactNode;
}

export const GlobalSettingsProvider: React.FC<GlobalSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<GlobalSettings>(settingsService.getSettings());

  // Suscribirse a cambios en la configuración
  useEffect(() => {
    const unsubscribe = settingsService.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    // Escuchar eventos personalizados de cambios en la configuración
    const handleSettingsChanged = (event: CustomEvent) => {
      setSettings(event.detail);
    };

    window.addEventListener('globalSettingsChanged', handleSettingsChanged as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('globalSettingsChanged', handleSettingsChanged as EventListener);
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<GlobalSettings>) => {
    settingsService.updateSettings(newSettings);
  }, []);

  const resetSettings = useCallback(() => {
    settingsService.resetSettings();
  }, []);

  const exportSettings = useCallback(() => {
    return settingsService.exportSettings();
  }, []);

  const importSettings = useCallback((settingsJson: string) => {
    return settingsService.importSettings(settingsJson);
  }, []);

  const contextValue = {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  };

  return (
    <GlobalSettingsContext.Provider value={contextValue}>
      {children}
    </GlobalSettingsContext.Provider>
  );
};

export const useGlobalSettings = (): GlobalSettingsContextType => {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
};
