# Sistema de Reportes - Presidencia Municipal de Montemorelos

## 🚀 Descripción
Sistema web completo para gestión de reportes y quejas ciudadanas para la Presidencia Municipal de Montemorelos.

## 📋 Características
- ✅ Sistema de autenticación seguro
- ✅ Gestión de reportes con imágenes
- ✅ Panel de administración
- ✅ Generador de códigos QR
- ✅ Exportación de datos
- ✅ Responsive design

## 🛠️ Tecnologías Utilizadas
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, MongoDB
- **Despliegue**: Vercel

## 📦 Instalación

### Requisitos previos
- Node.js 18+
- MongoDB
- npm o yarn

### Instalación local
```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local .env

# Iniciar MongoDB
mongod

# Iniciar el servidor de desarrollo
npm run dev

# Iniciar el servidor backend
npm run server
```

## 🚀 Despliegue

### Desarrollo local
```bash
npm run dev
npm run server
```

### Producción (Vercel)
1. Configurar variables de entorno en Vercel:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL`

2. Desplegar:
```bash
vercel --prod
```

## 🔧 Configuración de Variables de Entorno

### Desarrollo (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:5713/api
MONGO_URI=mongodb://localhost:27017/reportes_montemorelos
JWT_SECRET=tu-secreto-jwt
NODE_ENV=development
PORT=5713
```

### Producción (.env.production)
```bash
VITE_API_BASE_URL=https://sistema-reportes-montemorelos.vercel.app/api
MONGO_URI=@mongo_uri
JWT_SECRET=@jwt_secret
NODE_ENV=production
```

## 📱 Uso

### Usuario
1. Registrarse en la plataforma
2. Iniciar sesión
3. Crear reportes con imágenes
4. Seguimiento de reportes

### Administrador
1. Acceso al panel de administración
2. Gestión de reportes (estado, prioridad)
3. Exportación de datos
4. Gestión de usuarios

## 🔐 Credenciales de prueba
- **Admin**: admin@montemorelos.gob.mx / admin123
- **Usuario**: user@ejemplo.com / user123

## 📊 API Endpoints

### Reportes
- `GET /api/reportes` - Obtener todos los reportes
- `POST /api/reportes` - Crear nuevo reporte
- `PATCH /api/reportes/:id` - Actualizar reporte
- `DELETE /api/reportes/:id` - Eliminar reporte

### Usuarios
- `POST /api/register` - Registrar usuario
- `POST /api/login` - Iniciar sesión
- `GET /api/perfil/:email` - Obtener perfil
- `PUT /api/perfil/:email` - Actualizar perfil

## 🐛 Solución de Problemas

### Error de CORS
Asegúrate de que las URLs estén correctamente configuradas en el archivo `server.js`

### Error de conexión a MongoDB
Verifica que MongoDB esté ejecutándose y la URI esté correcta

### Error de puerto en uso
Cambia el puerto en el archivo `.env.local`

## 📞 Soporte
Para problemas o consultas, contactar al equipo de desarrollo.

## 📄 Licencia
Este proyecto es propiedad de la Presidencia Municipal de Montemorelos.
