import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { db } from './database.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure environment variables for Vercel
dotenv.config();

// Validate required environment variables
if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not defined');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not defined');
  process.exit(1);
}

const app = express();

// Configure CORS for production - Mejorado para móviles
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:5713',
      'http://localhost:6173',
      'https://app-web-presidencia-montemorelos.vercel.app'
    ];

    if (process.env.NODE_ENV === 'production') {
      // In production, allow the actual Vercel domain
      if (origin && origin.includes('vercel.app')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 204, // Para navegadores antiguos
  preflightContinue: false
}));

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Middleware para detectar dispositivos móviles
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  req.isMobile = isMobile;
  next();
});

// Serve static files from dist folder (production build)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Serving static files from:', distPath);
} else {
  console.log('Dist directory not found:', distPath);
}

// API Routes
// Report routes
app.post('/api/reportes', async (req, res) => {
  try {
    const reporte = req.body;

    // Validation
    if (!reporte.email || !reporte.departamento || !reporte.descripcion || !reporte.tipoProblema || !reporte.quienReporta) {
      return res.status(400).json({ message: 'Faltan campos requeridos en el reporte' });
    }

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

// User routes
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

// Statistics route
app.get('/api/estadisticas', async (req, res) => {
  try {
    const stats = await db.obtenerEstadisticas();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// Profile routes
app.get('/api/perfil/:email', async (req, res) => {
  try {
    const perfil = await db.buscarPerfilPorEmail(req.params.email);
    if (!perfil) return res.status(404).json({ message: 'Perfil no encontrado' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

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

// Middleware para verificar JWT y rol
function requireRole(role) {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No autorizado' });
    const token = auth.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Verificar si tiene el rol requerido (compatible con array o string)
      const userRoles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles || decoded.rol];
      if (!userRoles.includes(role)) return res.status(403).json({ message: 'Permiso denegado' });
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
}

// Update and delete reporte routes
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

app.delete('/api/reportes/:id', requireRole('administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    // Obtener reporte antes de eliminar
    const reporte = await db.obtenerReportePorId(id);
    const ok = await db.eliminarReporte(id);

    if (ok) {
      res.json({ message: 'Reporte eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Reporte no encontrado' });
    }
  } catch (error) {
    console.error('Error en DELETE /api/reportes/:id:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Si no existe el archivo index.html en dist, intentar servir el index.html de la carpeta public
    const publicIndexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(publicIndexPath)) {
      res.sendFile(publicIndexPath);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error en el servidor', error: err.message });
});

// Export for Vercel
export default app;