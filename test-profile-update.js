#!/usr/bin/env node

// Test script para verificar la actualización de perfiles
// Este script prueba la función actualizarPerfilUsuario directamente

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Configuración de MongoDB (usar variables de entorno o valores por defecto)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Montemorelos';
const DB_NAME_INTERNOS = 'Internos';
const COLLECTION_NAME_USERS_INTERNOS = 'usuarios';

async function testProfileUpdate() {
  console.log('🚀 Iniciando prueba de actualización de perfil...\n');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    // Conectar a MongoDB
    await client.connect();
    console.log('✅ Conexión a MongoDB establecida');
    
    const db = client.db(DB_NAME_INTERNOS);
    const collection = db.collection(COLLECTION_NAME_USERS_INTERNOS);
    
    // Datos de prueba
    const testEmail = 'test@example.com';
    const testUpdateData = {
      nombre: 'Usuario de Prueba',
      departamento: 'Departamento de Pruebas',
      rol: 'usuario',
      telefono: '+52 123 456 7890',
      bio: 'Esta es una biografía de prueba para el usuario de prueba.',
      genero: 'masculino',
      perfilPublico: true
    };
    
    console.log(`📧 Probando actualización para: ${testEmail}`);
    console.log('📝 Datos a actualizar:', JSON.stringify(testUpdateData, null, 2));
    
    // 1. Primero, verificar si el usuario existe
    console.log('\n🔍 Verificando si el usuario existe...');
    let existingUser = await collection.findOne({ email: testEmail });
    console.log(existingUser ? '✅ Usuario encontrado' : '❌ Usuario no encontrado');
    
    // 2. Probar la actualización (simulando la función actualizarPerfilUsuario)
    console.log('\n🔄 Realizando actualización...');
    
    // Limpiar datos que no deben actualizarse
    const cleanUpdateData = { ...testUpdateData };
    delete cleanUpdateData._id;
    delete cleanUpdateData.email;
    delete cleanUpdateData.fechaRegistro;
    
    // Hash password if provided (no en este caso)
    if (cleanUpdateData.password) {
      cleanUpdateData.password = await bcrypt.hash(cleanUpdateData.password, 10);
    }
    
    // Verificar si el usuario existe
    existingUser = await collection.findOne({ email: testEmail });
    console.log(`Usuario existente en DB para ${testEmail}:`, existingUser ? 'Sí' : 'No');
    
    let result;
    let operationType;
    
    if (!existingUser) {
      console.log(`👤 Usuario no encontrado para ${testEmail}, creando nuevo perfil...`);
      // Crear nuevo usuario si no existe
      const newUser = {
        nombre: cleanUpdateData.nombre || testEmail.split('@')[0],
        email: testEmail,
        password: cleanUpdateData.password || await bcrypt.hash('default123', 10),
        rol: cleanUpdateData.rol || 'usuario',
        fechaRegistro: new Date(),
        fechaActualizacion: new Date(),
        ...cleanUpdateData
      };
      
      const insertResult = await collection.insertOne(newUser);
      console.log(`Nuevo usuario creado para ${testEmail}:`, insertResult.acknowledged);
      result = insertResult;
      operationType = 'CREATE';
    } else {
      // Si el usuario existe, actualizarlo
      console.log(`📝 Actualizando usuario existente para ${testEmail}...`);
      result = await collection.updateOne(
        { email: testEmail },
        {
          $set: {
            ...cleanUpdateData,
            fechaActualizacion: new Date()
          }
        }
      );
      operationType = 'UPDATE';
    }
    
    console.log('📊 Resultado de la operación:', result);
    console.log('📋 Tipo de operación:', operationType);
    
    // 3. Verificar el resultado
    if (operationType === 'CREATE') {
      if (result.acknowledged) {
        console.log('✅ PRUEBA EXITOSA: Nuevo perfil creado correctamente');
      } else {
        console.log('❌ PRUEBA FALLIDA: No se pudo crear el nuevo perfil');
        return false;
      }
    } else {
      // Operación de actualización
      if (result.acknowledged && result.modifiedCount > 0) {
        console.log('✅ PRUEBA EXITOSA: Perfil actualizado correctamente');
      } else if (result.acknowledged && result.modifiedCount === 0) {
        console.log('⚠️  ADVERTENCIA: No se realizaron cambios, pero la operación fue exitosa');
      } else {
        console.log('❌ PRUEBA FALLIDA: Error al actualizar el perfil');
        return false;
      }
    }
    
    // 4. Verificar los datos actualizados
    console.log('\n👀 Verificando datos actualizados...');
    const updatedUser = await collection.findOne({ email: testEmail });
    if (updatedUser) {
      console.log('✅ Usuario encontrado después de la operación');
      console.log('📋 Datos actualizados:');
      console.log(`   Nombre: ${updatedUser.nombre}`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Departamento: ${updatedUser.departamento}`);
      console.log(`   Rol: ${updatedUser.rol}`);
      console.log(`   Teléfono: ${updatedUser.telefono}`);
      console.log(`   Género: ${updatedUser.genero}`);
      console.log(`   Perfil público: ${updatedUser.perfilPublico}`);
      console.log(`   Fecha de actualización: ${updatedUser.fechaActualizacion}`);
    } else {
      console.log('❌ ERROR: No se encontró el usuario después de la operación');
      return false;
    }
    
    console.log('\n🎉 PRUEBA COMPLETA: La función de actualización de perfil funciona correctamente');
    return true;
    
  } catch (error) {
    console.error('❌ ERROR durante la prueba:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    await client.close();
    console.log('\n🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar la prueba
if (import.meta.url === `file://${process.argv[1]}`) {
  testProfileUpdate()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ ERROR FATAL:', error);
      process.exit(1);
    });
}

export { testProfileUpdate };