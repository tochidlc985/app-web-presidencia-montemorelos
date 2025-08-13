import React from "react";
import Navigation from "./Navigation";
import { LogOut } from "lucide-react";

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface LayoutProps {
  children: React.ReactNode;
  backgroundImage?: string;
  user: User;
}

const Layout: React.FC<LayoutProps> = ({ children, backgroundImage, user }) => {
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    
    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <div
      className="min-h-screen flex flex-col relative bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100"
      style={{
        backgroundImage: backgroundImage
          ? `url(${backgroundImage}), linear-gradient(135deg, #e0e7ff, #f5f3ff, #fdf2f8)`
          : undefined,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundBlendMode: "overlay",
      }}
    >
      {/* Fondo animado o sutil */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="w-full h-full bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 opacity-70 animate-gradient"></div>
      </div>

      {/* Perfil superior */}
      <div className="w-full flex justify-end items-center px-8 py-4 backdrop-blur-lg bg-white/50 border-b border-purple-200 z-50 shadow-lg rounded-b-xl">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={user.avatar || "/Montemorelos.jpg"}
              alt="Avatar usuario"
              className="h-14 w-14 rounded-full border-4 border-purple-400 shadow-lg hover:scale-105 transform transition duration-200"
            />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {user.name || "Usuario"}
            </span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-purple-900 text-lg">{user.name}</div>
            <div className="text-xs text-gray-600">{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-200 to-pink-200 hover:from-pink-300 hover:to-purple-400 text-purple-700 font-semibold shadow-lg hover:scale-105 transform transition duration-200 flex items-center gap-2"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Navbar principal */}
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 shadow-lg border-b border-purple-200 rounded-b-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo-montemorelos.png"
              alt="Logo Montemorelos"
              className="h-10 w-10 rounded-full border-2 border-purple-300 shadow-lg transition-transform hover:scale-110"
            />
            <span className="font-bold text-xl text-purple-700 tracking-wide drop-shadow-lg">
              Presidencia Montemorelos
            </span>
          </div>
          <Navigation />
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-8 py-8 z-10 relative">
        {children}
      </main>

      {/* Footer con estilo elegante */}
      <footer className="mt-auto bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 text-center py-6 text-purple-700 text-sm border-t border-purple-200 shadow-inner rounded-t-xl">
        <p className="font-semibold">
          © {new Date().getFullYear()} Presidencia Municipal de Montemorelos.
        </p>
        <p className="mt-1">Todos los derechos reservados.</p>
      </footer>

      {/* Animación de fondo */}
      <style>
        {`
          .animate-gradient {
            animation: gradientBG 10s ease-in-out infinite alternate;
          }
          @keyframes gradientBG {
            0% { opacity: 0.7; }
            100% { opacity: 0.9; }
          }
        `}
      </style>
    </div>
  );
};

export default Layout;