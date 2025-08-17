import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { db } from '../database.js';
import dotenv from 'dotenv';

// Cargar variables de entorno para Vercel
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de CORS para los puertos específicos
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5713',
      'http://localhost:4000',
      process.env.FRONTEND_URL || 'https://sistema-reportes-montemorelos.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir temporalmente para debugging
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Configurar directorio de uploads para Vercel
const uploadDir = path.join('/tmp', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'video/webm', 'video/ogg'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes y videos'));
    }
    cb(null, true);
  }
});

// Servir archivos estáticos
app.use('/uploads', express.static(uploadDir));

// Middleware de autenticación
function requireRole(role) {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No autorizado' });
    
    const token = auth.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.rol !== role) return res.status(403).json({ message: 'Permiso denegado' });
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
}

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    
    const usuario = await db.registrarUsuario({ nombre, email, password, rol });
    res.status(201).json({ message: 'Usuario registrado correctamente', usuario });
  } catch (error) {
    if (error.message === 'El usuario ya existe') {
      res.status(409).json({ message: 'El usuario ya existe' });
    } else {
      res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    }
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }
    
    const usuario = await db.autenticarUsuario({ email, password });
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

// Rutas de reportes
app.post('/api/reportes', upload.array('imagenes', 10), async (req, res) => {
  try {
    const files = req.files || [];
    const reporte = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    // Validación robusta
    if (!reporte.email || !reporte.departamento || !reporte.descripcion || !reporte.tipoProblema || !reporte.quienReporta) {
      return res.status(400).json({ message: 'Faltan campos requeridos en el reporte' });
    }
    if (!Array.isArray(reporte.departamento) || reporte.departamento.length === 0) {
      return res.status(400).json({ message: 'El campo departamento debe ser un arreglo con al menos un valor' });
    }
    if (typeof reporte.email !== 'string' || !reporte.email.includes('@')) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    if (files.some(f => f.size > 10 * 1024 * 1024)) {
      return res.status(400).json({ message: 'Algún archivo excede el tamaño máximo de 10MB' });
    }
    
    reporte.imagenes = files.map(f => f.filename);
    const ok = await db.guardarReporte(reporte);
    
    if (ok) {
      res.status(201).json({ message: 'Reporte guardado correctamente' });
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
app.patch('/api/reportes/:id', requireRole('administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const ok = await db.actualizarReporte(id, update);
    if (ok) {
      res.json({ message: 'Reporte actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Reporte no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar reporte', error: error.message });
  }
});

// Eliminar reporte (solo admin) y borrar imágenes asociadas
app.delete('/api/reportes/:id', requireRole('administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    // Obtener reporte antes de eliminar
    const reporte = await db.obtenerReportePorId(id);
    const ok = await db.eliminarReporte(id);

    if (ok) {
      // Eliminar archivos asociados
      if (reporte && reporte.imagenes) {
        reporte.imagenes.forEach(img => {
          const filePath = path.join(uploadDir, img);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      }
      res.json({ message: 'Reporte eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Reporte no encontrado' });
    }
  } catch (error) {
    console.error('Error en DELETE /api/reportes/:id:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

app.get('/api/estadisticas', async (req, res) => {
  try {
    const stats = await db.obtenerEstadisticas();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// Ruta de perfil
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
    const ok = await db.actualizarPerfilUsuario(req.params.email, req.body);
    if (ok) {
      res.json({ message: 'Perfil actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Perfil no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
});

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando correctamente' });
});

// Manejo de errores
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error en el servidor', error: err.message });
});

// Exportar para Vercel
export default app;
export const handler = app;
