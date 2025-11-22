import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { db } from './database.js';

// Importar módulos necesarios para Vercel
import { createServer } from 'http';

// Importar el manejador de errores
import { errorHandler, notFoundHandler, asyncHandler } from './errorHandler.js';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar archivo de entorno según el entorno
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve(__dirname, envFile) });

// Configuración para entorno
if (process.env.NODE_ENV === 'production') {
  console.log('Ejecutando en entorno de producción (Vercel)');
} else {
  console.log('Ejecutando en entorno local');
}

const app = express();
const PORT = process.env.PORT || 5000; // Usar puerto 5000 o el puerto definido en el entorno

// Middleware globales
app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como apps móviles)
    if (!origin) return callback(null, true);
    
    // Permitir el origen de desarrollo
    const allowedOrigins = [
      'http://localhost:6173',
      'http://localhost:5713',
      'http://127.0.0.1:6173',
      'http://127.0.0.1:5713'
    ];
    
    // Si estamos en desarrollo, permitir cualquier origen localhost
    if (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost:')) {
      return callback(null, true);
    }
    
    // Permitir cualquier origen en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para loguear solicitudes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Configuración de multer
const uploadDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB máximo por archivo
  fileFilter: (req, file, cb) => {
    // Permitir imágenes, videos y GIFs
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'video/webm', 'video/ogg'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes (jpg, png, gif) y videos (mp4, webm, ogg)'));
    }
    cb(null, true);
  }
});

// Servir archivos subidos
app.use('/uploads', express.static(uploadDir));

// Middleware para verificar JWT y rol
function requireRole(roles) {
  // Convertir a array si es un string
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No autorizado' });
    const token = auth.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Verificar si tiene el rol requerido (compatible con array o string)
      const userRoles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles || decoded.rol];
      
      // Verificar si el usuario tiene al menos uno de los roles permitidos
      const hasPermission = allowedRoles.some(role => userRoles.includes(role));
      if (!hasPermission) {
        return res.status(403).json({ 
          message: 'Permiso denegado', 
          requiredRoles: allowedRoles,
          userRoles: userRoles 
        });
      }
      
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
}

/* ========================
   API: Reportes
======================== */

