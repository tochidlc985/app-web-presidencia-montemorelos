# Solución de problemas para Vercel

## Problemas identificados

1. **Configuración de API incorrecta**: La aplicación no está usando correctamente las rutas de API en Vercel.
2. **Problemas con el manejo de archivos estáticos**: Los archivos subidos no se están sirviendo correctamente en Vercel.
3. **Configuración de vercel.json incompleta**: La configuración actual no maneja adecuadamente todas las rutas necesarias.

## Pasos para solucionar

### 1. Reemplazar archivos existentes

Reemplace los siguientes archivos con las versiones nuevas que se han creado:

- `src/services/apiConfig.ts` → `src/services/apiConfig.ts.new`
- `vercel.json` → `vercel.json.new`
- `api/vercel.js` → `api/vercel.js.new`

### 2. Variables de entorno en Vercel

Asegúrese de que las siguientes variables de entorno estén configuradas correctamente en Vercel:

```
MONGO_URI=mongodb+srv://RobertoCarlos:9sXvNyenlCepWq7n@almacenmultinacional.3zwaw.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=df2a6f8b9e1c5d0a4b7f3e6a9d2c1e8f5b4a7d0c3e6f9a8b1c4d7e0a2b5f8c9d
FRONTEND_URL=https://sistema-reportes-montemorelos.vercel.app
NODE_ENV=production
```

### 3. Configuración de build en Vercel

Asegúrese de que la configuración de build en Vercel esté configurada así:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Despliegue

1. Suba los cambios a su repositorio.
2. Vuelva a desplegar la aplicación en Vercel.

## Notas importantes

- La aplicación ahora usará `/api` como prefijo para todas las solicitudes de API en producción.
- Los archivos estáticos (imágenes, videos) se servirán correctamente a través de la ruta `/uploads`.
- La configuración de CORS ha sido mejorada para permitir solicitudes desde el frontend desplegado en Vercel.

Si sigue estos pasos, su aplicación debería funcionar correctamente en Vercel.
