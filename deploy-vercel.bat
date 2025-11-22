@echo off
echo =====================================
echo Desplegando aplicacion a Vercel...
echo =====================================

echo.
echo Verificando Vercel CLI...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI no esta instalado. Instalando...
    npm i -g vercel
) else (
    echo Vercel CLI ya esta instalado.
)

echo.
echo Construyendo la aplicacion...
npm run build
if %errorlevel% neq 0 (
    echo Error al construir la aplicacion.
    pause
    exit /b 1
)

echo.
echo Desplegando a Vercel...
vercel --prod

echo.
echo =====================================
echo Despliegue completado.
echo =====================================
echo No olvides configurar las variables de entorno en el dashboard de Vercel:
echo - MONGO_URI
echo - JWT_SECRET
echo =====================================
pause
