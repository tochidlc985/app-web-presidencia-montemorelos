# Instrucciones para el despliegue en Vercel

## Pasos para el despliegue

1. Conecta tu repositorio de GitHub a Vercel.

2. Configura las variables de entorno en la sección "Environment Variables" de tu proyecto en Vercel:
   - MONGO_URI: URL de conexión a tu base de datos MongoDB Atlas
   - JWT_SECRET: Clave secreta para firmar los Tokens de Autenticación (JWT)
   - FRONTEND_URL: URL del frontend en producción (https://sistema-reportes-montemorelos.vercel.app)
   - NODE_ENV: production
   - PROD: true
   - VERCEL: 1

3. Asegúrate de que el directorio de salida esté configurado como `dist`.

4. El comando de build debe ser `npm run build`.

5. Despliega tu proyecto.

## Problemas comunes y soluciones

### Problema: "Error al conectar a la base de datos"
- Solución: Verifica que la cadena de conexión a MongoDB en las variables de entorno de Vercel sea correcta y que tengas acceso a la base de datos.

### Problema: "Error de CORS al acceder a la API"
- Solución: Asegúrate de que la variable `FRONTEND_URL` en las variables de entorno de Vercel coincida con la URL donde se está ejecutando el frontend.

### Problema: "Las imágenes no se muestran correctamente"
- Solución: En Vercel, los archivos subidos no persisten entre despliegues. Considera utilizar un servicio de almacenamiento externo como AWS S3 o Google Cloud Storage para producción.

### Problema: "Error 404 en las rutas de la API"
- Solución: Asegúrate de que todas las rutas en el archivo `api/index.js` incluyan el prefijo `/api` y que el archivo `vercel.json` esté configurado correctamente.

## Notas importantes

- El sistema usa MongoDB Atlas como base de datos.
- Las credenciales de la base de datos están en las variables de entorno de Vercel.
- Para producción, todas las rutas de la API deben incluir el prefijo `/api`.
- Los archivos subidos en Vercel solo persisten durante la vida de la función serverless, no entre despliegues.