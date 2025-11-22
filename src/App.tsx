import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import './styles/themes.css';

import AppLayout from './components/AppLayout';
import ReportForm from './pages/ReportForm';
import Dashboard from './pages/Dashboard';
import QRGenerator from './pages/QRGenerator';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GlobalSettingsProvider } from './context/GlobalSettingsContext';
import GlobalSettingsApplier from './components/GlobalSettingsApplier';
import Logout from './pages/Logout';

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <GlobalSettingsProvider>
          <AuthProvider>
            <GlobalSettingsApplier />
            <AppContent />
          </AuthProvider>
        </GlobalSettingsProvider>
      </ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e40af',
            color: '#fff',
          },
        }}
      />
    </Router>
  );
};

const AppContent: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuth();

  // Evitar problemas de hidratación en SSR
  const [isClient, setIsClient] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    if (isClient) {
      // Reducir el tiempo de espera para la verificación de autenticación
      setTimeout(() => {
        setIsAuthenticated(isLoggedIn());
      }, 300);
    }
  }, [isClient, isLoggedIn]);

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-600 font-medium">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <AppLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Routes>
            <Route path="/logout" element={<Logout />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/reporte" element={<ProtectedRoute><ReportForm /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/qr" element={<ProtectedRoute><QRGenerator /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </motion.div>
      </AppLayout>
    </div>
  );
};

export default App;
