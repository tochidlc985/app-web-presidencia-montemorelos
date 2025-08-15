#!/bin/bash

# Script para desplegar la aplicaci�n en Vercel

echo "Iniciando proceso de despliegue en Vercel..."

# Verificar si Vercel CLI est� instalado
if ! command -v vercel &> /dev/null
then
    echo "Vercel CLI no est� instalado. Instal�ndolo..."
    npm install -g vercel
fi

# Iniciar sesi�n en Vercel (si no est�s ya autenticado)
echo "Verificando autenticaci�n en Vercel..."
vercel whoami || vercel login

# Desplegar en producci�n
echo "Desplegando aplicaci�n en producci�n..."
vercel --prod

echo "�Despliegue completado!"
