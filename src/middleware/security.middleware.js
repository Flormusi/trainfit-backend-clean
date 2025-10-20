/**
 * Middleware de seguridad para la API
 * Este módulo proporciona funciones para proteger la API contra
 * ataques comunes y mejorar la seguridad general.
 */

const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const { createError } = require('../utils/responseHandler');

/**
 * Configuración de seguridad básica para Express
 * @param {Object} app - Instancia de Express
 */
exports.configureSecurityMiddleware = (app) => {
  // Middleware de Helmet para configurar cabeceras HTTP seguras
  app.use(helmet());

  // Prevenir ataques XSS (Cross-Site Scripting)
  app.use(xss());

  // Prevenir la contaminación de parámetros HTTP
  app.use(hpp());

  // Configurar CORS
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Agregar cabeceras de seguridad adicionales
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  return app;
};

/**
 * Middleware para validar y sanitizar parámetros de URL
 * @param {Array} allowedParams - Lista de parámetros permitidos
 */
exports.sanitizeUrlParams = (allowedParams = []) => {
  return (req, res, next) => {
    if (!req.params) return next();

    // Filtrar y sanitizar parámetros
    Object.keys(req.params).forEach(key => {
      if (!allowedParams.includes(key)) {
        delete req.params[key];
      } else if (typeof req.params[key] === 'string') {
        // Sanitizar valores de parámetros
        req.params[key] = req.params[key].replace(/[<>"'&]/g, '');
      }
    });

    next();
  };
};

/**
 * Middleware para validar el origen de las solicitudes
 * @param {Array} allowedOrigins - Lista de orígenes permitidos
 */
exports.validateOrigin = (allowedOrigins = []) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (!origin) return next();
    
    // Si no hay orígenes permitidos definidos, permitir cualquier origen
    if (allowedOrigins.length === 0) return next();
    
    // Verificar si el origen está en la lista de permitidos
    if (!allowedOrigins.includes(origin)) {
      return next(createError('Origen no permitido', 403));
    }
    
    next();
  };
};

/**
 * Middleware para prevenir ataques de fuerza bruta
 * Debe usarse junto con el rate limiter
 */
exports.bruteForceProtection = () => {
  const failedAttempts = new Map();
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutos
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Verificar si la IP está bloqueada
    if (failedAttempts.has(ip)) {
      const { count, blockedUntil } = failedAttempts.get(ip);
      
      // Si está bloqueada y el tiempo no ha expirado
      if (blockedUntil && blockedUntil > now) {
        const remainingMinutes = Math.ceil((blockedUntil - now) / 60000);
        return next(createError(`Demasiados intentos fallidos. Intente de nuevo en ${remainingMinutes} minutos`, 429));
      }
      
      // Si el tiempo de bloqueo ha expirado, reiniciar contador
      if (blockedUntil && blockedUntil <= now) {
        failedAttempts.delete(ip);
      }
    }
    
    // Middleware para registrar intentos fallidos
    res.on('finish', () => {
      // Si la respuesta es un error de autenticación (401)
      if (res.statusCode === 401) {
        const attempt = failedAttempts.get(ip) || { count: 0 };
        attempt.count += 1;
        
        // Si excede el máximo de intentos, bloquear
        if (attempt.count >= MAX_ATTEMPTS) {
          attempt.blockedUntil = now + BLOCK_DURATION;
        }
        
        failedAttempts.set(ip, attempt);
      } else if (res.statusCode === 200 && failedAttempts.has(ip)) {
        // Si la autenticación es exitosa, eliminar de la lista
        failedAttempts.delete(ip);
      }
    });
    
    next();
  };
};

/**
 * Middleware para validar y sanitizar el cuerpo de la solicitud
 */
exports.sanitizeRequestBody = () => {
  return (req, res, next) => {
    if (!req.body) return next();
    
    // Función recursiva para sanitizar objetos
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          // Sanitizar strings para prevenir XSS
          obj[key] = obj[key].replace(/[<>"'&]/g, '');
        } else if (typeof obj[key] === 'object') {
          // Recursivamente sanitizar objetos anidados
          obj[key] = sanitizeObject(obj[key]);
        }
      });
      
      return obj;
    };
    
    req.body = sanitizeObject(req.body);
    next();
  };
};

/**
 * Middleware para validar el token CSRF
 * Debe usarse junto con csurf
 */
exports.csrfProtection = (csrfProtection) => {
  return (req, res, next) => {
    // Excluir rutas que no necesitan protección CSRF
    const excludedPaths = ['/api/auth/login', '/api/auth/register'];
    if (excludedPaths.includes(req.path)) {
      return next();
    }
    
    // Aplicar protección CSRF
    csrfProtection(req, res, (err) => {
      if (err) {
        return next(createError('Token CSRF inválido', 403));
      }
      next();
    });
  };
};