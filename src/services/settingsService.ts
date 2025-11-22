
import { ThemeConfig } from '../context/ThemeContext';

// Interfaz para la configuración global
export interface GlobalSettings {
  theme: ThemeConfig;
  notifications: {
    email: boolean;
    browser: boolean;
    sound: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'contacts';
    activityStatus: boolean;
    dataCollection: boolean;
  };
  advanced: {
    autoSave: boolean;
    debugMode: boolean;
    cacheEnabled: boolean;
    developerMode: boolean;
    experimentalFeatures: boolean;
  };
}

// Configuración predeterminada
const DEFAULT_SETTINGS: GlobalSettings = {
  theme: {
    theme: 'system',
    language: 'es',
    colorTheme: 'blue',
    fontSize: 'medium',
    borderRadius: 'medium',
    layoutDensity: 'comfortable',
    highContrast: false,
    reduceAnimations: false,
  },
  notifications: {
    email: true,
    browser: true,
    sound: true,
  },
  privacy: {
    profileVisibility: 'public',
    activityStatus: true,
    dataCollection: true,
  },
  advanced: {
    autoSave: true,
    debugMode: false,
    cacheEnabled: true,
    developerMode: false,
    experimentalFeatures: false,
  },
};

// Clase para gestionar la configuración global
class SettingsService {
  private settings: GlobalSettings;
  private listeners: Array<(settings: GlobalSettings) => void> = [];

  constructor() {
    // Cargar configuración desde localStorage o usar la predeterminada
    const savedSettings = localStorage.getItem('globalSettings');
    this.settings = savedSettings ? this.mergeSettings(DEFAULT_SETTINGS, JSON.parse(savedSettings)) : DEFAULT_SETTINGS;

    // Escuchar cambios en el tema
    window.addEventListener('storage', (event) => {
      if (event.key === 'globalSettings' && event.newValue) {
        this.updateSettings(JSON.parse(event.newValue), false);
      }
    });
  }

  // Mezcla la configuración guardada con la predeterminada para evitar errores
  private mergeSettings(defaultSettings: GlobalSettings, savedSettings: Partial<GlobalSettings>): GlobalSettings {
    return {
      theme: {
        ...defaultSettings.theme,
        ...(savedSettings.theme || {})
      },
      notifications: {
        ...defaultSettings.notifications,
        ...(savedSettings.notifications || {})
      },
      privacy: {
        ...defaultSettings.privacy,
        ...(savedSettings.privacy || {})
      },
      advanced: {
        ...defaultSettings.advanced,
        ...(savedSettings.advanced || {})
      }
    };
  }

  // Obtener la configuración actual
  getSettings(): GlobalSettings {
    return { ...this.settings };
  }

  // Actualizar la configuración
  updateSettings(newSettings: Partial<GlobalSettings>, saveToLocalStorage: boolean = true): void {
    this.settings = this.mergeSettings(this.settings, newSettings);

    // Guardar en localStorage
    if (saveToLocalStorage) {
      localStorage.setItem('globalSettings', JSON.stringify(this.settings));
    }

    // Notificar a los listeners
    this.notifyListeners();

    // Disparar evento personalizado para notificar cambios en la configuración
    window.dispatchEvent(new CustomEvent('globalSettingsChanged', { detail: this.settings }));
  }

  // Suscribirse a cambios en la configuración
  subscribe(listener: (settings: GlobalSettings) => void): () => void {
    this.listeners.push(listener);

    // Retornar función para cancelar la suscripción
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notificar a todos los listeners sobre cambios en la configuración
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  // Restablecer la configuración a valores predeterminados
  resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    localStorage.setItem('globalSettings', JSON.stringify(this.settings));
    this.notifyListeners();
    window.dispatchEvent(new CustomEvent('globalSettingsChanged', { detail: this.settings }));
  }

  // Exportar configuración a un archivo JSON
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  // Importar configuración desde un objeto JSON
  importSettings(settingsJson: string): boolean {
    try {
      const importedSettings = JSON.parse(settingsJson);
      this.updateSettings(this.mergeSettings(DEFAULT_SETTINGS, importedSettings));
      return true;
    } catch (error) {
      console.error('Error al importar la configuración:', error);
      return false;
    }
  }
}

// Crear una instancia única del servicio
const settingsService = new SettingsService();

// Exportar la instancia como un singleton
export default settingsService;
