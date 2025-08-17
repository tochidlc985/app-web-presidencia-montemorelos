// Importar express y crear una aplicación
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

// Cargar variables de entorno
dotenv.config();

// Verificar variables de entorno
if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI no está definida en las variables de entorno');
}

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET no está definida en las variables de entorno');
}

// Cliente de MongoDB
let client = null;

// Nombres de bases de datos y colecciones
const DB_NAME_REPORTES = 'Montemorelos';
const COLLECTION_NAME_REPORTES = 'reportes';
const DB_NAME_INTERNOS = 'Internos';
const COLLECTION_NAME_USERS_INTERNOS = 'usuarios';
const COLLECTION_NAME_ROLES_INTERNOS = 'roles';
const DB_NAME_PERFIL = 'Perfil';
const COLLECTION_NAME_USUARIO_PERFIL = 'usuario_perfiles';
const COLLECTION_NAME_ADMINISTRADOR_PERFIL = 'administrador_perfiles';
const COLLECTION_NAME_JEFE_DEPARTAMENTO_PERFIL = 'jefe_departamento_perfiles';
const COLLECTION_NAME_TECNICO_PERFIL = 'tecnico_perfiles';

// Función para conectar a la base de datos
async function connectToDatabase(dbName) {
  if (!client || !client.topology || !client.topology.isConnected()) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
  }
  return client.db(dbName);
}

// Función para conectar a la colección de reportes
async function conectarReportes() {
  if (!global.reportesCollection) {
    const db = await connectToDatabase(DB_NAME_REPORTES);
    global.reportesCollection = db.collection(COLLECTION_NAME_REPORTES);
  }
}

// Función para conectar a las colecciones de usuarios y roles
async function conectarInternos() {
  if (!global.usersInternosCollection || !global.rolesInternosCollection) {
    const db = await connectToDatabase(DB_NAME_INTERNOS);
    global.usersInternosCollection = db.collection(COLLECTION_NAME_USERS_INTERNOS);
    global.rolesInternosCollection = db.collection(COLLECTION_NAME_ROLES_INTERNOS);
  }
}

// Función para guardar un reporte
async function guardarReporte(reporte) {
  await conectarReportes();
  const result = await global.reportesCollection.insertOne(reporte);
  return { acknowledged: result.acknowledged, insertedId: result.insertedId.toString() };
}

// Función para obtener reportes
async function obtenerReportes() {
  await conectarReportes();
  const reportes = await global.reportesCollection.find({}).sort({ timestamp: -1 }).toArray();
  return reportes.map(reporte => ({
    ...reporte,
    _id: reporte._id.toString()
  }));
}

// Función para actualizar un reporte
async function actualizarReporte(id, update) {
  await conectarReportes();
  const result = await global.reportesCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
  return result.modifiedCount > 0;
}

// Función para eliminar un reporte
async function eliminarReporte(id) {
  await conectarReportes();
  const result = await global.reportesCollection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

// Función para obtener un reporte por ID
async function obtenerReportePorId(id) {
  await conectarReportes();
  return await global.reportesCollection.findOne({ _id: new ObjectId(id) });
}

// Función para registrar un usuario
async function registrarUsuario({ nombre, email, password, rol }) {
  await conectarInternos();
  const existente = await global.usersInternosCollection.findOne({ email });
  if (existente) throw new Error('El usuario ya existe');

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await global.usersInternosCollection.insertOne({
    nombre, email, password: hashedPassword, rol, fechaRegistro: new Date()
  });
  return { _id: result.insertedId.toString(), nombre, email, rol, fechaRegistro: new Date() };
}

// Función para autenticar un usuario
async function autenticarUsuario({ email, password }) {
  await conectarInternos();
  const usuario = await global.usersInternosCollection.findOne({ email });
  if (!usuario) throw new Error('Usuario no encontrado');

  const passwordValida = await bcrypt.compare(password, usuario.password);
  if (!passwordValida) throw new Error('Contraseña incorrecta');

  const { password: _, ...usuarioSinPassword } = usuario;
  return { ...usuarioSinPassword, _id: usuarioSinPassword._id.toString() };
}

// Función para buscar perfil por email
async function buscarPerfilPorEmail(email) {
  await conectarInternos();
  const usuario = await global.usersInternosCollection.findOne({ email });
  if (!usuario) return null;

  const { password: _, ...perfil } = usuario;
  return { ...perfil, _id: perfil._id.toString() };
}

// Función para actualizar perfil de usuario
async function actualizarPerfilUsuario(email, updateData) {
  await conectarInternos();
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }
  delete updateData._id;
  delete updateData.rol;
  delete updateData.email;
  delete updateData.fechaRegistro;

  const result = await global.usersInternosCollection.updateOne({ email }, { $set: updateData });
  return result.modifiedCount > 0;
}

