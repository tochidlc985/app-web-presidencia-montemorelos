#!/usr/bin/env node
/**
 * Script para desplegar la aplicación en Vercel
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Desplegando aplicación a Vercel...');
console.log('=====================================');

// 1. Verificar si Vercel CLI está instalado
function checkVercelCLI() {
  console.log('📋 Verificando Vercel CLI...');
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI está instalado');
    return true;
  } catch (error) {
    console.log('❌ Vercel CLI no está instalado');
    console.log('📦 Instalando Vercel CLI...');
    try {
      execSync('npm i -g vercel', { stdio: 'inherit' });
      console.log('✅ Vercel CLI instalado correctamente');
      return true;
    } catch (installError) {
      console.error('❌ Error al instalar Vercel CLI:', installError.message);
      return false;
    }
  }
}

// 2. Construir la aplicación
function buildApp() {
  console.log('\n🔨 Construyendo la aplicación...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Aplicación construida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al construir la aplicación:', error.message);
    return false;
  }
}

// 3. Desplegar a Vercel
function deployToVercel() {
  console.log('\n🚀 Desplegando a Vercel...');
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Despliegue completado');
    return true;
  } catch (error) {
    console.error('❌ Error durante el despliegue:', error.message);
    return false;
  }
}

// Función principal
function main() {
  if (!checkVercelCLI()) {
    console.error('❌ No se pudo continuar con el despliegue');
    process.exit(1);
  }

  if (!buildApp()) {
    console.error('❌ No se pudo construir la aplicación');
    process.exit(1);
  }

  if (!deployToVercel()) {
    console.error('❌ Error durante el despliegue');
    process.exit(1);
  }

  console.log('\n🎉 Despliegue completado con éxito!');
  console.log('📝 No olvides configurar las variables de entorno en el dashboard de Vercel');
  console.log('🔑 Variables necesarias: MONGO_URI, JWT_SECRET');
}

main();
