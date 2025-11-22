
import React, { useEffect } from 'react';
import { useAppSettings } from '../hooks/useGlobalSettings';

/**
 * Componente de orden superior (HOC) que inyecta la configuración global
 * y hace que el componente se actualice en tiempo real cuando cambia la configuración
 * 
 * @param Component El componente a envolver
 * @returns Un nuevo componente con acceso a la configuración global
 */
export const withGlobalSettings = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WithGlobalSettings: React.FC<P> = (props) => {
    const { settings } = useAppSettings();

    // Forzar una actualización del componente cuando cambia la configuración
    const [, forceUpdate] = React.useState({});
    useEffect(() => {
      forceUpdate({});
    }, [settings]);

    return <Component {...props} globalSettings={settings} />;
  };

  // Asignar un nombre descriptivo para depuración
  const displayName = Component.displayName || Component.name || 'Component';
  WithGlobalSettings.displayName = `withGlobalSettings(${displayName})`;

  return WithGlobalSettings;
};

/**
 * Hook personalizado para usar dentro de componentes funcionales
 * que necesitan reaccionar a cambios de configuración global
 */
export const useGlobalSettingsListener = () => {
  const { settings } = useAppSettings();

  // Forzar una actualización del componente cuando cambia la configuración
  const [, forceUpdate] = React.useState({});
  useEffect(() => {
    forceUpdate({});
  }, [settings]);

  return { settings };
};
