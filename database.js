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
   * Conecta a la base de datos especificada con reintentos
   * @param {string} dbName - Nombre de la base de datos a conectar
   * @returns {Db} Instancia de la base de datos conectada
   */
  async connectToDatabase(dbName) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 segundo entre reintentos
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.client || !this.client.topology || !this.client.topology.isConnected()) {
          this.client = new MongoClient(this.MONGO_URI);
          await this.client.connect();
          console.log(`✅ Conexión a MongoDB establecida correctamente (Intento ${attempt})`);
        }
        return this.client.db(dbName);
      } catch (error) {
        console.error(`❌ Error al conectar a MongoDB (Intento ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`No se pudo conectar a MongoDB después de ${maxRetries} intentos. Verifique que MongoDB esté ejecutándose y que la URI sea correcta. Error: ${error.message}`);
        }
        
        // Esperar antes del próximo intento
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
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
    // Try with ObjectId first
    let result = await this.reportesCollection.updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (result.modifiedCount > 0) {
      return true;
    }
    // If not found, try with string
    result = await this.reportesCollection.updateOne({ _id: id }, { $set: update });
    return result.modifiedCount > 0;
  }

  /**
   * Elimina un reporte existente
   * @param {string} id - ID del reporte a eliminar
   * @returns {boolean} True si se eliminó correctamente
   */
  async eliminarReporte(id) {
    await this.conectarReportes();
    // Try with ObjectId first
    let result = await this.reportesCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount > 0) {
      return true;
    }
    // If not found, try with string
    result = await this.reportesCollection.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {Object} Datos del usuario registrado sin la contraseña
   */
  async registrarUsuario({ nombre, email, password, rol }) {
    try {
      await this.conectarInternos();
      const existente = await this.usersInternosCollection.findOne({ email });
      if (existente) throw new Error(`El usuario con email ${email} ya existe en el sistema`);

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await this.usersInternosCollection.insertOne({
        nombre, email, password: hashedPassword, rol, fechaRegistro: new Date()
      });
      
      if (!result.acknowledged) {
        throw new Error('No se pudo registrar el usuario en la base de datos');
      }
      
      return { _id: result.insertedId.toString(), nombre, email, rol, fechaRegistro: new Date() };
    } catch (error) {
      console.error('Error al registrar usuario:', error.message);
      throw new Error(`Error al registrar usuario: ${error.message}`);
    }
  }

  /**
   * Autentica a un usuario en el sistema
   * @param {Object} credentials - Credenciales del usuario
   * @returns {Object} Datos del usuario autenticado
   */
  async autenticarUsuario({ email, password }) {
    try {
      await this.conectarInternos();
      const usuario = await this.usersInternosCollection.findOne({ email });
      if (!usuario) throw new Error(`Usuario con email ${email} no encontrado en el sistema`);

      const passwordValida = await bcrypt.compare(password, usuario.password);
      if (!passwordValida) throw new Error('La contraseña proporcionada es incorrecta');

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
    } catch (error) {
      console.error('Error en autenticación de usuario:', error.message);
      throw new Error(`Error al autenticar usuario: ${error.message}`);
    }
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

    // Primero intentar obtener el perfil de la colección específica de perfiles
    let perfilCompleto = { ...perfil, _id: perfil._id.toString() };

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

        if (perfilExistente) {
          // Combinar datos del usuario base con datos específicos del perfil
          perfilCompleto = {
            ...perfilCompleto,
            ...perfilExistente,
            _id: perfil._id.toString() // Mantener el ID del usuario base
          };
          // Convertir ObjectId a string si existe
          if (perfilExistente._id) {
            perfilCompleto._id = perfilExistente._id.toString();
          }
        } else {
          // Si no existe, crear un nuevo perfil en la colección correspondiente
          await coleccionPerfil.insertOne({
            ...perfil,
            fechaActualizacion: new Date()
          });
        }
      } catch (error) {
        console.error('Error al acceder a colección de perfiles:', error);
        // Continuar con el perfil básico si hay error
      }
    }

    return perfilCompleto;
  }

  /**
   * Actualiza los datos de un usuario
   * @param {string} email - Email del usuario a actualizar
   * @param {Object} updateData - Datos a actualizar
   * @returns {boolean} True si se actualizó correctamente
   */
  async actualizarPerfilUsuario(email, updateData) {
    try {
      await this.conectarInternos();

      console.log(`Actualizando perfil para ${email}:`, updateData);

      // Limpiar datos que no deben actualizarse
      const cleanUpdateData = { ...updateData };
      delete cleanUpdateData._id;
      delete cleanUpdateData.email;
      delete cleanUpdateData.fechaRegistro;

      // Hash password if provided
      if (cleanUpdateData.password) {
        cleanUpdateData.password = await bcrypt.hash(cleanUpdateData.password, 10);
      }

      // First check if user exists
      const existingUser = await this.usersInternosCollection.findOne({ email });
      console.log(`Usuario existente en DB para ${email}:`, existingUser ? 'Sí' : 'No');

      if (!existingUser) {
        console.log(`Usuario no encontrado para ${email}, creando nuevo perfil...`);
        // Crear nuevo usuario si no existe
        const newUser = {
          nombre: cleanUpdateData.nombre || email.split('@')[0],
          email: email,
          password: cleanUpdateData.password || await bcrypt.hash('default123', 10),
          rol: cleanUpdateData.rol || 'usuario',
          fechaRegistro: new Date(),
          fechaActualizacion: new Date(),
          ...cleanUpdateData
        };
        
        const insertResult = await this.usersInternosCollection.insertOne(newUser);
        console.log(`Nuevo usuario creado para ${email}:`, insertResult.acknowledged);
        return insertResult.acknowledged;
      }

      // Si el usuario existe, actualizarlo
      const result = await this.usersInternosCollection.updateOne(
        { email },
        {
          $set: {
            ...cleanUpdateData,
            fechaActualizacion: new Date()
          }
        }
      );

      console.log(`Resultado de actualización para ${email}:`, result);

      // Verificar si la actualización fue exitosa
      if (result.acknowledged && result.modifiedCount > 0) {
        console.log(`Perfil actualizado exitosamente para ${email}`);
        return true;
      } else if (result.acknowledged && result.modifiedCount === 0) {
        // No se realizaron cambios, pero la operación fue exitosa
        console.log(`No se realizaron cambios para ${email}, pero la operación fue exitosa`);
        return true;
      } else {
        console.log(`Error al actualizar perfil para ${email}`);
        return false;
      }

    } catch (error) {
      console.error(`Error al actualizar perfil para ${email}:`, error);
      throw error; // Lanzar el error para que el endpoint pueda manejarlo adecuadamente
    }
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
    // Try with ObjectId first
    let reporte = await this.reportesCollection.findOne({ _id: new ObjectId(id) });
    if (reporte) return reporte;
    // If not found, try with string
    reporte = await this.reportesCollection.findOne({ _id: id });
    return reporte;
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
