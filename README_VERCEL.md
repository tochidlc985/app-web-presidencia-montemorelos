# Instrucciones para despliegue en Vercel

## Configuración realizada

1. **Archivos de configuración creados/modificados**:
   - `vercel.json`: Configuración para el despliegue en Vercel con las variables de entorno necesarias
   - `now.json`: Configuración alternativa para Vercel
   - `.env.example`: Plantilla para las variables de entorno
   - `vite.config.ts`: Mejora en la configuración del proxy para desarrollo y producción
   - `src/services/apiConfig.ts`: Mejora en la configuración de la URL base de la API
   - `api/index.js`: Mejora en la configuración de CORS y detección de entorno Vercel

2. **Variables de entorno configuradas**:
   - `NODE_ENV`: "production"
   - `MONGO_URI`: URL de conexión a MongoDB Atlas
   - `JWT_SECRET`: Clave secreta para JWT
   - `FRONTEND_URL`: URL del frontend en producción
   - `VITE_API_BASE_URL`: URL base para las llamadas a la API
   - `PROD`: "true"
   - `VERCEL`: "1" (para detección del entorno Vercel)

## Pasos para el despliegue

1. **Conectar el repositorio a Vercel**:
   - Inicia sesión en tu cuenta de Vercel
   - Haz clic en "New Project"
   - Conecta tu repositorio de GitHub, GitLab o Bitbucket

2. **Configurar las variables de entorno**:
   - En la sección "Environment Variables" de Vercel, añade todas las variables de entorno necesarias
   - Asegúrate de que `MONGO_URI` y `JWT_SECRET` tengan valores correctos y seguros

3. **Configurar el despliegue**:
   - Vercel detectará automáticamente que es un proyecto de React/Node.js
   - Asegúrate de que el "Build Command" sea `npm run build`
   - Asegúrate de que el "Output Directory" sea `dist`
   - Asegúrate de que el "Install Command" sea `npm install`

4. **Desplegar**:
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará tu aplicación

## Solución de problemas comunes

1. **Error de CORS**:
   - Asegúrate de que `FRONTEND_URL` esté configurada correctamente
   - Verifica que la configuración de CORS en `api/index.js` permita el origen de tu frontend

2. **Error de conexión a la base de datos**:
   - Verifica que `MONGO_URI` esté configurada correctamente
   - Asegúrate de que la IP de Vercel esté en la lista blanca de MongoDB Atlas

3. **Error de autenticación**:
   - Verifica que `JWT_SECRET` sea el mismo en ambos entornos
   - Asegúrate de que las cookies se estén enviando correctamente

4. **Error de rutas**:
   - Verifica que las rutas en `vercel.json` o `now.json` estén configuradas correctamente
   - Asegúrate de que las rutas de la API estén redirigidas correctamente

## Notas adicionales

- La aplicación está configurada para funcionar tanto en desarrollo como en producción
- Las variables de entorno se cargan automáticamente desde la configuración de Vercel
- La configuración de CORS permite solicitudes desde el dominio de Vercel y desde localhost en desarrollo
- La configuración de proxy en `vite.config.ts` permite que las llamadas a la API se redirijan correctamente en ambos entornos