// Crear un nuevo reporte con imágenes
app.post('/api/reportes', upload.array('imagenes', 10), async (req, res) => {
  try {
    const files = req.files || [];
    const reporte = req.body.data ? JSON.parse(req.body.data) : req.body;

    // Validación robusta - email es opcional para creaciones internas
    if (!reporte.departamento || !reporte.descripcion || !reporte.tipoProblema || !reporte.quienReporta) {
      return res.status(400).json({ message: 'Faltan campos requeridos en el reporte' });
    }
    if (!Array.isArray(reporte.departamento) || reporte.departamento.length === 0) {
      return res.status(400).json({ message: 'El campo departamento debe ser un arreglo con al menos un valor' });
    }
    if (reporte.email && (typeof reporte.email !== 'string' || !reporte.email.includes('@'))) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    if (files.some(f => f.size > 10 * 1024 * 1024)) {
      return res.status(400).json({ message: 'Algún archivo excede el tamaño máximo de 10MB' });
    }

    reporte.imagenes = files.map(f => f.filename);

    const ok = await db.guardarReporte(reporte);
    if (ok) {
      res.status(201).json({ message: 'Reporte guardado correctamente', insertedId: ok.insertedId });
    } else {
      res.status(500).json({ message: 'Error al guardar el reporte' });
    }
  } catch (error) {
    console.error('Error en POST /api/reportes:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

app.get('/api/reportes', async (req, res) => {
  try {
    const reportes = await db.obtenerReportes();
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reportes', error: error.message });
  }
});

// Actualizar estado o prioridad del reporte
app.patch('/api/reportes/:id', requireRole(['administrador', 'jefe_departamento', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    
    // Validar que el ID sea válido
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: 'ID de reporte inválido' });
    }
    
    // Validar que haya datos para actualizar
    if (!update || Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No hay datos para actualizar' });
    }
    
    console.log(`Actualizando reporte ${id} con datos:`, update);
    
    const ok = await db.actualizarReporte(id, update);
    if (ok) {
      // Obtener el reporte actualizado para devolverlo
      const reporteActualizado = await db.obtenerReportePorId(id);
      res.json({ 
        message: 'Reporte actualizado correctamente',
        reporte: reporteActualizado ? { ...reporteActualizado, _id: reporteActualizado._id.toString() } : null
      });
    } else {
      res.status(404).json({ message: 'Reporte no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar reporte:', error);
    res.status(500).json({ message: 'Error al actualizar reporte', error: error.message });
  }
});

// Eliminar reporte y borrar imágenes asociadas
app.delete('/api/reportes/:id', requireRole(['administrador', 'jefe_departamento', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID sea válido
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: 'ID de reporte inválido' });
    }
    
    console.log(`Eliminando reporte ${id}`);
    
    // Obtener reporte antes de eliminar
    const reporte = await db.obtenerReportePorId(id);
    if (!reporte) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    
    const ok = await db.eliminarReporte(id);

    if (ok) {
      // Eliminar archivos asociados
      if (reporte && reporte.imagenes) {
        reporte.imagenes.forEach(img => {
          try {
            const filePath = path.join(uploadDir, img);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Archivo eliminado: ${filePath}`);
            }
          } catch (fileError) {
            console.warn(`No se pudo eliminar el archivo ${img}:`, fileError.message);
          }
        });
      }
      res.json({ message: 'Reporte eliminado correctamente', id });
    } else {
      res.status(500).json({ message: 'Error al eliminar el reporte de la base de datos' });
    }
  } catch (error) {
    console.error('Error en DELETE /api/reportes/:id:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

/* ========================
   API: Usuarios
======================== */

// Registrar usuario
app.post('/api/register', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const usuario = await db.registrarUsuario({ nombre, email, password, rol });
    res.status(201).json({ message: 'Usuario registrado correctamente', usuario });
  } catch (error) {
    if (error.message === 'El usuario ya existe') {
      res.status(409).json({ message: 'El usuario ya existe' });
    } else {
      console.error('Error en POST /api/register:', error);
      res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    }
  }
});

// Login usuario
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }
    const usuario = await db.autenticarUsuario({ email, password });
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    // Generar JWT
    const token = jwt.sign(
      { email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ usuario, token });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
});

// Obtener perfil de usuario
app.get('/api/perfil/:email', async (req, res) => {
  try {
    const perfil = await db.buscarPerfilPorEmail(req.params.email);
    if (!perfil) return res.status(404).json({ message: 'Perfil no encontrado' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

// Actualizar perfil de usuario
app.put('/api/perfil/:email', async (req, res) => {
  try {
    console.log(`Intentando actualizar perfil para email: ${req.params.email}`);
    console.log('Datos a actualizar:', JSON.stringify(req.body, null, 2));

    const ok = await db.actualizarPerfilUsuario(req.params.email, req.body);
    if (ok) {
      console.log(`Perfil actualizado correctamente para email: ${req.params.email}`);

      // Obtener el perfil actualizado para devolverlo
      try {
        const perfilActualizado = await db.buscarPerfilPorEmail(req.params.email);
        res.json({ 
          message: 'Perfil actualizado correctamente', 
          usuario: perfilActualizado 
        });
      } catch (error) {
        // Si hay error al obtener el perfil actualizado, devolver los datos originales
        console.warn(`No se pudo obtener el perfil actualizado para ${req.params.email}, devolviendo datos originales`);
        res.json({ 
          message: 'Perfil actualizado correctamente', 
          usuario: req.body 
        });
      }
    } else {
      console.log(`No se encontró perfil para email: ${req.params.email}`);
      res.status(404).json({ message: 'Perfil no encontrado' });
    }
  } catch (error) {
    console.error(`Error al actualizar perfil para email: ${req.params.email}:`, error);
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
});

// Subir foto de perfil
app.post('/api/perfil/:email/foto', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
    }

    const fotoUrl = `/uploads/${req.file.filename}`;
    const ok = await db.actualizarPerfilUsuario(req.params.email, { foto: fotoUrl });

    if (ok) {
      res.json({ message: 'Foto de perfil subida correctamente', fotoUrl });
    } else {
      res.status(404).json({ message: 'Perfil no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al subir foto de perfil', error: error.message });
  }
});

// Eliminar foto de perfil
app.delete('/api/perfil/:email/foto', async (req, res) => {
  try {
    // Obtener el perfil actual para saber qué foto eliminar
    const perfil = await db.buscarPerfilPorEmail(req.params.email);

    if (!perfil) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    // Si hay una foto, eliminar el archivo
    if (perfil.foto && perfil.foto.startsWith('/uploads/')) {
      const fotoPath = path.join(uploadDir, perfil.foto.replace('/uploads/', ''));
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    // Actualizar el perfil para eliminar la referencia a la foto
    const ok = await db.actualizarPerfilUsuario(req.params.email, { foto: null });

    if (ok) {
      res.json({ message: 'Foto de perfil eliminada correctamente' });
    } else {
      res.status(404).json({ message: 'Perfil no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar foto de perfil', error: error.message });
  }
});

// Obtener estadísticas
app.get('/api/estadisticas', async (req, res) => {
  try {
    const stats = await db.obtenerEstadisticas();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// Ruta principal - servir el archivo index.html del frontend
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // En Vercel, servimos el archivo dist/index.html
    const indexPath = path.join(__dirname, 'dist/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Si no existe el archivo en la ruta esperada, intentar con rutas alternativas
      const altIndexPath = path.join(process.cwd(), 'dist/index.html');
      if (fs.existsSync(altIndexPath)) {
        res.sendFile(altIndexPath);
      } else {
        res.status(500).send('Error: No se encontró el archivo index.html');
      }
    }
  } else {
    // En desarrollo, servimos el archivo public/index.html
    const publicPath = path.join(__dirname, 'public/index.html');
    if (fs.existsSync(publicPath)) {
      res.sendFile(publicPath);
    } else {
      res.status(500).send('Error: No se encontró el archivo index.html en el directorio public');
    }
  }
});

// Servir archivos estáticos del frontend
if (process.env.NODE_ENV === 'production') {
  // En producción, servimos los archivos estáticos desde la carpeta dist
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  } else {
    // Si no existe la carpeta en la ruta esperada, intentar con rutas alternativas
    const altDistPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(altDistPath)) {
      app.use(express.static(altDistPath));
    } else {
      console.error('No se encontró la carpeta dist para servir archivos estáticos en producción');
    }
  }
} else {
  // En desarrollo, servimos los archivos estáticos desde la carpeta public
  const publicPath = path.join(__dirname, 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  } else {
    console.error('No se encontró la carpeta public para servir archivos estáticos en desarrollo');
    // Intentar con rutas alternativas
    const altPublicPath = path.join(process.cwd(), 'public');
    if (fs.existsSync(altPublicPath)) {
      app.use(express.static(altPublicPath));
      console.log('Sirviendo archivos estáticos desde:', altPublicPath);
    }
  }

  // También servimos la carpeta src para desarrollo
  const srcPath = path.join(__dirname, 'src');
  if (fs.existsSync(srcPath)) {
    app.use('/src', express.static(srcPath));
  } else {
    // Intentar con rutas alternativas
    const altSrcPath = path.join(process.cwd(), 'src');
    if (fs.existsSync(altSrcPath)) {
      app.use('/src', express.static(altSrcPath));
      console.log('Sirviendo archivos src desde:', altSrcPath);
    }
  }

  // Servir node_modules si es necesario
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    app.use('/node_modules', express.static(nodeModulesPath));
  } else {
    // Intentar con rutas alternativas
    const altNodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(altNodeModulesPath)) {
      app.use('/node_modules', express.static(altNodeModulesPath));
      console.log('Sirviendo node_modules desde:', altNodeModulesPath);
    }
  }
}

app.use(notFoundHandler);
app.use(errorHandler);

// Crear servidor HTTP
const server = createServer(app);

// Iniciar servidor
if (process.env.NODE_ENV !== 'production') {
  // Solo para desarrollo local
  server.listen(PORT, () => {
    console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
  });
}

// Exportar para Vercel serverless
export default app;

// Cerrar la conexión a la base de datos cuando se detiene el servidor
process.on('SIGINT', async () => {
  await db.close();
  console.log('Conexión a la base de datos cerrada');
  process.exit(0);
});
