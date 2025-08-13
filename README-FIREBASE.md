# Sistema de Reportes - Presidencia Municipal de Montemorelos

Este proyecto consiste en un sistema de reportes para la Presidencia Municipal de Montemorelos, desarrollado con React para el frontend y Node.js/Express para el backend.

## Estructura del Proyecto

- `/src`: Código fuente del frontend (React)
- `/functions`: Código fuente del backend (Node.js/Express) para Firebase Functions
- `/public`: Archivos estáticos del frontend

## Despliegue en Firebase

### Prerrequisitos

1. Tener instalado Node.js (versión 18 o superior)
2. Tener instalada la Firebase CLI: `npm install -g firebase-tools`
3. Haber iniciado sesión en Firebase: `firebase login`

### Pasos para el despliegue

1. **Inicializar Firebase** (si aún no lo has hecho):
   ```bash
   cd "c:/xampp/htdocs/AppWebPresidenciaMontemorelos/Aplicacion Web Presidencia Montemorelos/project"
   firebase init
   ```
   Selecciona las opciones:
   - Hosting: Configure and deploy Firebase Hosting sites
   - Functions: Configure and deploy Cloud Functions

2. **Configurar el proyecto de Firebase**:
   - Selecciona "Use an existing project" o crea uno nuevo
   - Para el hosting, configura el directorio público como `dist`
   - Para las funciones, selecciona JavaScript como lenguaje

3. **Reemplazar el archivo firebase.json**:
   - Reemplaza el archivo firebase.json con el archivo `firebase.json.new` que hemos creado:
   ```bash
   copy firebase.json.new firebase.json
   ```

4. **Instalar dependencias de las funciones**:
   ```bash
   cd functions
   npm install
   cd ..
   ```

5. **Construir el frontend**:
   ```bash
   npm run build
   ```

6. **Desplegar el proyecto**:
   ```bash
   firebase deploy
   ```

### Configuración de variables de entorno

Para las funciones de Firebase, necesitas configurar las variables de entorno:

1. Abre la consola de Firebase
2. Ve a tu proyecto
3. Selecciona "Functions" en el menú izquierdo
4. Haz clic en el botón "Configuración" (engranaje) y selecciona "Variables de entorno"
5. Añade las siguientes variables:
   - `MONGO_URI`: URL de conexión a tu base de datos MongoDB Atlas
   - `JWT_SECRET`: Clave secreta para firmar tokens JWT

## Notas importantes

- El archivo `.env.production` contiene la URL de la API en producción. Debes reemplazar `tu-proyecto-id` con el ID real de tu proyecto de Firebase.
- Asegúrate de que tu base de datos MongoDB Atlas permita conexiones desde los servidores de Firebase Functions.
