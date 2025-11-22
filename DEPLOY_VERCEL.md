# Guía de Despliegue a Vercel

Esta guía explica cómo desplegar la aplicación de la Presidencia Municipal de Montemorelos en Vercel.

## Requisitos Previos

1. Tener una cuenta en Vercel (https://vercel.com)
2. Tener instalado Node.js (versión 16 o superior)
3. Tener instalado Git y haber clonado el repositorio

## Configuración de Variables de Entorno

Antes de desplegar, asegúrate de tener configuradas las siguientes variables de entorno en el dashboard de Vercel:

1. `MONGO_URI`: URL de conexión a tu base de datos MongoDB Atlas
2. `JWT_SECRET`: Clave secreta para firmar los Tokens de Autenticación
3. `NODE_ENV`: production
4. `FRONTEND_URL`: URL del frontend en producción (https://app-web-presidencia-montemorelos.vercel.app)
5. `VITE_API_BASE_URL`: URL base para las llamadas a la API del frontend (https://app-web-presidencia-montemorelos.vercel.app/api)

## Pasos para el Despliegue

### Método 1: Usando el Script Automatizado

1. Abre una terminal en el directorio raíz del proyecto
2. Ejecuta el siguiente comando:
   ```bash
   npm run deploy-vercel
   ```
3. Sigue las instrucciones que aparezcan en pantalla

### Método 2: Despliegue Manual

1. Abre una terminal en el directorio raíz del proyecto
2. Instala la CLI de Vercel si no la tienes:
   ```bash
   npm i -g vercel
   ```
3. Construye la aplicación:
   ```bash
   npm run build
   ```
4. Despliega a Vercel:
   ```bash
   vercel --prod
   ```
5. Sigue las instrucciones que aparezcan en pantalla

## Configuración Post-Despliegue

Una vez desplegada la aplicación, asegúrate de:

1. Configurar las variables de entorno en el dashboard de Vercel
2. Verificar que todas las rutas funcionen correctamente
3. Probar la generación de códigos QR en dispositivos móviles
4. Verificar que el formulario de reportes funcione correctamente

## Solución de Problemas Comunes

### Problema: Error al conectar con la base de datos
**Solución:** Verifica que la variable `MONGO_URI` esté correctamente configurada en el dashboard de Vercel.

### Problema: Error de autenticación
**Solución:** Verifica que la variable `JWT_SECRET` esté correctamente configurada en el dashboard de Vercel.

### Problema: Los códigos QR no funcionan en dispositivos móviles
**Solución:** Verifica que la URL generada en el componente QRGenerator.tsx sea la correcta para el entorno de producción.

### Problema: Error de CORS
**Solución:** Verifica que la variable `FRONTEND_URL` esté correctamente configurada en el dashboard de Vercel.

## Soporte

Si encuentras algún problema durante el despliegue, por favor contacta al equipo de desarrollo.
