# Guía de Despliegue en Vercel

## Requisitos Previos

1. Tener una cuenta en [Vercel](https://vercel.com)
2. Tener instalado [Node.js](https://nodejs.org) (versión 18 o superior)
3. Tener instalado [Vercel CLI](https://vercel.com/docs/cli) o instalarlo con el script

## Configuración de Variables de Entorno

Antes de desplegar, asegúrate de configurar las siguientes variables de entorno en Vercel:

- `MONGO_URI`: URI de conexión a tu base de datos MongoDB Atlas
- `JWT_SECRET`: Clave secreta para firmar los tokens JWT
- `FRONTEND_URL`: URL de tu aplicación en producción (ej: https://sistema-reportes-montemorelos.vercel.app)
- `NODE_ENV`: `production`
- `VERCEL`: `1`

## Opciones de Despliegue

### Opción 1: Usar el script de despliegue (Recomendado)

1. Abre una terminal en el directorio del proyecto: `cd "Aplicacion Web Presidencia Montemorelos/project"`
2. Ejecuta el script de despliegue:
   - En Windows: `vercel-deploy.bat`
   - En Linux/Mac: `node deploy.js`

### Opción 2: Usar los comandos manualmente

1. Abre una terminal en el directorio del proyecto: `cd "Aplicacion Web Presidencia Montemorelos/project"`
2. Instala las dependencias: `npm install`
3. Construye el proyecto: `npm run build`
4. Despliega en Vercel: `vercel --prod`

### Opción 3: Despliegue desde GitHub (Recomendado para producción continua)

1. Sube tu código a un repositorio de GitHub
2. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
3. Haz clic en "New Project"
4. Importa tu repositorio desde GitHub
5. Configura las variables de entorno en la sección "Environment Variables"
6. Haz clic en "Deploy"

## Verificación Post-Despliegue

Después del despliegue, verifica que:

1. La aplicación se carga correctamente en la URL proporcionada por Vercel
2. Los endpoints de API responden correctamente:
   - `https://tu-app.vercel.app/api/reportes`
   - `https://tu-app.vercel.app/api/estadisticas`
3. Puedes iniciar sesión y crear reportes
4. Las imágenes se cargan y muestran correctamente

## Solución de Problemas Comunes

### Error: "Cannot find module"
- Asegúrate de que todas las dependencias estén en `package.json`
- Ejecuta `npm install` antes del despliegue

### Error: CORS
- Verifica que `FRONTEND_URL` esté correctamente configurada en las variables de entorno de Vercel
- Asegúrate de que el frontend apunte al backend correctamente

### Error: MongoDB
- Verifica que `MONGO_URI` esté correctamente configurada en las variables de entorno de Vercel
- Asegúrate de que tu IP esté whitelisteada en MongoDB Atlas

### Error: "Build failed"
- Verifica que no haya errores de TypeScript o ESLint
- Ejecuta `npm run build` localmente para detectar problemas antes de desplegar

## Comandos Útiles

```bash
# Despliegue en producción
vercel --prod

# Despliegue en preview
vercel

# Ver logs
vercel logs tu-app.vercel.app

# Configurar variables de entorno
vercel env add MONGO_URI production
```

## Estructura del Proyecto

```
project/
├── api/
│   └── index.js          # Backend para Vercel
├── src/                  # Frontend React
├── server.js            # Backend Express
├── vercel.json          # Configuración de Vercel
├── .env.production      # Variables de entorno de producción
├── deploy.js            # Script de despliegue para Linux/Mac
├── vercel-deploy.bat    # Script de despliegue para Windows
└── package.json         # Dependencias y scripts
```
