import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno para Vercel
dotenv.config();

// Verificar variables de entorno para Vercel
if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI no está definida');
  throw new Error('MONGO_URI es requerida');
}

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET no está definida');
  throw new Error('JWT_SECRET es requerida');
}

class DatabaseService {
  // URI de conexión a MongoDB Atlas desde variables de entorno
  MONGO_URI = process.env.MONGO_URI;
  // Cliente de MongoDB
  client = null;

  // Nombres de bases de datos y colecciones para reportes
  DB_NAME_REPORTES = 'Montemorelos';
  COLLECTION_NAME_REPORTES = 'reportes';

  // Nombres de bases de datos y colecciones para usuarios internos
  DB_NAME_INTERNOS = 'Internos';
  COLLECTION_NAME_USERS_INTERNOS = 'usuarios';
  COLLECTION_NAME_ROLES_INTERNOS = 'roles';

  // Nombres de bases de datos y colecciones para perfiles de usuario
  DB_NAME_PERFIL = 'Perfil';
  COLLECTION_NAME_USUARIO_PERFIL = 'usuario_perfiles';
  COLLECTION_NAME_ADMINISTRADOR_PERFIL = 'administrador_perfiles';
  COLLECTION_NAME_JEFE_DEPARTAMENTO_PERFIL = 'jefe_departamento_perfiles';
  COLLECTION_NAME_TECNICO_PERFIL = 'tecnico_perfiles';

  /**
   * Normaliza el nombre del rol para asegurar consistencia
   * @param {string} rol - El rol a normalizar
   * @returns {string} El rol normalizado
   */
  _normalizeRol(rol) {
    const rolesMap = {
      'usuario': 'usuario',
      'administrador': 'administrador',
      'jefe': 'jefe_departamento',
      'jefe_departamento': 'jefe_departamento',
      'tecnico': 'tecnico'
    };
    return rolesMap[rol] || 'usuario';
  }

  /**
   * Conecta a la base de datos especificada
   * @param {string} dbName - Nombre de la base de datos a conectar
   * @returns {Db} Instancia de la base de datos conectada
   */
  async connectToDatabase(dbName) {
    if (!this.client || !this.client.topology || !this.client.topology.isConnected()) {
      this.client = new MongoClient(this.MONGO_URI);
      await this.client.connect();
    }
    return this.client.db(dbName);
  }

  /**
   * Conecta a la colección de reportes
   */
  async conectarReportes() {
    if (!this.reportesCollection) {
      const db = await this.connectToDatabase(this.DB_NAME_REPORTES);
      this.reportesCollection = db.collection(this.COLLECTION_NAME_REPORTES);
    }
  }

  /**
   * Conecta a las colecciones de usuarios y roles
   */
  async conectarInternos() {
    if (!this.usersInternosCollection || !this.rolesInternosCollection) {
      const db = await this.connectToDatabase(this.DB_NAME_INTERNOS);
      this.usersInternosCollection = db.collection(this.COLLECTION_NAME_USERS_INTERNOS);
      this.rolesInternosCollection = db.collection(this.COLLECTION_NAME_ROLES_INTERNOS);
    }
  }

  /**
   * Guarda un nuevo reporte en la base de datos
   * @param {Object} reporte - Datos del reporte a guardar
   * @returns {Object} Resultado de la operación
   */
  async guardarReporte(reporte) {
    await this.conectarReportes();
    const result = await this.reportesCollection.insertOne(reporte);
    return { acknowledged: result.acknowledged, insertedId: result.insertedId.toString() };
  }

  /**
   * Obtiene todos los reportes ordenados por fecha
   * @returns {Array} Lista de reportes
   */
  async obtenerReportes() {
    await this.conectarReportes();
    const reportes = await this.reportesCollection.find({}).sort({ timestamp: -1 }).toArray();
    // Convertir _id de ObjectId a string para cada reporte
    return reportes.map(reporte => ({
      ...reporte,
      _id: reporte._id.toString()
    }));
  }

  /**
   * Actualiza un reporte existente
   * @param {string} id - ID del reporte a actualizar
   * @param {Object} update - Datos a actualizar
   * @returns {boolean} True si se actualizó correctamente
   */
  async actualizarReporte(id, update) {
    await this.conectarReportes();
    const result = await this.reportesCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return result.modifiedCount > 0;
  }

