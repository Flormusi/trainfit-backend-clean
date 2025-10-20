/**
 * Sistema de logging estructurado para la API de TrainFit
 * Este módulo proporciona funciones para registrar eventos y errores
 * de manera estructurada y consistente.
 */

import winston from 'winston';
import { format, transports } from 'winston';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../types/express';

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
const logTransports: winston.transport[] = [];

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
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {NextFunction} next - Función next de Express
 */
const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = new Date();
  
  // Registrar al inicio de la solicitud
  logger.info('Solicitud recibida', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: (req as RequestWithUser).user?.id || 'no autenticado'
  });

  // Capturar cuando la respuesta se complete
  res.on('finish', () => {
    const duration = new Date().getTime() - startTime.getTime();
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('Solicitud completada', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as RequestWithUser).user?.id || 'no autenticado'
    });
  });

  next();
};

interface LogMeta {
  [key: string]: any;
}

interface ErrorWithStack extends Error {
  code?: string | number;
}

// Funciones de conveniencia para logging
const error = (message: string, meta: LogMeta = {}) => logger.error(message, meta);
const warn = (message: string, meta: LogMeta = {}) => logger.warn(message, meta);
const info = (message: string, meta: LogMeta = {}) => logger.info(message, meta);
const debug = (message: string, meta: LogMeta = {}) => logger.debug(message, meta);

// Método para registrar errores con stack trace
const logError = (message: string, error: ErrorWithStack, meta: LogMeta = {}) => {
  logger.error(message, {
    ...meta,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    }
  });
};

// Exportar el logger y middleware
export {
  logger,
  requestLogger,
  error,
  warn,
  info,
  debug,
  logError
};