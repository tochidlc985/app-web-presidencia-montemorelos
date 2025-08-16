import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { db } from '../database.js';

// Detectar si estamos en Vercel
const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION;

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // permitir apps sin origin

    // Permitir cualquier subdominio de vercel.app
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }

    // Desarrollo: permitir localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost:')) {
      return callback(null, true);
    }

    // Permitir solicitudes desde dispositivos móviles (como los que vienen de un QR)
    if (origin && process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }

    // Permitir solicitudes sin origen (móviles, apps nativas)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://sistema-reportes-montemorelos.vercel.app'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Subidas de archivos: usar /tmp en Vercel (sólo escritura temporal)
const uploadRoot = isVercel ? path.resolve('/tmp/uploads') : path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadRoot)) {
  try { fs.mkdirSync(uploadRoot, { recursive: true }); } catch {}
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
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
      return cb(new Error('Solo se permiten imágenes (jpg, png, gif) y videos (mp4, webm, ogg)'));
    }
    cb(null, true);
  }
});

// Servir archivos subidos (en Vercel es temporal durante la vida de la función)
app.use('/uploads', express.static(uploadRoot));

// Auth middleware (rol)
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

// Auth middleware (verificar token válido)
function verifyAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No autorizado' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

/* ========================
   API: Reportes
======================== */

// Crear un nuevo reporte con imágenes
app.post('/api/reportes', upload.array('imagenes', 10), async (req, res) => {
  try {
    const files = req.files || [];
    const reporte = req.body.data ? JSON.parse(req.body.data) : req.body;

    // Validaciones
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

// Obtener todos los reportes
app.get('/api/reportes', async (req, res) => {
  try {
    const reportes = await db.obtenerReportes();
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reportes', error: error.message });
  }
});

// Actualizar estado o prioridad del reporte (solo admin)
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

// Eliminar reporte (solo admin)
app.delete('/api/reportes/:id', requireRole('administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const reporte = await db.obtenerReportePorId(id);
    const ok = await db.eliminarReporte(id);
    if (ok) {
      if (reporte && reporte.imagenes) {
        reporte.imagenes.forEach(img => {
          const filePath = path.join(uploadRoot, img);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
          }
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

// Obtener perfil de usuario (por token)
app.get('/api/perfil', verifyAuth, async (req, res) => {
  try {
    const perfil = await db.buscarPerfilPorEmail(req.user.email);
    if (!perfil) return res.status(404).json({ message: 'Perfil no encontrado' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

// Obtener perfil de usuario (por email)
app.get('/api/perfil/:email', async (req, res) => {
  try {
    const perfil = await db.buscarPerfilPorEmail(req.params.email);
    if (!perfil) return res.status(404).json({ message: 'Perfil no encontrado' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

// Actualizar perfil de usuario (por token)
app.put('/api/perfil', verifyAuth, async (req, res) => {
  try {
    const ok = await db.actualizarPerfilUsuario(req.user.email, req.body);
    if (ok) {
      res.json({ message: 'Perfil actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Perfil no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
});

// Actualizar perfil de usuario (por email)
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

// Estadísticas
app.get('/api/estadisticas', async (req, res) => {
  try {
    const stats = await db.obtenerEstadisticas();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error en el servidor', error: err.message });
});

export default app;
