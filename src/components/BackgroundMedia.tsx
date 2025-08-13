import React, { useState, useEffect } from 'react';

interface BackgroundMediaProps {
  // Tipo de medio: 'image', 'video' o 'both' para alternar entre ambos
  type: 'image' | 'video' | 'both';
  // URL de la imagen (para compatibilidad con versiones anteriores)
  src?: string;
  // URL de la imagen (nueva propiedad)
  imageSrc?: string;
  // URL del video (nueva propiedad)
  videoSrc?: string;
  // URL de respaldo en caso de error
  fallback?: string;
  // Opacidad del medio (0-1)
  opacity?: number;
  // Desenfoque del medio (píxeles)
  blur?: number;
  // Tiempo de alternancia entre imagen y video (en segundos, solo para type='both')
  toggleInterval?: number;
}

const BackgroundMedia: React.FC<BackgroundMediaProps> = ({
  type,
  src,
  imageSrc,
  videoSrc,
  fallback,
  opacity = 0.7,
  blur = 0,
  toggleInterval = 10
}) => {
  // Para compatibilidad con versiones anteriores
  const finalImageSrc = imageSrc || src;
  const finalVideoSrc = videoSrc || src;
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video'>('image');

  useEffect(() => {
    setMediaLoaded(false);
    setMediaError(false);

    // Si el tipo es 'both', alternar entre imagen y video
    if (type === 'both') {
      const interval = setInterval(() => {
        setCurrentMediaType(prev => prev === 'image' ? 'video' : 'image');
      }, toggleInterval * 1000);

      return () => clearInterval(interval);
    } else {
      // Si no es 'both', usar el tipo especificado
      setCurrentMediaType(type);
    }
  }, [type, toggleInterval]);

  useEffect(() => {
    if (currentMediaType === 'image' && finalImageSrc) {
      const img = new Image();
      img.src = finalImageSrc;
      img.onload = () => setMediaLoaded(true);
      img.onerror = () => {
        setMediaError(true);
        if (fallback) {
          const fallbackImg = new Image();
          fallbackImg.src = fallback;
          fallbackImg.onload = () => setMediaLoaded(true);
          fallbackImg.onerror = () => setMediaError(true);
        }
      };
    } else if (currentMediaType === 'video' && finalVideoSrc) {
      const video = document.createElement('video');
      video.src = finalVideoSrc;
      video.onloadeddata = () => setMediaLoaded(true);
      video.onerror = () => {
        setMediaError(true);
        if (fallback) {
          const fallbackImg = new Image();
          fallbackImg.src = fallback;
          fallbackImg.onload = () => setMediaLoaded(true);
          fallbackImg.onerror = () => setMediaError(true);
        }
      };
    }
  }, [currentMediaType, finalImageSrc, finalVideoSrc, fallback]);

  if (mediaError) {
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="absolute inset-0 z-0">
          <div className="absolute w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 top-0 left-1/4"></div>
          <div className="absolute w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 bottom-1/4 right-0"></div>
          <div className="absolute w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 bottom-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Indicador de carga */}
      {!mediaLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="absolute inset-0 z-0">
            <div className="absolute w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 top-0 left-1/4"></div>
            <div className="absolute w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 bottom-1/4 right-0"></div>
            <div className="absolute w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 bottom-0 left-0"></div>
          </div>
        </div>
      )}

      {/* Imagen de fondo */}
      {mediaLoaded && currentMediaType === 'image' && finalImageSrc && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ 
            backgroundImage: `url(${finalImageSrc})`,
            opacity: mediaLoaded ? opacity : 0,
            filter: `blur(${blur}px)`
          }}
        />
      )}

      {/* Video de fondo */}
      {mediaLoaded && currentMediaType === 'video' && finalVideoSrc && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ 
            opacity: mediaLoaded ? opacity : 0,
            filter: `blur(${blur}px)`
          }}
        >
          <source src={finalVideoSrc} type="video/mp4" />
          Tu navegador no soporta videos HTML5.
        </video>
      )}

      {/* Overlay para mejorar la legibilidad del contenido */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: 1 - opacity }}
      />

      {/* Indicador de tipo de medio (solo para desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
          {currentMediaType === 'image' ? 'Imagen' : 'Video'}
        </div>
      )}
    </div>
  );
};

export default BackgroundMedia;
