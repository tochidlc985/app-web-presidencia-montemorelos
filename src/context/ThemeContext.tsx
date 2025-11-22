import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface ThemeConfig {
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  colorTheme: 'blue' | 'green' | 'purple' | 'red' | 'amber' | 'teal' | 'indigo' | 'pink';
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  layoutDensity: 'compact' | 'comfortable' | 'spacious';
  highContrast: boolean;
  reduceAnimations: boolean;
}

interface ThemeContextType {
  themeConfig: ThemeConfig;
  updateThemeConfig: (config: Partial<ThemeConfig>) => void;
  resetThemeConfig: () => void;
}

const defaultThemeConfig: ThemeConfig = {
  theme: 'system',
  language: 'es',
  colorTheme: 'blue',
  fontSize: 'medium',
  borderRadius: 'medium',
  layoutDensity: 'comfortable',
  highContrast: false,
  reduceAnimations: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultThemeConfig);

  // Cargar configuración guardada al iniciar
  useEffect(() => {
    const savedConfig = localStorage.getItem('themeConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setThemeConfig(parsedConfig);
      } catch (error) {
        console.error('Error al cargar la configuración del tema:', error);
      }
    }
  }, []);

  // Aplicar tema cuando cambia
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      const root = document.documentElement;
      let effective: 'light' | 'dark';
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        effective = prefersDark ? 'dark' : 'light';
      } else {
        effective = theme;
      }
      // Atributo para CSS variables y clase para Tailwind 'dark:'
      root.setAttribute('data-theme', effective);
      root.classList.toggle('dark', effective === 'dark');
      // Guardar en localStorage
      localStorage.setItem('theme', theme);
    };

    applyTheme(themeConfig.theme);
  }, [themeConfig.theme]);

  // Aplicar tema de color cuando cambia
  useEffect(() => {
    document.documentElement.setAttribute('data-color-theme', themeConfig.colorTheme);
    // Guardar en localStorage
    localStorage.setItem('colorTheme', themeConfig.colorTheme);

    // Forzar la recarga de estilos aplicando una clase temporal
    document.documentElement.classList.add('theme-updating');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-updating');
    }, 100);
  }, [themeConfig.colorTheme]);

  // Aplicar tamaño de fuente cuando cambia
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', themeConfig.fontSize);
    // Guardar en localStorage
    localStorage.setItem('fontSize', themeConfig.fontSize);

    // Forzar la recarga de estilos aplicando una clase temporal
    document.documentElement.classList.add('font-updating');
    setTimeout(() => {
      document.documentElement.classList.remove('font-updating');
    }, 100);
  }, [themeConfig.fontSize]);

  // Aplicar radio de borde cuando cambia
  useEffect(() => {
    document.documentElement.setAttribute('data-border-radius', themeConfig.borderRadius);
    // Guardar en localStorage
    localStorage.setItem('borderRadius', themeConfig.borderRadius);

    // Forzar la recarga de estilos aplicando una clase temporal
    document.documentElement.classList.add('border-updating');
    setTimeout(() => {
      document.documentElement.classList.remove('border-updating');
    }, 100);
  }, [themeConfig.borderRadius]);

  // Aplicar densidad de diseño cuando cambia
  useEffect(() => {
    document.documentElement.setAttribute('data-layout-density', themeConfig.layoutDensity);
    // Guardar en localStorage
    localStorage.setItem('layoutDensity', themeConfig.layoutDensity);

    // Forzar la recarga de estilos aplicando una clase temporal
    document.documentElement.classList.add('density-updating');
    setTimeout(() => {
      document.documentElement.classList.remove('density-updating');
    }, 100);
  }, [themeConfig.layoutDensity]);

  // Aplicar alto contraste cuando cambia
  useEffect(() => {
    if (themeConfig.highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
    // Guardar en localStorage
    localStorage.setItem('highContrast', themeConfig.highContrast.toString());

    // Forzar la recarga de estilos aplicando una clase temporal
    document.documentElement.classList.add('contrast-updating');
    setTimeout(() => {
      document.documentElement.classList.remove('contrast-updating');
    }, 100);
  }, [themeConfig.highContrast]);

  // Aplicar reducción de animaciones cuando cambia
  useEffect(() => {
    if (themeConfig.reduceAnimations) {
      document.documentElement.setAttribute('data-reduce-animations', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduce-animations');
    }
    // Guardar en localStorage
    localStorage.setItem('reduceAnimations', themeConfig.reduceAnimations.toString());

    // Forzar la recarga de estilos aplicando una clase temporal
    document.documentElement.classList.add('animations-updating');
    setTimeout(() => {
      document.documentElement.classList.remove('animations-updating');
    }, 100);
  }, [themeConfig.reduceAnimations]);

  // Guardar configuración cuando cambia
  useEffect(() => {
    localStorage.setItem('themeConfig', JSON.stringify(themeConfig));
    
    // Disparar un evento personalizado para notificar cambios en la configuración
    window.dispatchEvent(new CustomEvent('themeConfigChanged', { detail: themeConfig }));
  }, [themeConfig]);

  const updateThemeConfig = useCallback((config: Partial<ThemeConfig>) => {
    setThemeConfig(prev => ({ ...prev, ...config }));
  }, []);

  const resetThemeConfig = useCallback(() => {
    setThemeConfig(defaultThemeConfig);
  }, []);

  const contextValue = {
    themeConfig,
    updateThemeConfig,
    resetThemeConfig,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
