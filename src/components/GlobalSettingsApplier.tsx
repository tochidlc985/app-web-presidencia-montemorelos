
import React, { useEffect } from 'react';
import { useAppSettings } from '../hooks/useGlobalSettings';

/**
 * Componente que aplica dinámicamente las clases CSS y atributos según la configuración global
 * Este componente no renderiza nada visualmente, solo aplica los cambios en el DOM
 */
export const GlobalSettingsApplier: React.FC = () => {
  const { settings } = useAppSettings();

  // Aplicar configuración del tema al DOM
  useEffect(() => {
    const root = document.documentElement;

    // Aplicar tema (claro/oscuro/sistema)
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      let effective: 'light' | 'dark';
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        effective = prefersDark ? 'dark' : 'light';
      } else {
        effective = theme;
      }
      root.setAttribute('data-theme', effective);
      root.classList.toggle('dark', effective === 'dark');
    };

    // Aplicar cada aspecto de la configuración
    applyTheme(settings.theme.theme);
    root.setAttribute('data-color-theme', settings.theme.colorTheme);
    root.setAttribute('data-font-size', settings.theme.fontSize);
    root.setAttribute('data-border-radius', settings.theme.borderRadius);
    root.setAttribute('data-layout-density', settings.theme.layoutDensity);

    // Aplicar alto contraste
    if (settings.theme.highContrast) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }

    // Aplicar reducción de animaciones
    if (settings.theme.reduceAnimations) {
      root.setAttribute('data-reduce-animations', 'true');
    } else {
      root.removeAttribute('data-reduce-animations');
    }

    // Forzar la recarga de estilos aplicando una clase temporal
    root.classList.add('global-settings-updating');
    setTimeout(() => {
      root.classList.remove('global-settings-updating');
    }, 100);

    // Guardar en localStorage para persistencia entre sesiones
    localStorage.setItem('theme', settings.theme.theme);
    localStorage.setItem('colorTheme', settings.theme.colorTheme);
    localStorage.setItem('fontSize', settings.theme.fontSize);
    localStorage.setItem('borderRadius', settings.theme.borderRadius);
    localStorage.setItem('layoutDensity', settings.theme.layoutDensity);
    localStorage.setItem('highContrast', settings.theme.highContrast.toString());
    localStorage.setItem('reduceAnimations', settings.theme.reduceAnimations.toString());

  }, [settings.theme]);

  // Aplicar configuración de notificaciones
  useEffect(() => {
    // Aquí podríamos implementar lógica para notificaciones en tiempo real
    // Por ejemplo, registrar o cancelar service workers según la configuración

    // Guardar en localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(settings.notifications));
  }, [settings.notifications]);

  // Aplicar configuración de privacidad
  useEffect(() => {
    // Aquí podríamos implementar lógica para ajustes de privacidad
    // Por ejemplo, actualizar la visibilidad del perfil en tiempo real

    // Guardar en localStorage
    localStorage.setItem('privacySettings', JSON.stringify(settings.privacy));
  }, [settings.privacy]);

  // Aplicar configuración avanzada
  useEffect(() => {
    // Aquí podríamos implementar lógica para características avanzadas
    // Por ejemplo, habilitar/deshabilitar características experimentales

    // Guardar en localStorage
    localStorage.setItem('advancedSettings', JSON.stringify(settings.advanced));

    // Si el modo depuración está habilitado, mostrar información en la consola
    if (settings.advanced.debugMode) {
      console.log('Configuración global actual:', settings);
    }
  }, [settings.advanced]);

  // Este componente no renderiza nada visualmente
  return null;
};

export default GlobalSettingsApplier;
