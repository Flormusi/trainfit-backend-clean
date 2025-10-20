/**
 * Sistema de logging estructurado para la API de TrainFit
 * Este módulo proporciona funciones para registrar eventos y errores
 * de manera estructurada y consistente.
 */

const winston = require('winston');
const { format, transports } = winston;
const path = require('path');

// Configuración de formatos
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Formato para la consola (más legible para desarrollo)
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level}: ${message}${metaString}`;
  })
);

// Determinar el entorno
const environment = process.env.NODE_ENV || 'development';
const isDevelopment = environment === 'development';

// Configurar transports según el entorno
const logTransports = [];

// Siempre añadir el transport de consola en desarrollo
if (isDevelopment) {
  logTransports.push(
    new transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// Añadir transports de archivo
logTransports.push(
  new transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  new transports.File({
    filename: path.join('logs', 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
);

// Crear el logger
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  defaultMeta: { service: 'trainfit-api' },
  transports: logTransports,
  exitOnError: false
});

/**
 * Middleware para registrar solicitudes HTTP
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const requestLogger = (req, res, next) => {
  const startTime = new Date();
  
  // Registrar al inicio de la solicitud
  logger.info('Solicitud recibida', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'no autenticado'
  });

  // Capturar cuando la respuesta se complete
  res.on('finish', () => {
    const duration = new Date() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('Solicitud completada', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'no autenticado'
    });
  });

  next();
};

// Exportar el logger y middleware
module.exports = {
  logger,
  requestLogger,
  
  // Métodos de conveniencia
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  
  // Método para registrar errores con stack trace
  logError: (message, error, meta = {}) => {
    logger.error(message, {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      }
    });
  }
};