// Función para obtener estadísticas
async function obtenerEstadisticas() {
  await conectarReportes();
  try {
    const totalReportes = await global.reportesCollection.countDocuments();
    const reportesPendientes = await global.reportesCollection.countDocuments({ status: 'Pendiente' });
    const reportesEnProceso = await global.reportesCollection.countDocuments({ status: 'En Proceso' });
    const reportesResueltos = await global.reportesCollection.countDocuments({ status: 'Resuelto' });

    return {
      total: totalReportes,
      pendientes: reportesPendientes,
      enProceso: reportesEnProceso,
      resueltos: reportesResueltos
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
}

// Crear aplicación Express
const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://sistema-reportes-montemorelos.vercel.app',
      'http://localhost:5713'
    ];

    if (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost:')) {
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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Configurar directorio de uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para la subida de archivos
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
      return cb(new Error('Solo se permiten imágenes (jpg, png, gif) y videos (mp4, webm, ogg)'));
    }
    cb(null, true);
  }
});

// Servir archivos estáticos
app.use('/uploads', express.static(uploadDir));

// Middleware para verificar JWT y rol
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

// Rutas API - SIN prefijo /api ya que Vercel ya lo maneja
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }

    const usuario = await autenticarUsuario({ email, password });
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

app.post('/register', async (req, res) => {
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

    const usuario = await registrarUsuario({ nombre, email, password, rol });
    res.status(201).json({ message: 'Usuario registrado correctamente', usuario });
  } catch (error) {
    if (error.message === 'El usuario ya existe') {
      res.status(409).json({ message: 'El usuario ya existe' });
    } else {
      console.error('Error en POST /register:', error);
      res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    }
  }
});

app.get('/perfil/:email', async (req, res) => {
  try {
    const perfil = await buscarPerfilPorEmail(req.params.email);
    if (!perfil) return res.status(404).json({ message: 'Perfil no encontrado' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

app.put('/perfil/:email', async (req, res) => {
  try {
    const ok = await actualizarPerfilUsuario(req.params.email, req.body);
    if (ok) {
      res.json({ message: 'Perfil actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Perfil no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
});

app.get('/estadisticas', async (req, res) => {
  try {
    const stats = await obtenerEstadisticas();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

app.post('/reportes', upload.array('imagenes', 10), async (req, res) => {
  try {
    const files = req.files || [];
    const reporte = req.body.data ? JSON.parse(req.body.data) : req.body;

    // Validación
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
    const ok = await guardarReporte(reporte);

    if (ok) {
      res.status(201).json({ message: 'Reporte guardado correctamente' });
    } else {
      res.status(500).json({ message: 'Error al guardar el reporte' });
    }
  } catch (error) {
    console.error('Error en POST /reportes:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

app.get('/reportes', async (req, res) => {
  try {
    const reportes = await obtenerReportes();
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reportes', error: error.message });
  }
});

app.patch('/reportes/:id', requireRole('administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const ok = await actualizarReporte(id, update);

    if (ok) {
      res.json({ message: 'Reporte actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Reporte no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar reporte', error: error.message });
  }
});

app.delete('/reportes/:id', requireRole('administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const reporte = await obtenerReportePorId(id);
    const ok = await eliminarReporte(id);

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
    console.error('Error en DELETE /reportes/:id:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Ruta para servir archivos de uploads
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Archivo no encontrado' });
  }
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
module.exports = app;