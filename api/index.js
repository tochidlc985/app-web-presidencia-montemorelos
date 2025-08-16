import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { db } from '../database.js';

const app = express();

// Configurar CORS para producción
app.use(cors({
  origin: [
    'https://sistema-reportes-montemorelos.vercel.app',
    'http://localhost:5713'
  ],
  credentials: true
}));

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Configurar multer para uploads
const uploadDir = path.join('/tmp', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Middleware para verificar JWT
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

// Rutas API
app.get('/api/reportes', async (req, res) => {
  try {
    const reportes = await db.obtenerReportes();
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reportes', error: error.message });
  }
});

app.post('/api/reportes', upload.array('imagenes', 10), async (req, res) => {
  try {
    const reporte = req.body.data ? JSON.parse(req.body.data) : req.body;
    const files = req.files || [];
    reporte.imagenes = files.map(f => f.filename);

    const ok = await db.guardarReporte(reporte);
    if (ok) {
      res.status(201).json({ message: 'Reporte guardado correctamente' });
    } else {
      res.status(500).json({ message: 'Error al guardar el reporte' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
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

// Exportar para Vercel
export default app;
