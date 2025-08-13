# Sistema de Reportes - Presidencia Municipal de Montemorelos

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Conexión a internet (para MongoDB Atlas)

### Instalación
```bash
# Instalar dependencias
npm install
```

### Configuración
1. Verificar que el archivo `.env` tenga la configuración correcta
2. La base de datos MongoDB Atlas ya está configurada

### Ejecutar el proyecto

#### Opción 1: Desarrollo completo
```bash
# Terminal 1 - Servidor backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

#### Opción 2: Solo frontend (si el backend ya está corriendo)
```bash
npm run dev
```

### Probar la conexión a la base de datos
```bash
npm run test-db
```

## 🔧 Problemas Corregidos

### 1. Base de datos
- ✅ Corregido método `actualizarReporte` para usar `_id` en lugar de `id`
- ✅ Agregado método `eliminarReporte` faltante
- ✅ Simplificado manejo de autenticación de usuarios
- ✅ Corregido manejo de roles y perfiles

### 2. Servidor (server.js)
- ✅ Corregido manejo de errores en endpoints de login y registro
- ✅ Simplificado endpoint de perfil de usuario
- ✅ Mejorado manejo de autenticación

### 3. Frontend
- ✅ Corregido manejo de roles en `App.tsx` y `PrivateRoute.tsx`
- ✅ Agregado soporte para campo `rol` además de `roles`
- ✅ Creado archivo de configuración centralizada de API

### 4. Configuración
- ✅ Corregidas variables de entorno en `.env`
- ✅ Agregadas URLs completas para endpoints
- ✅ Agregado script de prueba de base de datos

## 🎯 Funcionalidades

### Roles de usuario
- **usuario/a**: Puede crear reportes
- **administrador**: Acceso completo al sistema
- **jefe de departamento**: Puede ver y gestionar reportes
- **tecnico**: Puede ver y actualizar reportes

### Características principales
- Sistema de autenticación con roles
- Creación y gestión de reportes
- Dashboard con estadísticas
- Generador de códigos QR
- Subida de imágenes
- Gestión de perfiles de usuario

## 🌐 URLs del sistema
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Documentación API: Los endpoints están en `/api/*`

## 📝 Notas importantes
- El sistema usa MongoDB Atlas como base de datos
- Las credenciales de la base de datos están en el archivo `.env`
- Para producción, cambiar las URLs y configurar variables de entorno apropiadas
- El sistema de autenticación actual es básico, se recomienda implementar JWT para producción