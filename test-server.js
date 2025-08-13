// Script para probar la conexión del servidor
import dotenv from 'dotenv';
dotenv.config();
console.log('MONGO_URI:', process.env.MONGO_URI);
import { db } from './src/utils/database.js';

async function testConnection() {
  console.log('🔄 Probando conexión a la base de datos...');
  
  try {
    // Probar conexión a reportes
    await db.conectarReportes();
    console.log('✅ Conexión a base de datos de reportes exitosa');
    
    // Probar conexión a usuarios internos
    await db.conectarInternos();
    console.log('✅ Conexión a base de datos de usuarios exitosa');
    
    // Probar obtener reportes
    const reportes = await db.obtenerReportes();
    console.log(`📊 Se encontraron ${reportes.length} reportes`);
    
    // Probar obtener estadísticas
    const stats = await db.obtenerEstadisticas();
    console.log('📈 Estadísticas:', stats);
    
    console.log('🎉 Todas las pruebas pasaron correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  } finally {
    await db.close();
    console.log('🔒 Conexión cerrada');
    process.exit(0);
  }
}

testConnection();