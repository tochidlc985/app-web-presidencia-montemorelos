# Guía de Despliegue en Vercel

## Requisitos Previos

1. Tener una cuenta en [Vercel](https://vercel.com)
2. Tener instalado [Vercel CLI](https://vercel.com/docs/cli)
3. Tener tu proyecto en un repositorio de Git (GitHub, GitLab, o Bitbucket)

## Pasos para Desplegar

### Opción 1: Despliegue desde Git (Recomendado)

1. **Conectar repositorio**:
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Haz clic en "New Project"
   - Importa tu repositorio desde GitHub/GitLab/Bitbucket

2. **Configurar proyecto**:
   - **Root Directory**: `Aplicacion Web Presidencia Montemorelos/project`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Variables de entorno**:
   Ve a Settings > Environment Variables y agrega:
   - `MONGODB_URI`: Tu URI de MongoDB Atlas
   - `JWT_SECRET`: Un secreto seguro para JWT
   - `GOOGLE_CLIENT_EMAIL`: Email de tu service account (si usas Google Sheets)
   - `GOOGLE_PRIVATE_KEY`: Private key de tu service account
   - `GOOGLE_SHEET_ID`: ID de tu hoja de cálculo
   - `NODE_ENV`: `production`

### Opción 2: Despliegue manual con CLI

1. **Instalar Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Desde la carpeta del proyecto**:
   ```bash
   cd "Aplicacion Web Presidencia Montemorelos/project"
   vercel --prod
   ```

3. **Seguir las instrucciones interactivas**:
   - Selecciona tu proyecto
   - Configura las variables de entorno cuando se te solicite

## Verificación Post-Despliegue

1. **Verificar endpoints**:
   - `https://tu-app.vercel.app/api/reportes` (GET)
   - `https://tu-app.vercel.app/api/estadisticas` (GET)

2. **Probar funcionalidad**:
   - Crear un reporte de prueba
   - Verificar que las imágenes se cargan correctamente
   - Probar el login y registro de usuarios

## Solución de Problemas Comunes

### Error: "Cannot find module"
- Asegúrate de que todas las dependencias estén en `package.json`
- Ejecuta `npm install` antes del despliegue

### Error: CORS
- Verifica que `FRONTEND_URL` esté correctamente configurada
- Asegúrate de que el frontend apunte al backend correctamente

### Error: MongoDB
- Verifica que `MONGODB_URI` esté correctamente configurada
- Asegúrate de que tu IP esté whitelisteada en MongoDB Atlas

## Comandos Útiles

```bash
# Despliegue en producción
vercel --prod

# Despliegue en preview
vercel

# Ver logs
vercel logs tu-app.vercel.app

# Configurar variables de entorno
vercel env add MONGODB_URI production
```

## Estructura del Proyecto

```
project/
├── api/
│   └── index.js          # Backend para Vercel
├── src/                  # Frontend React
├── server.js            # Backend Express
├── vercel.json          # Configuración de Vercel
├── .env.example         # Variables de entorno de ejemplo
└── package.json         # Dependencias y scripts
