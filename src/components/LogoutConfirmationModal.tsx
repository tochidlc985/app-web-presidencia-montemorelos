// src/components/LogoutConfirmationModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react'; // Usamos LogOut para el botón
import toast from 'react-hot-toast';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  // Clases de botón muy específicas para el look de la imagen
  const btnLogoutImageStyle = "bg-[#f54e4c] text-white font-medium text-lg px-6 py-2 rounded-lg shadow-md hover:bg-red-500 transition-colors duration-200 active:scale-98 flex items-center justify-center gap-2";
  const btnCancelImageStyle = "text-gray-600 font-medium text-lg px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 active:scale-98"; // Para "Cancelar"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" // Z-index alto para asegurar visibilidad
        >
          <motion.div
            initial={{ scale: 0.8, y: -50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -50, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 100, damping: 15 }}
            // CAMBIO CLAVE AQUÍ: Simplificamos la tarjeta del modal para parecerse a la imagen original
            // Elimino los `backdrop-blur-xl`, `shadow-3xl`, `rounded-[2.5rem]`, y `border` pronunciados
            className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 relative" // Más minimalista y "clásico" de modal
          >
            {/* Botón de cerrar modal (X) - Si es necesario, lo mantenemos como opción moderna, sino se quita */}
            {/* Mantener la 'X' superior derecha es una buena práctica de UX, aunque no esté en la imagen */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition-colors duration-200"
              onClick={onClose}
              title="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Contenido principal del modal: Solo la pregunta */}
            <div className="flex flex-col items-start px-2 pt-2 pb-6"> {/* Padding interno ajustado */}
              <p className="text-xl text-gray-800 font-normal"> {/* Texto de la imagen es menos negrita */}
                ¿Estás seguro que deseas cerrar sesión?
              </p>
            </div>

            {/* Controles del modal (botones) - Alineación a la derecha como en la imagen */}
            <div className="flex justify-end gap-4 mt-4"> {/* Ajuste el gap y margin-top si es necesario */}
              <motion.button
                whileHover={{ scale: 1.02 }} // Escala un poco al pasar el ratón
                whileTap={{ scale: 0.98 }}   // Ligera escala al hacer clic
                onClick={onClose}
                className={`${btnCancelImageStyle}`}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} // Escala un poco al pasar el ratón
                whileTap={{ scale: 0.98 }}   // Ligera escala al hacer clic
                onClick={() => {
                  // Mostrar notificación de despedida
                  toast.success('¡Hasta pronto! Tu sesión ha sido cerrada correctamente.', {
                    duration: 4000,
                    position: 'top-center',
                    style: {
                      background: '#f97316',
                      color: '#fff',
                      fontWeight: 'bold',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '16px',
                    },
                  });
                  onConfirm();
                }}
                className={`${btnLogoutImageStyle}`}
              >
                Cerrar sesión
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoutConfirmationModal;