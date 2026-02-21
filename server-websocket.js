import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { db } from './database.js';
import multer from 'multer';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

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

// ==========================================
// Configuración de WebSocket para tiempo real
// ==========================================

// Almacenamiento de conexiones WebSocket por usuario
const wsClients = new Map(); // email -> WebSocket
const wsClientsByRole = new Map(); // rol -> Set<WebSocket>

// Función para enviar mensaje a todos los clientes conectados
const broadcastToAll = (message) => {
  wsClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
};

// Función para enviar mensaje a un usuario específico
const sendToUser = (email, message) => {
  const ws = wsClients.get(email);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
};

// Función para enviar mensaje a todos los usuarios de un rol específico
const sendToRole = (role, message) => {
  const clients = wsClientsByRole.get(role) || new Set();
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
};

// Función para enviar mensaje a roles específicos
const sendToRoles = (roles, message) => {
  roles.forEach(role => {
    sendToRole(role, message);
  });
};

// Exportar funciones para usar en otros endpoints
export { broadcastToAll, sendToUser, sendToRole, sendToRoles };

// ==========================================
// Configure CORS for production - Mejorado para móviles y Vercel
// ==========================================

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:5713',
      'http://localhost:6173',
      'http://localhost:5000',
      'https://app-web-presidencia-montemorelos.vercel.app'
    ];

    // In production, allow any vercel.app domain
    if (process.env.NODE_ENV === 'production') {
      if (origin && (origin.includes('vercel.app') || origin.includes('localhost'))) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS - Allowing origin:', origin);
      callback(null, true); // Allow all origins in production for now
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false
}));

// IMPORTANTE: Configurar multer con memoryStorage para Vercel (no permite escritura en disco)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit para reportes
    files: 10 // máximo 10 archivos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo imágenes (JPG, PNG, GIF, WEBP), videos (MP4, WebM) y PDF.'), false);
    }
  }
});

// Multer específico para fotos de perfil (5MB máximo)
const uploadProfile = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit para fotos de perfil
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo imágenes JPG, PNG, GIF, WEBP.'), false);
    }
  }
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

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

// ==========================================
// API: Reportes
// ==========================================

