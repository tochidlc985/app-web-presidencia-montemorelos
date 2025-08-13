import React, { useState, useCallback } from 'react'; // Asegura la importación de React
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode'; // Importa la librería de QR Code
import toast from 'react-hot-toast';
import { 
  QrCode, Download, Share2, Copy, ExternalLink, Zap, AlertCircle, Info, CheckCircle, Loader2,
  Sparkles, Sliders // Iconos de Lucide-React
} from 'lucide-react';

const QRGenerator = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cambia esta URL a la ruta REAL de tu formulario público en la aplicación web
  // Por ejemplo, si tu dominio es `https://misistema.com` y el formulario está en `/formulario-de-reportes`
  const FORM_PUBLIC_PATH = '/reporte'; // <-- ¡AJUSTA ESTA RUTA SI TU FORMULARIO ESTÁ EN OTRA URL RELATIVA!
  const getFormFullUrl = useCallback(() => {
    // Esto construirá la URL completa. En producción, `window.location.origin` será tu dominio (ej. https://app.com).
    // En desarrollo, será `http://localhost:port`.
    return window.location.origin + FORM_PUBLIC_PATH;
  }, [FORM_PUBLIC_PATH]);

  // Ruta al logo pequeño para incrustar en el centro del QR (asegúrate de que esta imagen exista)
  // ¡ATENCIÓN! La ruta `/Montemorelos.jpg` asume que está en la carpeta `public` de tu proyecto.
  const LOGO_QR_PATH = '/Montemorelos.jpg'; 

  // Helper para mostrar un toast con estilos personalizados
  const showThemedToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    let bgColor = '#3B82F6';
    let iconComponent: React.ReactElement = <Info className="text-white h-5 w-5" />; // Asegura que el tipo es `React.ReactElement`

    switch (type) {
      case 'success':
        bgColor = '#22C55E';
        iconComponent = <CheckCircle className="text-white h-5 w-5" />;
        break;
      case 'error':
        bgColor = '#EF4444';
        iconComponent = <AlertCircle className="text-white h-5 w-5" />;
        break;
      case 'info':
        bgColor = '#3B82F6';
        iconComponent = <Info className="text-white h-5 w-5" />;
        break;
    }

    toast(message, {
      icon: iconComponent,
      style: {
        borderRadius: '10px',
        background: bgColor,
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
      duration: 3000,
      position: 'top-right',
    });
  }, []);

  // Función para generar el QR con un logo central
  const generateQRWithLogo = useCallback(async (url: string) => {
    return new Promise<string>((resolve, reject) => {
      // 1. Cargar la imagen del logo
      const img = document.createElement('img');
      img.src = LOGO_QR_PATH;
      img.onload = async () => {
        try {
          // 2. Generar el QR básico en un Canvas (QRCode.toCanvas)
          const canvas = document.createElement('canvas');
          await QRCode.toCanvas(canvas, url, {
            width: 300, // Tamaño base para el QR, ajusta según necesidad
            margin: 4,  // Margen alrededor del QR para escanear fácilmente
            color: {
              dark: '#1a202c', // Color oscuro para los puntos (gris oscuro casi negro)
              light: '#ffffff' // Color claro para el fondo del QR (blanco)
            },
            errorCorrectionLevel: 'H' // Nivel de corrección de error alto para incrustar logo
          });

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas.'));
            return;
          }

          // 3. Dibujar la imagen del logo en el centro del QR
          // Calcula el tamaño y posición del logo para que encaje bien en el centro
          const qrSize = canvas.width;
          const logoSize = qrSize * 0.25; // El logo será 25% del tamaño del QR
          const logoX = (qrSize - logoSize) / 2;
          const logoY = (qrSize - logoSize) / 2;

          // Dibuja el logo con un pequeño borde blanco (opcional) para que destaque
          const borderSize = 5;
          ctx.fillStyle = '#ffffff'; // Color del borde
          ctx.fillRect(logoX - borderSize, logoY - borderSize, logoSize + 2 * borderSize, logoSize + 2 * borderSize);
          
          ctx.drawImage(img, logoX, logoY, logoSize, logoSize);

          // 4. Convertir el Canvas a Data URL (PNG)
          resolve(canvas.toDataURL('image/png', 1.0)); // 1.0 es calidad, de 0 a 1
        } catch (error) {
          console.error("Error drawing QR with logo:", error);
          reject(error);
        }
      };
      img.onerror = () => {
        reject(new Error('No se pudo cargar la imagen del logo. Verifique la ruta y permisos.'));
      };
    });
  }, [LOGO_QR_PATH]);


  const handleGenerateQR = async () => {
    setShowQR(false);
    setQrCodeUrl('');
    setErrorMessage('');
    setIsGenerating(true);

    const url = getFormFullUrl();
    try {
      const dataUrl = await generateQRWithLogo(url); // Usamos la nueva función con logo
      setQrCodeUrl(dataUrl);
      setShowQR(true);
      showThemedToast('¡Código QR generado con éxito!', 'success');
    } catch (err: any) {
      console.error("Error generando QR:", err);
      setErrorMessage(err.message || 'Hubo un problema al generar el código QR. Intenta de nuevo.');
      showThemedToast(err.message || 'La generación del QR falló.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = useCallback((format: 'png' | 'jpeg' = 'png') => {
    if (!qrCodeUrl) {
      showThemedToast('Primero genera un código QR para descargar.', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = qrCodeUrl.replace('image/png', `image/${format}`); // Ajusta tipo para JPEG
    link.download = `qr-montemorelos.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showThemedToast(`Código QR descargado exitosamente como ${format.toUpperCase()}!`, 'success');
  }, [qrCodeUrl, showThemedToast]);

  const copyToClipboard = useCallback(async () => {
    try {
      const urlToCopy = getFormFullUrl();
      await navigator.clipboard.writeText(urlToCopy);
      showThemedToast('URL del formulario copiada al portapapeles!', 'success');
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      showThemedToast('No se pudo copiar la URL al portapapeles.', 'error');
    }
  }, [getFormFullUrl, showThemedToast]);

  const shareQR = useCallback(async () => {
    const urlToShare = getFormFullUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Formulario de Reportes de Montemorelos',
          text: 'Escanea este QR o haz clic en el enlace para acceder a nuestro formulario oficial de reportes:',
          url: urlToShare
        });
        showThemedToast('Contenido compartido con éxito.', 'success');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          showThemedToast('Error al intentar compartir el contenido.', 'error');
          console.error("Share error:", error);
        }
      }
    } else {
      showThemedToast('Tu navegador no soporta la función de compartir nativa. La URL se ha copiado al portapapeles.', 'info');
      copyToClipboard(); // Fallback para copiar la URL
    }
  }, [getFormFullUrl, copyToClipboard, showThemedToast]);


  // Define algunas clases base para los botones, en línea con el dashboard
  const glassButtonBase = "transition-all font-semibold rounded-xl px-5 py-2.5 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-white active:scale-95 text-lg flex items-center justify-center gap-2";
  const btnGradient1 = `${glassButtonBase} bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-xl hover:shadow-2xl border border-transparent`;
  const btnOutlineBlue = `${glassButtonBase} bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-md`;
  const btnOutlineGreen = `${glassButtonBase} bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 shadow-md`;
  const btnOutlinePurple = `${glassButtonBase} bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 shadow-md`;
  const btnOutlineTeal = `${glassButtonBase} bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 hover:border-teal-300 shadow-md`;


  return (
    // Fondo degradado más complejo y sutil, consistente con otras páginas
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8 font-inter antialiased relative overflow-hidden">
      {/* Fondos animados con colores armónicos y un toque de blur */}
      <div className="absolute inset-0 mix-blend-multiply opacity-50 z-0">
        <motion.div 
            initial={{x: -100, y: -100, opacity: 0}} 
            animate={{x: [ -100, 1000], y: [-100, 800], opacity: [0, 0.4, 0]}} 
            transition={{duration: 30, repeat: Infinity, ease: "linear" as const }}
            className="w-80 h-80 rounded-full bg-blue-300 absolute blur-2xl"
        ></motion.div>
        <motion.div 
            initial={{x: 800, y: 100, opacity: 0}} 
            animate={{x: [ 800, -200], y: [100, 900], opacity: [0, 0.4, 0]}} 
            transition={{duration: 35, repeat: Infinity, ease: "linear" as const }}
            className="w-96 h-96 rounded-full bg-teal-300 absolute blur-2xl"
        ></motion.div>
        <motion.div 
            initial={{x: 400, y: 700, opacity: 0}} 
            animate={{x: [ 400, 0], y: [700, -200], opacity: [0, 0.3, 0]}} 
            transition={{duration: 40, repeat: Infinity, ease: "linear" as const }}
            className="w-72 h-72 rounded-full bg-purple-300 absolute blur-2xl"
        ></motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto py-10 space-y-12">
        {/* Encabezado principal con estilo glassmorphism consistente */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="text-center bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 shadow-3xl border border-gray-100 relative overflow-hidden"
        >
          {/* Capas sutiles para efecto de vidrio en hover */}
          <span className="absolute inset-0 bg-gradient-to-tr from-blue-50 via-white to-purple-50 opacity-30 z-0 rounded-[2.5rem]"></span>

          <motion.div
            initial={{ scale: 0.5, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring" as const, stiffness: 200, damping: 20, delay: 0.3 }}
            className="flex justify-center mb-6 relative z-10"
          >
            <img
              src="/Montemorelos.jpg"
              alt="Escudo de Montemorelos"
              className="h-28 w-28 sm:h-32 sm:w-32 object-contain rounded-full shadow-2xl p-2
              bg-gradient-to-tr from-teal-400 via-blue-400 to-indigo-500 transform hover:scale-110 transition-transform duration-300 ring-4 ring-blue-300 ring-opacity-70 border-4 border-white"
            />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-blue-700 to-indigo-800 mb-4 leading-tight drop-shadow-xl tracking-tight">
            Generador de Código QR
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 max-w-4xl mx-auto font-medium leading-relaxed drop-shadow-sm">
            Crea códigos QR personalizados para un acceso instantáneo a la{' '}
            <span className="font-semibold text-blue-700">aplicación web de la Presidencia Municipal de Montemorelos</span> desde tu dispositivo móvil.
          </p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '120px' }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="h-2.5 mx-auto mt-6 rounded-full bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 shadow-lg"
          ></motion.div>
        </motion.div>

        {/* Reorganización del grid y tarjetas más prominentes y estéticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mt-12">
          {/* Panel de Generación de QR (Columna Izquierda) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-3xl border border-gray-100 p-8 sm:p-10 flex flex-col items-center text-center relative group overflow-hidden transform hover:scale-[1.01] transition-all duration-300"
          >
            {/* Fondo decorativo interno al hover */}
            <span className="absolute top-0 left-0 w-32 h-32 rounded-full bg-blue-200 blur-xl opacity-0 transition-all duration-500 group-hover:opacity-30 group-hover:w-full group-hover:h-full z-0"></span>

            {/* Header del panel */}
            <div className="bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 rounded-2xl mb-8 shadow-xl shadow-indigo-900/50 w-full relative z-10">
              <QrCode className="h-12 w-12 sm:h-16 sm:w-16 mb-3 mx-auto" strokeWidth={1.5} />
              <h2 className="text-3xl sm:text-4xl font-bold mb-1 leading-tight">Crea Tu QR</h2>
              <p className="text-base sm:text-lg text-teal-100 opacity-90">Acceso rápido, directo y universal al formulario</p>
            </div>

            {/* Botón de Generar QR */}
            <div className="flex flex-col items-center w-full mb-8 relative z-10">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateQR}
                disabled={isGenerating}
                className={`${btnGradient1} px-10 py-4 sm:py-5 text-xl rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed transform group-hover:scale-105`}
                aria-label="Generar código QR"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-7 w-7 animate-spin" />
                    Generando QR...
                  </>
                ) : (
                  <>
                    <Zap className="h-7 w-7 transition-transform group-hover:rotate-6" />
                    Generar QR de la App
                  </>
                )}
              </motion.button>
              <p className="text-sm sm:text-base text-gray-600 mt-4 max-w-lg leading-relaxed">
                Genera el Código QR más reciente. ¡Es la forma más rápida y oficial de acceder a la aplicación desde tu dispositivo!
              </p>
            </div>

            {/* Mensaje de Error */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full flex items-center justify-center p-4 bg-red-50 border border-red-300 text-red-800 rounded-xl shadow-md text-base relative z-10 mb-6 font-medium"
              >
                <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Contenedor del QR y Botones de Acción */}
            <AnimatePresence mode="wait">
              {showQR && qrCodeUrl && !isGenerating ? (
                <motion.div
                  key="qr-content"
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 30 }}
                  transition={{ duration: 0.5, type: "spring" as const, stiffness: 120, damping: 15 }}
                  className="space-y-8 w-full relative z-10"
                >
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl shadow-inset-lg border-6 border-purple-200 flex justify-center items-center overflow-hidden cursor-grab"
                    title="Arrastra para guardar o haz clic derecho para copiar"
                  >
                    <img
                      src={qrCodeUrl}
                      alt="Código QR para la aplicación web de Montemorelos"
                      className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-lg shadow-xl border-2 border-gray-100"
                      // Previene arrastrar y abrir el PNG en el navegador
                      onDragStart={(e) => e.preventDefault()}
                      // Para navegadores que permitan click derecho rápido sobre imagen
                      onContextMenu={(e) => e.preventDefault()} 
                    />
                  </motion.div>
                  {/* URL Real y Botones de Copiar/Abrir */}
                  <div className="flex flex-col items-center gap-3 mt-4 px-4 sm:px-6">
                    <span className="text-gray-700 font-semibold text-base sm:text-lg">Enlace directo al formulario:</span>
                    <a
                      href={getFormFullUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline font-mono text-base sm:text-lg break-all text-center px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors shadow-sm w-full"
                      aria-label="Abrir enlace del formulario en nueva pestaña"
                    >
                      {getFormFullUrl()}
                    </a>
                    <div className="flex flex-wrap justify-center gap-3 mt-3">
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={copyToClipboard}
                        className={`${btnOutlineBlue} text-base py-2 px-4 rounded-xl`}
                        aria-label="Copiar URL del formulario al portapapeles"
                      >
                        <Copy className="h-5 w-5" /> Copiar URL
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => window.open(getFormFullUrl(), '_blank')}
                        className={`${btnOutlineGreen} text-base py-2 px-4 rounded-xl`}
                        aria-label="Abrir formulario en nueva pestaña"
                      >
                        <ExternalLink className="h-5 w-5" /> Abrir Formulario
                      </motion.button>
                    </div>
                  </div>
                  {/* Botones de Compartir/Descargar QR */}
                  <div className="flex flex-wrap justify-center gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => downloadQR('png')} // PNG por defecto
                      className={`${btnOutlinePurple} text-base py-2 px-4 rounded-xl`}
                      aria-label="Descargar QR como imagen PNG"
                    >
                      <Download className="h-5 w-5" /> Descargar QR (PNG)
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={shareQR}
                      className={`${btnOutlineTeal} text-base py-2 px-4 rounded-xl`}
                      aria-label="Compartir QR o enlace con otras aplicaciones"
                    >
                      <Share2 className="h-5 w-5" /> Compartir QR/Enlace
                    </motion.button>
                  </div>
                </motion.div>
              ) : ( // Placeholder cuando el QR no está generado
                <motion.div
                  key="placeholder-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] bg-gray-50 rounded-2xl border border-gray-200 shadow-inner my-6 p-4"
                >
                  <Sparkles className="h-20 w-20 text-gray-300 mb-5 animate-pulse" strokeWidth={1} />
                  <p className="text-xl text-gray-500 font-semibold text-center leading-relaxed">
                    ¡Listo para escanear! <br/> Haz clic en "Generar QR de la App" para crear tu código.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Soporte técnico, acceso inmediato y eficiente.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Panel de Guía Rápida & Beneficios (Columna Derecha) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-3xl border border-gray-100 p-8 sm:p-10 flex flex-col justify-between relative group overflow-hidden transform hover:scale-[1.01] transition-all duration-300"
          >
            {/* Fondo decorativo interno al hover */}
            <span className="absolute top-0 left-0 w-32 h-32 rounded-full bg-teal-200 blur-xl opacity-0 transition-all duration-500 group-hover:opacity-30 group-hover:w-full group-hover:h-full z-0"></span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-900 mb-6 flex items-center gap-4 border-b-2 pb-4 border-blue-100 relative z-10">
              <Sliders className="h-8 w-8 text-yellow-500 drop-shadow-sm" strokeWidth={1.5} />
              Guía Rápida & Beneficios
            </h2>
            {/* Lista numerada de Pasos */}
            <ol className="list-none text-gray-800 mb-8 space-y-6 text-lg leading-relaxed relative z-10">
              <li className="flex items-start">
                <span className="mr-4 text-3xl font-black text-blue-600 flex-shrink-0 mt-0.5">1.</span>
                <div>
                  <span className="font-extrabold text-blue-800 text-xl">Genera:</span> Haz clic en el botón "Generar QR de la App". En segundos, tu código QR exclusivo aparecerá con el logo de Montemorelos.
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-4 text-3xl font-black text-green-600 flex-shrink-0 mt-0.5">2.</span>
                <div>
                  <span className="font-extrabold text-green-800 text-xl">Escanea y Usa:</span> Simplemente usa la aplicación de Cámara de tu smartphone o cualquier lector de QR para escanearlo. ¡Serás redirigido al formulario de reportes de inmediato!
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-4 text-3xl font-black text-purple-600 flex-shrink-0 mt-0.5">3.</span>
                <div>
                  <span className="font-extrabold text-purple-800 text-xl">Comparte Fácil:</span> Usa los botones dedicados para descargarlo (PNG), copiar su URL o compartirlo directamente en redes sociales y apps de mensajería.
                </div>
              </li>
            </ol>

            {/* Subtítulo de Ventajas */}
            <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-800 mb-6 flex items-center gap-4 border-b-2 pb-4 border-purple-100 relative z-10">
              <ExternalLink className="h-7 w-7 text-purple-500 drop-shadow-sm" strokeWidth={1.5} />
              Ventajas Destacadas
            </h3>
            {/* Lista de Ventajas con iconos de Check */}
            <ul className="list-none text-gray-800 space-y-4 text-lg leading-relaxed relative z-10">
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 mr-3 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <span className="font-bold text-emerald-700">Acceso Instantáneo:</span> Elimina la necesidad de teclear direcciones, facilitando el acceso a todos los usuarios.
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 mr-3 text-sky-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <span className="font-bold text-sky-700">Difusión Amplificada:</span> Ideal para promocionarlo en material impreso, redes sociales o cualquier medio digital.
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 mr-3 text-orange-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <span className="font-bold text-orange-700">Compatibilidad Universal:</span> Funciona con la cámara de cualquier smartphone moderno, sin apps adicionales.
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 mr-3 text-indigo-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <span className="font-bold text-indigo-700">Imagen Profesional:</span> Presenta una solución tecnológica avanzada, mostrando la modernización de Montemorelos.
                </div>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;