# Solución para problemas en dispositivos móviles

## Problemas identificados

1. Configuración de API no optimizada para dispositivos móviles
2. Configuración de CORS restrictiva para algunos dispositivos móviles
3. Falta de headers de seguridad y compatibilidad para móviles
4. Detección incorrecta de dispositivos móviles

## Archivos modificados

Se han creado nuevos archivos con las mejoras necesarias:

1. `apiConfig.ts.new` - Configuración mejorada de la API para dispositivos móviles
2. `server-vercel.js.new` - Servidor mejorado con soporte para móviles
3. `vercel.json.new` - Configuración mejorada de Vercel para móviles

## Pasos para aplicar los cambios

1. Reemplazar los archivos originales con los nuevos archivos:

   ```bash
   # Reemplazar apiConfig.ts
   mv src/services/apiConfig.ts.new src/services/apiConfig.ts

   # Reemplazar server-vercel.js
   mv server-vercel.js.new server-vercel.js

   # Reemplazar vercel.json
   mv vercel.json.new vercel.json
   ```

2. Reconstruir la aplicación:

   ```bash
   npm run build
   ```

3. Desplegar a Vercel:

   ```bash
   npm run deploy-vercel
   ```

## Cambios principales

### apiConfig.ts
- Se agregó detección de dispositivos móviles
- Se mejoró la configuración de URLs para dispositivos móviles
- Se optimizó la generación de URLs absolutas

### server-vercel.js
- Se mejoró la configuración de CORS para dispositivos móviles
- Se agregó middleware para detectar dispositivos móviles
- Se optimizaron los headers de respuesta

### vercel.json
- Se agregaron headers de seguridad
- Se mejoró la configuración de rutas para móviles
- Se optimizaron los headers de CORS

## Variables de entorno necesarias

Asegúrate de tener configuradas las siguientes variables de entorno en Vercel:

- MONGO_URI
- JWT_SECRET
- NODE_ENV: production
- FRONTEND_URL: https://app-web-presidencia-montemorelos.vercel.app
- VITE_API_BASE_URL: https://app-web-presidencia-montemorelos.vercel.app/api

## Pruebas

Después de aplicar los cambios, prueba la aplicación en diferentes dispositivos móviles para verificar que todo funciona correctamente.
