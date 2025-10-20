/**
 * Middleware para implementar rate limiting en la API
 * Este middleware limita el número de solicitudes que un cliente puede hacer
 * en un período de tiempo determinado para prevenir abusos y ataques.
 */

const rateLimit = require('express-rate-limit');
const { createError } = require('../utils/responseHandler');

/**
 * Configuración base para el rate limiter
 * @param {Object} options - Opciones de configuración
 * @returns {Function} Middleware de rate limiting
 */
const createRateLimiter = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutos por defecto
    max: 100, // Límite de solicitudes por ventana de tiempo
    standardHeaders: true, // Devuelve los headers estándar de rate limit
    legacyHeaders: false, // Deshabilita los headers antiguos
    message: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo más tarde',
    handler: (req, res, next, options) => {
      next(createError(options.message, 429));
    }
  };

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

/**
 * Rate limiter para rutas de autenticación (más restrictivo)
 */
exports.authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Límite de 10 intentos por ventana
  message: 'Demasiados intentos de autenticación, por favor intente de nuevo después de 15 minutos'
});

/**
 * Rate limiter para rutas de API general
 */
exports.apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // Límite de 100 solicitudes por ventana
});

/**
 * Rate limiter para rutas críticas o sensibles
 */
exports.sensitiveRouteLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // Límite de 20 solicitudes por hora
  message: 'Demasiadas solicitudes a rutas sensibles, por favor intente de nuevo más tarde'
});

/**
 * Rate limiter para prevenir ataques de fuerza bruta
 */
exports.bruteForceProtection = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Límite de 5 intentos por hora
  message: 'Demasiados intentos fallidos, cuenta bloqueada temporalmente. Intente de nuevo después de 1 hora'
});