  /**
   * Elimina un reporte existente
   * @param {string} id - ID del reporte a eliminar
   * @returns {boolean} True si se eliminó correctamente
   */
  async eliminarReporte(id) {
    await this.conectarReportes();
    const result = await this.reportesCollection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {Object} Datos del usuario registrado sin la contraseña
   */
  async registrarUsuario({ nombre, email, password, rol }) {
    await this.conectarInternos();
    const existente = await this.usersInternosCollection.findOne({ email });
    if (existente) throw new Error('El usuario ya existe');

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await this.usersInternosCollection.insertOne({
      nombre, email, password: hashedPassword, rol, fechaRegistro: new Date()
    });
    return { _id: result.insertedId.toString(), nombre, email, rol, fechaRegistro: new Date() };
  }

  /**
   * Autentica a un usuario en el sistema
   * @param {Object} credentials - Credenciales del usuario
   * @returns {Object} Datos del usuario autenticado
   */
  async autenticarUsuario({ email, password }) {
    await this.conectarInternos();
    const usuario = await this.usersInternosCollection.findOne({ email });
    if (!usuario) throw new Error('Usuario no encontrado');

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) throw new Error('Contraseña incorrecta');

    const { password: _, ...usuarioSinPassword } = usuario;

    // Guardar o actualizar el perfil en la colección correspondiente según el rol
    if (usuario.rol) {
      try {
        const dbPerfil = await this.connectToDatabase(this.DB_NAME_PERFIL);

        let coleccionPerfil;
        if (usuario.rol === 'administrador') {
          coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_ADMINISTRADOR_PERFIL);
        } else if (usuario.rol === 'jefe_departamento') {
          coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_JEFE_DEPARTAMENTO_PERFIL);
        } else if (usuario.rol === 'tecnico') {
          coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_TECNICO_PERFIL);
        } else {
          coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_USUARIO_PERFIL);
        }

        // Verificar si ya existe un perfil para este usuario
        const perfilExistente = await coleccionPerfil.findOne({ email });

        if (!perfilExistente) {
          // Si no existe, crear un nuevo perfil en la colección correspondiente
          await coleccionPerfil.insertOne({
            ...usuarioSinPassword,
            fechaActualizacion: new Date()
          });
        } else {
          // Si ya existe, actualizarlo
          await coleccionPerfil.updateOne(
            { email },
            {
              $set: {
                ...usuarioSinPassword,
                fechaActualizacion: new Date()
              }
            }
          );
        }
      } catch (error) {
        console.error('Error al guardar en colección de perfiles durante autenticación:', error);
        // No lanzamos el error para no interrumpir el flujo principal
      }
    }

    return { ...usuarioSinPassword, _id: usuarioSinPassword._id.toString() };
  }

  /**
   * Busca el perfil de un usuario por su email
   * @param {string} email - Email del usuario a buscar
   * @returns {Object|null} Datos del perfil o null si no existe
   */
  async buscarPerfilPorEmail(email) {
    await this.conectarInternos();
    const usuario = await this.usersInternosCollection.findOne({ email });
    if (!usuario) return null;

    const { password: _, ...perfil } = usuario;

    // Dependiendo del rol, guardamos también en la colección específica de perfiles
    if (usuario.rol) {
      try {
        const dbPerfil = await this.connectToDatabase(this.DB_NAME_PERFIL);

        let coleccionPerfil;
        if (usuario.rol === 'administrador') {
          coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_ADMINISTRADOR_PERFIL);
        } else if (usuario.rol === 'jefe_departamento') {
          coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_JEFE_DEPARTAMENTO_PERFIL);
        } else if (usuario.rol === 'tecnico') {
          coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_TECNICO_PERFIL);
        } else {
          coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_USUARIO_PERFIL);
        }

        // Verificar si ya existe un perfil para este usuario
        const perfilExistente = await coleccionPerfil.findOne({ email });

        if (!perfilExistente) {
          // Si no existe, crear un nuevo perfil en la colección correspondiente
          await coleccionPerfil.insertOne({
            ...perfil,
            fechaActualizacion: new Date()
          });
        } else {
          // Si ya existe, actualizarlo
          await coleccionPerfil.updateOne(
            { email },
            {
              $set: {
                ...perfil,
                fechaActualizacion: new Date()
              }
            }
          );
        }
      } catch (error) {
        console.error('Error al guardar en colección de perfiles:', error);
        // No lanzamos el error para no interrumpir el flujo principal
      }
    }

    return { ...perfil, _id: perfil._id.toString() };
  }

  /**
   * Actualiza los datos de un usuario
   * @param {string} email - Email del usuario a actualizar
   * @param {Object} updateData - Datos a actualizar
   * @returns {boolean} True si se actualizó correctamente
   */
  async actualizarPerfilUsuario(email, updateData) {
    await this.conectarInternos();
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    delete updateData._id;
    delete updateData.rol;
    delete updateData.email;
    delete updateData.fechaRegistro;

    // Verificar si el usuario existe
    let usuario = await this.usersInternosCollection.findOne({ email });
    let result;

    if (!usuario) {
      console.log(`Usuario con email ${email} no encontrado, creando nuevo usuario`);

      // Si no hay nombre en los datos a actualizar, usar el email como nombre
      const nombre = updateData.nombre || email.split('@')[0];
      const rol = updateData.rol || 'usuario';

      // Crear un nuevo usuario
      const hashedPassword = await bcrypt.hash('temporal123', 10); // Contraseña temporal
      const nuevoUsuario = {
        nombre,
        email,
        password: hashedPassword,
        rol,
        fechaRegistro: new Date(),
        ...updateData
      };

      const insertResult = await this.usersInternosCollection.insertOne(nuevoUsuario);
      if (insertResult.acknowledged) {
        usuario = { ...nuevoUsuario, _id: insertResult.insertedId };
        result = { modifiedCount: 1 }; // Simular una modificación exitosa
      } else {
        console.error(`No se pudo crear el usuario con email ${email}`);
        return false;
      }
    } else {
      // Actualizar en la colección principal de usuarios
      result = await this.usersInternosCollection.updateOne({ email }, { $set: updateData });
    }

    // También actualizar en la colección de perfiles correspondiente
    try {
      const dbPerfil = await this.connectToDatabase(this.DB_NAME_PERFIL);

      let coleccionPerfil;
      if (usuario.rol === 'administrador') {
        coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_ADMINISTRADOR_PERFIL);
      } else if (usuario.rol === 'jefe_departamento') {
        coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_JEFE_DEPARTAMENTO_PERFIL);
      } else if (usuario.rol === 'tecnico') {
        coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_TECNICO_PERFIL);
      } else {
        coleccionPerfil = dbPerfil.collection(this.COLLECTION_NAME_USUARIO_PERFIL);
      }

      // Verificar si ya existe un perfil para este usuario
      const perfilExistente = await coleccionPerfil.findOne({ email });

      if (!perfilExistente) {
        // Si no existe, crear un nuevo perfil en la colección correspondiente
        await coleccionPerfil.insertOne({
          ...usuario,
          ...updateData,
          fechaActualizacion: new Date()
        });
      } else {
        // Si ya existe, actualizarlo
        await coleccionPerfil.updateOne(
          { email },
          { $set: { ...updateData, fechaActualizacion: new Date() } }
        );
      }
    } catch (error) {
      console.error('Error al actualizar en colección de perfiles:', error);
      // No lanzamos el error para no interrumpir el flujo principal
    }

    return result.modifiedCount > 0;
  }

  /**
   * Obtiene estadísticas de los reportes
   * @returns {Object} Estadísticas de reportes
   */
  async obtenerEstadisticas() {
    try {
      await this.conectarReportes();

      // Contar reportes por estado
      const reportesPendientes = await this.reportesCollection.countDocuments({ estado: 'Pendiente' });
      const reportesEnProceso = await this.reportesCollection.countDocuments({ estado: 'En Proceso' });
      const reportesResueltos = await this.reportesCollection.countDocuments({ estado: 'Resuelto' });

      return {
        pendientes: reportesPendientes,
        enProceso: reportesEnProceso,
        resueltos: reportesResueltos
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtiene un reporte por su ID
   * @param {string} id - ID del reporte
   * @returns {Object|null} El reporte o null si no existe
   */
  async obtenerReportePorId(id) {
    await this.conectarReportes();
    return await this.reportesCollection.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async close() {
    if (this.client && this.client.topology && this.client.topology.isConnected()) {
      await this.client.close();
      this.client = null;
    }
  }
}

// Exportar una instancia única de la clase DatabaseService
export const db = new DatabaseService();