// Crear un nuevo reporte con imágenes - USANDO MEMORY STORAGE
app.post('/api/reportes', upload.array('imagenes', 10), async (req, res) => {
  try {
    console.log('Recibiendo reporte...');
    console.log('Headers:', req.headers);
    console.log('Files recibidos:', req.files ? req.files.length : 0);

    const files = req.files || [];
    let reporte;

    try {
      reporte = req.body.data ? JSON.parse(req.body.data) : req.body;
    } catch (parseError) {
      console.error('Error parseando datos del reporte:', parseError);
      return res.status(400).json({ message: 'Formato de datos inválido' });
    }

    console.log('Datos del reporte:', JSON.stringify(reporte, null, 2));

    // Validation
    if (!reporte.departamento || !reporte.descripcion || !reporte.tipoProblema || !reporte.quienReporta) {
      return res.status(400).json({
        message: 'Faltan campos requeridos en el reporte',
        fields: {
          departamento: !reporte.departamento,
          descripcion: !reporte.descripcion,
          tipoProblema: !reporte.tipoProblema,
          quienReporta: !reporte.quienReporta
        }
      });
    }

    if (!Array.isArray(reporte.departamento) || reporte.departamento.length === 0) {
      return res.status(400).json({ message: 'El campo departamento debe ser un arreglo con al menos un valor' });
    }

    if (reporte.email && (typeof reporte.email !== 'string' || !reporte.email.includes('@'))) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    // Convertir archivos a base64 para almacenarlos en MongoDB
    // En Vercel no podemos guardar archivos en disco, así que los guardamos como base64
    if (files && files.length > 0) {
      reporte.imagenes = files.map(file => {
        const base64Data = file.buffer.toString('base64');
        return {
          nombre: file.originalname,
          tipo: file.mimetype,
          datos: `data:${file.mimetype};base64,${base64Data}`,
          tamaño: file.size
        };
      });
      console.log(`${files.length} archivos procesados y convertidos a base64`);
    }

    const ok = await db.guardarReporte(reporte);
    if (ok) {
      console.log('Reporte guardado exitosamente:', ok.insertedId);
      
      // Notificar en tiempo real a todos los roles que pueden ver reportes
      const reporteConId = { ...reporte, _id: ok.insertedId };
      sendToRoles(['administrador', 'jefe_departamento', 'tecnico'], {
        type: 'reporte_created',
        data: reporteConId,
        timestamp: new Date().toISOString()
      });
      
      // Notificar al usuario que creó el reporte
      if (reporte.email) {
        sendToUser(reporte.email, {
          type: 'reporte_created',
          data: reporteConId,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(201).json({
        message: 'Reporte guardado correctamente',
        insertedId: ok.insertedId
      });
    } else {
      res.status(500).json({ message: 'Error al guardar el reporte en la base de datos' });
    }
  } catch (error) {
    console.error('Error en POST /api/reportes:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

app.get('/api/reportes', async (req, res) => {
  try {
    const reportes = await db.obtenerReportes();
    res.json(reportes);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({ message: 'Error al obtener reportes', error: error.message });
  }
});

// ==========================================
// API: Usuarios
// ==========================================

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
      console.error('Error en POST /api/register:', error);
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
      {
        email: usuario.email,
        rol: usuario.rol,
        roles: usuario.roles || [usuario.rol] // Incluir ambos formatos para compatibilidad
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ usuario, token });
  } catch (error) {
    console.error('Error en POST /api/login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
});

// ==========================================
// API: Perfil de Usuario
// ==========================================

app.get('/api/perfil/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`Obteniendo perfil para: ${email}`);

    const perfil = await db.buscarPerfilPorEmail(email);
    if (!perfil) {
      console.log(`Perfil no encontrado para: ${email}`);
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    console.log(`Perfil encontrado para: ${email}`);
    res.json({ usuario: perfil }); // Devolver en formato consistente con el frontend
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

// Subir foto de perfil - USANDO MEMORY STORAGE
app.post('/api/perfil/:email/foto', uploadProfile.single('foto'), async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`Recibiendo foto de perfil para: ${email}`);

    if (!req.file) {
      return res.status(400).json({ message: 'No se ha proporcionado ninguna foto' });
    }

    console.log('Archivo recibido:', req.file.originalname, 'Tamaño:', req.file.size);

    // Convertir a base64 para almacenar en MongoDB
    const base64Data = req.file.buffer.toString('base64');
    const fotoUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    // Actualizar el perfil con la foto en base64
    const ok = await db.actualizarPerfilUsuario(email, { foto: fotoUrl });

    if (ok) {
      console.log(`Foto de perfil actualizada para: ${email}`);
      
      // Notificar en tiempo real al usuario
      sendToUser(email, {
        type: 'user_updated',
        data: { email, foto: fotoUrl },
        timestamp: new Date().toISOString()
      });
      
      res.json({
        message: 'Foto de perfil subida correctamente',
        fotoUrl: fotoUrl
      });
    } else {
      res.status(404).json({ message: 'Perfil no encontrado' });
    }
  } catch (error) {
    console.error('Error al subir foto de perfil:', error);
    res.status(500).json({ message: 'Error al subir foto de perfil', error: error.message });
  }
});

// Eliminar foto de perfil
app.delete('/api/perfil/:email/foto', async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`Eliminando foto de perfil para: ${email}`);

    // Actualizar el perfil eliminando la foto
    const ok = await db.actualizarPerfilUsuario(email, { foto: null });

    if (ok) {
      console.log(`Foto de perfil eliminada para: ${email}`);
      
      // Notificar en tiempo real al usuario
      sendToUser(email, {
        type: 'user_updated',
        data: { email, foto: null },
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: 'Foto eliminada correctamente' });
    } else {
      res.status(404).json({ message: 'Perfil no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar foto de perfil:', error);
    res.status(500).json({ message: 'Error al eliminar foto de perfil', error: error.message });
  }
});

// Actualizar perfil de usuario
app.put('/api/perfil/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`Actualizando perfil para: ${email}`);
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));

    // Validar que el email en el cuerpo coincida con el de la URL
    if (req.body.email && req.body.email !== email) {
      return res.status(400).json({
        message: 'El email en el cuerpo no coincide con el email en la URL'
      });
    }

    // Datos a actualizar (excluir campos que no deben modificarse)
    const updateData = { ...req.body };
    delete updateData._id; // No permitir cambiar el ID
    delete updateData.email; // El email ya está en la URL
    delete updateData.password; // La contraseña se maneja por separado

    // Asegurar que el email esté presente en los datos
    updateData.email = email;

    const ok = await db.actualizarPerfilUsuario(email, updateData);
    console.log('Resultado de actualización:', ok);

    if (ok) {
      console.log(`Perfil actualizado correctamente para: ${email}`);

      // Obtener el perfil actualizado para devolverlo
      try {
        const perfilActualizado = await db.buscarPerfilPorEmail(email);
        
        // Notificar en tiempo real al usuario
        sendToUser(email, {
          type: 'user_updated',
          data: perfilActualizado,
          timestamp: new Date().toISOString()
        });
        
        res.json({
          message: 'Perfil actualizado correctamente',
          usuario: perfilActualizado
        });
      } catch (error) {
        console.warn(`No se pudo obtener el perfil actualizado para ${email}`);
        res.json({
          message: 'Perfil actualizado correctamente',
          usuario: updateData
        });
      }
    } else {
      console.log(`No se pudo actualizar perfil para: ${email}`);
      res.status(500).json({ message: 'Error al actualizar perfil' });
    }
  } catch (error) {
    console.error(`Error al actualizar perfil:`, error);
    res.status(500).json({
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
});

// ==========================================
// API: Estadísticas
// ==========================================

app.get('/api/estadisticas', async (req, res) => {
  try {
    const stats = await db.obtenerEstadisticas();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// ==========================================
// Middleware para verificar JWT y rol
// ==========================================

function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No autorizado - Token no proporcionado' });

    const token = auth.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No autorizado - Formato de token inválido' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userRoles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles || decoded.rol];

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
      console.error('Error verificando token:', err.message);
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
  };
}

// ==========================================
// API: Actualizar y Eliminar Reportes (requieren autenticación)
// ==========================================

app.patch('/api/reportes/:id', requireRole(['administrador', 'jefe_departamento', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    console.log(`Actualizando reporte ${id}:`, update);

    const ok = await db.actualizarReporte(id, update);
    if (ok) {
      // Notificar en tiempo real a todos los roles que pueden ver reportes
      sendToRoles(['administrador', 'jefe_departamento', 'tecnico'], {
        type: 'reporte_updated',
        data: { id, ...update },
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: 'Reporte actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Reporte no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar reporte:', error);
    res.status(500).json({ message: 'Error al actualizar reporte', error: error.message });
  }
});

app.delete('/api/reportes/:id', requireRole(['administrador', 'jefe_departamento', 'tecnico']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Eliminando reporte ${id}`);

    const ok = await db.eliminarReporte(id);
    if (ok) {
      // Notificar en tiempo real a todos los roles que pueden ver reportes
      sendToRoles(['administrador', 'jefe_departamento', 'tecnico'], {
        type: 'reporte_deleted',
        data: { id },
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: 'Reporte eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Reporte no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    res.status(500).json({ message: 'Error al eliminar reporte', error: error.message });
  }
});

// ==========================================
// Health Check
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==========================================
// WebSocket endpoint para tiempo real
// ==========================================

// Crear servidor HTTP para WebSocket
const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log('Nueva conexión WebSocket establecida');
  
  // Extraer token de la URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  if (!token) {
    ws.close(1008, 'Token no proporcionado');
    return;
  }
  
  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decoded.email;
    const userRoles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.rol || decoded.roles];
    
    // Guardar conexión por email
    wsClients.set(userEmail, ws);
    
    // Guardar conexión por rol
    userRoles.forEach(role => {
      if (!wsClientsByRole.has(role)) {
        wsClientsByRole.set(role, new Set());
      }
      wsClientsByRole.get(role).add(ws);
    });
    
    // Enviar mensaje de conexión exitosa
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      user: { email: userEmail, roles: userRoles }
    }));
    
    // Manejar mensajes del cliente
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Mensaje recibido:', data);
        
        // Manejar heartbeat
        if (data.type === 'heartbeat') {
          ws.send(JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Error al procesar mensaje:', error);
      }
    });
    
    // Manejar desconexión
    ws.on('close', () => {
      console.log(`WebSocket desconectado: ${userEmail}`);
      
      // Eliminar conexión por email
      wsClients.delete(userEmail);
      
      // Eliminar conexión por rol
      userRoles.forEach(role => {
        const clients = wsClientsByRole.get(role);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            wsClientsByRole.delete(role);
          }
        }
      });
    });
    
    // Manejar errores
    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
    });
  } catch (error) {
    console.error('Error al verificar token en WebSocket:', error);
    ws.close(1008, 'Token inválido');
  }
});

// ==========================================
// Serve React app for all other routes
// ==========================================

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    const publicIndexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(publicIndexPath)) {
      res.sendFile(publicIndexPath);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  }
});

// ==========================================
// Error handling
// ==========================================

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);

  // Error de multer (tamaño de archivo)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      message: 'El archivo es demasiado grande',
      error: 'LIMIT_FILE_SIZE'
    });
  }

  // Error de multer (demasiados archivos)
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      message: 'Demasiados archivos',
      error: 'LIMIT_FILE_COUNT'
    });
  }

  // Error de tipo de archivo
  if (err.message && err.message.includes('Tipo de archivo no permitido')) {
    return res.status(415).json({
      message: err.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  res.status(500).json({
    message: 'Error en el servidor',
    error: process.env.NODE_ENV === 'production' ? 'Error interno' : err.message
  });
});

// Export for Vercel
export default app;
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
