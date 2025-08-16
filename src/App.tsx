import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

import AppLayout from './components/AppLayout';
import ReportForm from './pages/ReportForm';
import Dashboard from './pages/Dashboard';
import QRGenerator from './pages/QRGenerator';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext'; // Importaciones necesarias
import Logout from './pages/Logout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
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
}

const AppContent: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuth();

  // Evitar problemas de hidratación en SSR
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">Cargando...</div>;
  }

  if (!isLoggedIn()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Routes>
        <Route path="/logout" element={<Logout />} />

        <Route path="*" element={
          <AppLayout>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/reporte" element={<ProtectedRoute><ReportForm /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/qr" element={<ProtectedRoute><QRGenerator /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </motion.div>
          </AppLayout>
        } />
      </Routes>
    </div>
  );
};

export default App;
