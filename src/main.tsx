import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Deshabilitar StrictMode en producción para evitar problemas de rendimiento en dispositivos móviles
const StrictMode = process.env.NODE_ENV === 'development' ? React.StrictMode : React.Fragment;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
  </StrictMode>
);