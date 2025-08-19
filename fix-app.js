#!/usr/bin/env node
/**
 * Diagnostic and Fix Script for Montemorelos Presidency App
 * This script will check for common issues and provide fixes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = __dirname;
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

console.log('🔧 Montemorelos Presidency App - Diagnostic & Fix Tool');
console.log('=====================================================');

// 1. Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  console.log(`📋 Node.js Version: ${nodeVersion}`);
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  if (majorVersion < 16) {
    console.log('⚠️  Warning: Node.js version should be 16 or higher');
  } else {
    console.log('✅ Node.js version is compatible');
  }
}

// 2. Check if required directories exist
function checkDirectories() {
  console.log('\n📁 Checking directories...');
  
  const requiredDirs = [UPLOADS_DIR, path.join(PROJECT_ROOT, 'public')];
  
  requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`📂 Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    } else {
      console.log(`✅ Directory exists: ${path.basename(dir)}`);
    }
  });
}

// 3. Check package.json scripts
function checkPackageScripts() {
  console.log('\n📦 Checking package.json scripts...');
  const packagePath = path.join(PROJECT_ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredScripts = ['dev', 'build', 'start', 'server'];
  requiredScripts.forEach(script => {
    if (pkg.scripts[script]) {
      console.log(`✅ Script "${script}" exists: ${pkg.scripts[script]}`);
    } else {
      console.log(`❌ Missing script: ${script}`);
    }
  });
}

// 4. Check environment variables
function checkEnvFile() {
  console.log('\n🔐 Checking environment configuration...');
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  const envProdPath = path.join(PROJECT_ROOT, '.env.production');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local file exists');
  } else if (fs.existsSync(envProdPath)) {
    console.log('✅ .env.production file exists');
  } else {
    console.log('❌ No .env file found');
    console.log('📋 Creating .env.local template...');
    
    const envTemplate = `# Montemorelos Presidency App Configuration
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/montemorelos

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
NODE_ENV=development
PORT=4000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
`;
    
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Created .env.local template');
  }
}

// 5. Check dependencies
function checkDependencies() {
  console.log('\n📥 Checking dependencies...');
  try {
    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(PROJECT_ROOT, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('📦 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit', cwd: PROJECT_ROOT });
    } else {
      console.log('✅ Dependencies installed');
    }
  } catch (error) {
    console.error('❌ Error checking dependencies:', error.message);
  }
}

// 6. Check MongoDB connection
async function testMongoConnection() {
  console.log('\n🗄️  Testing MongoDB connection...');
  try {
    const { MongoClient } = require('mongodb');
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
    
    if (!process.env.MONGO_URI) {
      console.log('❌ MONGO_URI not found in environment variables');
      return false;
    }
    
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log('✅ MongoDB connection successful');
    await client.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// 7. Create startup script
function createStartupScript() {
  console.log('\n🚀 Creating startup script...');
  
  const startupScript = `#!/bin/bash
# Montemorelos Presidency App - Startup Script

echo "🚀 Starting Montemorelos Presidency App..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   Try: mongod --dbpath /path/to/your/db"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Starting development server..."
npm run dev

# In another terminal, start the backend
echo "🔙 Starting backend server..."
npm run server
`;

  fs.writeFileSync(path.join(PROJECT_ROOT, 'start-dev.sh'), startupScript);
  console.log('✅ Created start-dev.sh script');
}

// 8. Create Windows startup script
function createWindowsStartupScript() {
  const windowsScript = `@echo off
REM Montemorelos Presidency App - Windows Startup Script

echo 🚀 Starting Montemorelos Presidency App...

REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I "mongod.exe" >NUL
if errorlevel 1 (
    echo ⚠️  MongoDB is not running. Please start MongoDB first.
    echo    Try: mongod --dbpath C:\path\to\your\db
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Start the development server
echo 🌐 Starting development server...
start cmd /k "npm run dev"

REM Start the backend server
echo 🔙 Starting backend server...
start cmd /k "npm run server"

pause
`;

  fs.writeFileSync(path.join(PROJECT_ROOT, 'start-dev.bat'), windowsScript);
  console.log('✅ Created start-dev.bat script');
}

// Main execution
async function main() {
  checkNodeVersion();
  checkDirectories();
  checkPackageScripts();
  checkEnvFile();
  checkDependencies();
  await testMongoConnection();
  createStartupScript();
  createWindowsStartupScript();
  
  console.log('\n✅ Diagnostic complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure MongoDB is running');
  console.log('2. Update the .env.local file with your actual MongoDB URI');
  console.log('3. Run: npm run dev (frontend)');
  console.log('4. Run: npm run server (backend)');
  console.log('5. Or use start-dev.sh (Linux/Mac) or start-dev.bat (Windows)');
}

// Run the diagnostic
main().catch(console.error);
