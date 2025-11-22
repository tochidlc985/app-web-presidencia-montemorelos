#!/bin/bash
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
