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

// Configuración para Vercel
const isVercel = process.env.VERCEL === '1';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware globales con CORS mejorado
app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como apps móviles)
    if (!origin) return callback(null, true);

    // Permitir cualquier subdominio de vercel.app
    if (origin && origin.includes('.vercel.app')) {
      return callback(null, true);
    }

    // Permitir cualquier origen en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Permitir el origen de producción
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://sistema-reportes-montemorelos.vercel.app',
      'https://sistema-reportes-montemorelos.vercel.app'
    ];

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware para verificar el token JWT
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

// Rutas de la API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario en la base de datos
    const user = await db.collection('usuarios').findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, nombre, rol } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await db.collection('usuarios').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear nuevo usuario
    const newUser = {
      email,
      password,
      nombre,
      rol: rol || 'usuario'
    };

    const result = await db.collection('usuarios').insertOne(newUser);

    // Generar token JWT
    const token = jwt.sign(
      { id: result.insertedId, email, rol: newUser.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: result.insertedId,
        email,
        nombre,
        rol: newUser.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para obtener el perfil del usuario
app.get('/api/perfil', verifyToken, async (req, res) => {
  try {
    const user = await db.collection('usuarios').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para crear un nuevo reporte
app.post('/api/reportes', verifyToken, upload.single('imagen'), async (req, res) => {
  try {
    const { titulo, descripcion, categoria, ubicacion } = req.body;

    const nuevoReporte = {
      titulo,
      descripcion,
      categoria,
      ubicacion,
      imagen: req.file ? `/uploads/${req.file.filename}` : null,
      userId: new ObjectId(req.user.id),
      userEmail: req.user.email,
      fechaCreacion: new Date(),
      estado: 'pendiente'
    };

    const result = await db.collection('reportes').insertOne(nuevoReporte);

    res.status(201).json({
      message: 'Reporte creado exitosamente',
      reporte: {
        id: result.insertedId,
        ...nuevoReporte
      }
    });
  } catch (error) {
    console.error('Error al crear reporte:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para obtener todos los reportes
app.get('/api/reportes', verifyToken, async (req, res) => {
  try {
    const reportes = await db.collection('reportes').find({}).toArray();

    res.json(reportes);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para obtener estadísticas
app.get('/api/estadisticas', verifyToken, async (req, res) => {
  try {
    // Contar reportes por estado
    const pendientes = await db.collection('reportes').countDocuments({ estado: 'pendiente' });
    const enProceso = await db.collection('reportes').countDocuments({ estado: 'en_proceso' });
    const resueltos = await db.collection('reportes').countDocuments({ estado: 'resuelto' });

    // Contar reportes por categoría
    const categorias = await db.collection('reportes').aggregate([
      { $group: { _id: '$categoria', count: { $sum: 1 } } }
    ]).toArray();

    res.json({
      porEstado: {
        pendientes,
        enProceso,
        resueltos
      },
      porCategoria: categorias
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error en el servidor', error: err.message });
});

// Exportar la aplicación para Vercel
export default app;
