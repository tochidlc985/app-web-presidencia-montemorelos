#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando proceso de despliegue en Vercel...');

try {
  // Verificar si estamos en el directorio correcto
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    console.error('❌ Error: No se encontró el archivo package.json. Asegúrate de estar en el directorio raíz del proyecto.');
    process.exit(1);
  }

  // Verificar si Vercel CLI está instalado
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('📦 Instalando Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }

  // Construir el proyecto
  console.log('🔨 Construyendo el proyecto...');
  execSync('npm run build', { stdio: 'inherit' });

  // Desplegar en Vercel
  console.log('🚀 Desplegando en Vercel...');
  execSync('vercel --prod', { stdio: 'inherit' });

  console.log('✅ Despliegue completado con éxito!');
} catch (error) {
  console.error('❌ Error durante el despliegue:', error.message);
  process.exit(1);
}
