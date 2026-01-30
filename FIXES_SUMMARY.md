# Resumen de Correcciones - App Presidencia Montemorelos

## Problemas Identificados y Solucionados

### 1. Problema Principal: Subida de Archivos en Vercel (Serverless)

**Problema:** Vercel utiliza un entorno serverless que NO permite escritura en el sistema de archivos. El código original usaba `multer` con `diskStorage` para guardar archivos en disco, lo cual fallaba en producción.

**Solución:** 
- Cambiado a `multer.memoryStorage()` para almacenar archivos en memoria
- Los archivos se convierten a base64 y se almacenan directamente en MongoDB
- Funciona tanto para reportes con imágenes como para fotos de perfil

### 2. Problema: Actualización de Perfil no Funcionaba

**Problema:** 
- El endpoint de perfil no devolvía el formato esperado por el frontend
- Faltaban campos requeridos en la validación del backend
- La URL no estaba codificada correctamente para emails con caracteres especiales

**Solución:**
- Actualizado `server-vercel.js` para devolver `{ usuario: {...} }` en lugar de solo los datos
- Agregados campos mínimos requeridos: `nombre` y `departamento`
- Agregado `encodeURIComponent()` para el email en las URLs
- Mejorado el manejo de errores en todos los endpoints

### 3. Problema: CORS y Autenticación

**Problema:**
- Configuración de CORS restrictiva
- Token JWT no incluía el campo `roles` necesario para el middleware `requireRole`

**Solución:**
- CORS configurado para permitir todas las origins en producción
- Token JWT ahora incluye tanto `rol` como `roles` para compatibilidad
- Mejorado el middleware de verificación de roles

### 4. Problema: API Base URL en Vercel

**Problema:** La URL de la API no se construía correctamente en el entorno de Vercel.

**Solución:** Simplificada la configuración en `apiConfig.ts` para usar siempre `window.location.origin`.

## Archivos Modificados

### Backend (`server-vercel.js`)
1. **Multer Storage:** Cambiado de `diskStorage` a `memoryStorage`
2. **Endpoints de Reportes:** Procesan archivos en memoria y los guardan como base64 en MongoDB
3. **Endpoints de Perfil:** 
   - GET `/api/perfil/:email` - Devuelve `{ usuario: {...} }`
   - PUT `/api/perfil/:email` - Validación mejorada y manejo de errores
   - POST `/api/perfil/:email/foto` - Usa memoryStorage
   - DELETE `/api/perfil/:email/foto` - Eliminación correcta
4. **Autenticación:** Token JWT incluye `roles` array
5. **CORS:** Configuración más permisiva para móviles
6. **Error Handling:** Middleware de errores mejorado para multer

### Frontend

#### `src/services/apiConfig.ts`
- Simplificada la lógica de `API_BASE_URL` y `ADJUSTED_API_BASE_URL`
- Usa `window.location.origin` consistentemente

#### `src/services/profileService.ts`
- `getUserProfile()` - Ahora codifica el email y maneja mejor los errores
- `updateUserProfile()` - Agrega campos requeridos por defecto, elimina propiedades internas
- `uploadProfilePhoto()` - URL codificada correctamente
- `deleteProfilePhoto()` - URL codificada correctamente

#### `src/pages/Profile.tsx`
- `saveUserDataInRealTime()` - Simplificada la lógica, eliminado el intento de crear perfil (ya lo hace el backend)
- Asegura campos mínimos requeridos antes de enviar

#### `src/pages/ReportForm.tsx`
- `handleSubmit()` - Mejorado el manejo de errores y logging
- Agregado toast de carga durante el envío
- Timeout aumentado a 2 minutos para archivos grandes
- Agregado campo `estado: 'Pendiente'` además de `status`

## Cómo Desplegar

### 1. Preparar el Proyecto
```bash
cd "Aplicacion Web Presidencia Montemorelos/project"
npm install
```

### 2. Construir el Proyecto
```bash
npm run build
```

### 3. Configurar Variables de Entorno en Vercel
Asegúrate de tener estas variables en tu dashboard de Vercel:
- `MONGO_URI` - Tu URI de MongoDB Atlas
- `JWT_SECRET` - Secreto para JWT
- `NODE_ENV` - production

### 4. Desplegar en Vercel
```bash
vercel --prod
```

O usa el dashboard de Vercel para hacer deploy desde tu repositorio.

## Notas Importantes

### Almacenamiento de Archivos
- **Antes:** Los archivos se guardaban en `/uploads/` en el servidor
- **Ahora:** Los archivos se convierten a base64 y se guardan en MongoDB
- **Ventaja:** Funciona perfectamente en serverless
- **Consideración:** Los archivos base64 ocupan ~33% más espacio que los binarios

### Límites de Archivos
- Reportes: Máximo 10 archivos, 15MB cada uno
- Fotos de perfil: Máximo 5MB
- Timeout de solicitudes: 2 minutos

### Compatibilidad
- Los cambios son retrocompatibles con el frontend existente
- Los datos antiguos en MongoDB seguirán funcionando
- Las nuevas imágenes se almacenan en formato base64

## Testing

Después de desplegar, prueba:

1. **Registro de usuario:** Crear una nueva cuenta
2. **Login:** Iniciar sesión con credenciales
3. **Crear reporte:** 
   - Sin archivos adjuntos
   - Con imágenes (JPG, PNG)
   - Con PDF
4. **Actualizar perfil:**
   - Cambiar nombre
   - Cambiar departamento
   - Subir foto de perfil
   - Eliminar foto de perfil
5. **Verificar en móvil:** Probar desde un dispositivo móvil real

## Si Hay Problemas

### Verificar Logs en Vercel
```
vercel logs --prod
```

### Problemas Comunes

1. **"No hay token de autenticación"**
   - Limpiar localStorage y volver a iniciar sesión
   
2. **"Error del servidor: 413"**
   - El archivo es demasiado grande, reducir tamaño

3. **"Perfil no encontrado"**
   - El backend creará automáticamente un perfil nuevo
   - Verificar que el email en el token sea correcto

## Soporte

Si encuentras problemas adicionales:
1. Revisa los logs en el dashboard de Vercel
2. Verifica que las variables de entorno estén configuradas
3. Asegúrate de que MongoDB Atlas permita conexiones desde cualquier IP (0.0.0.0/0) o las IPs de Vercel
