/**
 * Configuración de permisos por rol para la aplicación
 * Define qué rutas puede acceder cada tipo de usuario
 */

// Definir todos los roles disponibles en el sistema
export const ROLES = {
  USUARIO: 'usuario',
  ADMINISTRADOR: 'administrador',
  JEFE_DEPARTAMENTO: 'jefe_departamento',
  TECNICO: 'tecnico'
} as const;

// Definir todas las rutas disponibles en la aplicación
export const ROUTES = {
  HOME: '/home',
  REPORTE: '/reporte',
  DASHBOARD: '/dashboard',
  QR: '/qr',
  PROFILE: '/profile',
  SETTINGS: '/settings'
} as const;

// Definir permisos por rol
export const ROLE_PERMISSIONS = {
  // Usuario: solo puede acceder a Home y Nuevo Reporte
  [ROLES.USUARIO]: [
    ROUTES.HOME,
    ROUTES.REPORTE,
    ROUTES.PROFILE,
    ROUTES.SETTINGS
  ],

  // Administrador: puede acceder a Dashboard, Home y Configuración
  [ROLES.ADMINISTRADOR]: [
    ROUTES.HOME,
    ROUTES.DASHBOARD,
    ROUTES.PROFILE,
    ROUTES.SETTINGS
  ],

  // Jefe de Departamento: puede acceder a toda la aplicación
  [ROLES.JEFE_DEPARTAMENTO]: [
    ROUTES.HOME,
    ROUTES.REPORTE,
    ROUTES.DASHBOARD,
    ROUTES.QR,
    ROUTES.PROFILE,
    ROUTES.SETTINGS
  ],

  // Técnico: puede acceder a toda la aplicación
  [ROLES.TECNICO]: [
    ROUTES.HOME,
    ROUTES.REPORTE,
    ROUTES.DASHBOARD,
    ROUTES.QR,
    ROUTES.PROFILE,
    ROUTES.SETTINGS
  ]
};

/**
 * Verifica si un rol tiene permiso para acceder a una ruta específica
 * @param role - El rol del usuario
 * @param route - La ruta a verificar
 * @returns true si el rol tiene permiso, false en caso contrario
 */
export const hasPermission = (role: string, route: keyof typeof ROUTES): boolean => {
  // Normalizar el rol (manejar variaciones como 'jefe' vs 'jefe_departamento')
  const normalizedRole = normalizeRole(role);

  // Si el rol no está definido en los permisos, denegar acceso
  if (!ROLE_PERMISSIONS[normalizedRole as keyof typeof ROLE_PERMISSIONS]) {
    return false;
  }

  // Verificar si la ruta está en la lista de permisos del rol
  return ROLE_PERMISSIONS[normalizedRole as keyof typeof ROLE_PERMISSIONS].includes(route);
};

/**
 * Normaliza el nombre del rol para manejar variaciones
 * @param role - El rol a normalizar
 * @returns El rol normalizado
 */
export const normalizeRole = (role: string): string => {
  // Mapear variaciones de roles a los valores estándar
  const roleMap: Record<string, string> = {
    'jefe': ROLES.JEFE_DEPARTAMENTO,
    'jefe_departamento': ROLES.JEFE_DEPARTAMENTO,
    'usuario': ROLES.USUARIO,
    'administrador': ROLES.ADMINISTRADOR,
    'tecnico': ROLES.TECNICO,
    'técnico': ROLES.TECNICO
  };

  return roleMap[role.toLowerCase()] || ROLES.USUARIO; // Por defecto, rol de usuario
};

/**
 * Obtiene las rutas permitidas para un rol específico
 * @param role - El rol del usuario
 * @returns Array de rutas permitidas
 */
export const getAllowedRoutes = (role: string): string[] => {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole as keyof typeof ROLE_PERMISSIONS] || [];
};