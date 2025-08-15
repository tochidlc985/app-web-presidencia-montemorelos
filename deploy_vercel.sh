#!/bin/bash

# Script para desplegar la aplicación en Vercel

echo "Iniciando proceso de despliegue en Vercel..."

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null
then
    echo "Vercel CLI no está instalado. Instalándolo..."
    npm install -g vercel
fi

# Iniciar sesión en Vercel (si no estás ya autenticado)
echo "Verificando autenticación en Vercel..."
vercel whoami || vercel login

# Desplegar en producción
echo "Desplegando aplicación en producción..."
vercel --prod

echo "¡Despliegue completado!"
