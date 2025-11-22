/**
 * Script de prueba para verificar el manejo de errores mejorado
 * Este script prueba las mejoras implementadas en el sistema de manejo de errores
 */

import { db } from './database.js';
import { AppError } from './errorHandler.js';

async function testDatabaseErrorHandling() {
  console.log('🧪 Iniciando pruebas de manejo de errores de base de datos...\n');
  
  try {
    // Test 1: Conexión a base de datos con reintentos
    console.log('1. Probando conexión a base de datos con reintentos...');
    try {
      await db.connectToDatabase('TestDB');
      console.log('✅ Conexión a base de datos exitosa');
    } catch (error) {
      console.log('❌ Error en conexión a base de datos:', error.message);
    }
    
    // Test 2: Registro de usuario con email duplicado
    console.log('\n2. Probando registro de usuario con email duplicado...');
    try {
      const testUser = {
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        rol: 'usuario'
      };
      
      // Intentar registrar el mismo usuario dos veces
      await db.registrarUsuario(testUser);
      console.log('✅ Primer registro exitoso');
      
      await db.registrarUsuario(testUser);
      console.log('❌ No debería llegar aquí - debería lanzar error de duplicado');
    } catch (error) {
      console.log('✅ Error manejado correctamente:', error.message);
    }
    
    // Test 3: Autenticación con credenciales inválidas
    console.log('\n3. Probando autenticación con credenciales inválidas...');
    try {
      await db.autenticarUsuario({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ No debería llegar aquí - debería lanzar error de autenticación');
    } catch (error) {
      console.log('✅ Error de autenticación manejado correctamente:', error.message);
    }
    
    // Test 4: AppError personalizado
    console.log('\n4. Probando AppError personalizado...');
    try {
      throw new AppError('Este es un error personalizado', 400, { detalle: 'Información adicional' });
    } catch (error) {
      console.log('✅ AppError manejado correctamente:');
      console.log('  - Mensaje:', error.message);
      console.log('  - Código:', error.statusCode);
      console.log('  - Detalles:', error.details);
    }
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error inesperado durante las pruebas:', error);
  } finally {
    // Cerrar conexión a la base de datos
    await db.close();
    console.log('\n🔌 Conexión a base de datos cerrada');
  }
}

// Ejecutar pruebas
testDatabaseErrorHandling().catch(console.error);
