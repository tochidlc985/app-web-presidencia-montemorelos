# Comandos para actualizar el repositorio y desplegar en Vercel

## 1. Verificar los cambios realizados
git status
git diff

## 2. Añadir los archivos modificados al área de staging
git add src/services/apiConfig.ts
git add vercel.json
git add api/vercel.js

## 3. Confirmar los cambios con un mensaje descriptivo
git commit -m "Corrección de configuración para Vercel: ajuste de rutas API y manejo de archivos estáticos"

## 4. Subir los cambios al repositorio remoto
git push origin main

# Nota: Si tu rama principal tiene otro nombre (como master), usa:
# git push origin master

## 5. Despliegue automático en Vercel
# Después de hacer push, Vercel debería detectar los cambios automáticamente
# y comenzar el proceso de despliegue. Puedes verificar el estado en:
# https://vercel.com/dashboard

## 6. Si necesitas desencadenar un despliegue manualmente en Vercel:
# - Ve al panel de Vercel
# - Selecciona tu proyecto
# - Haz clic en "Deployments"
# - Haz clic en "Redeploy"

## 7. Verificar variables de entorno en Vercel
# Asegúrate de que estas variables estén configuradas en tu proyecto de Vercel:
# - MONGO_URI=mongodb+srv://RobertoCarlos:9sXvNyenlCepWq7n@almacenmultinacional.3zwaw.mongodb.net/?retryWrites=true&w=majority
# - JWT_SECRET=df2a6f8b9e1c5d0a4b7f3e6a9d2c1e8f5b4a7d0c3e6f9a8b1c4d7e0a2b5f8c9d
# - FRONTEND_URL=https://sistema-reportes-montemorelos.vercel.app
# - NODE_ENV=production

## 8. Verificar la configuración de build en Vercel
# Asegúrate de que la configuración de build en Vercel sea:
# - Build Command: npm run build
# - Output Directory: dist
# - Install Command: npm install
