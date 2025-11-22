/**
 * Middleware para manejo centralizado de errores en la API
 * Proporciona respuestas de error consistentes y estructuradas
 */

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware para manejar errores de forma centralizada
 * @param {Error} err - El error capturado
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {NextFunction} next - Función next de Express
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log del error para debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // MongoDB bad ObjectId
  if (err.name === 'CastError') {
    const message = 'ID de recurso no válido';
    error = new AppError(message, 400);
  }
  
  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} ya existe en el sistema`;
    error = new AppError(message, 409);
  }
  
  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token JWT inválido';
    error = new AppError(message, 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    const message = 'Token JWT expirado';
    error = new AppError(message, 401);
  }
  
  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: error.details || null,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Ruta no encontrada - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Función wrapper para manejar errores en funciones async/await
 * @param {Function} fn - Función async a envolver
 * @returns {Function} Función middleware con manejo de errores
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
