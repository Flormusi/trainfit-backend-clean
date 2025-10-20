"use strict";
/**
 * Sistema de logging estructurado para la API de TrainFit
 * Este módulo proporciona funciones para registrar eventos y errores
 * de manera estructurada y consistente.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.debug = exports.info = exports.warn = exports.error = exports.requestLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_2 = require("winston");
const path_1 = __importDefault(require("path"));
// Configuración de formatos
const logFormat = winston_2.format.combine(winston_2.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_2.format.errors({ stack: true }), winston_2.format.splat(), winston_2.format.json());
// Formato para la consola (más legible para desarrollo)
const consoleFormat = winston_2.format.combine(winston_2.format.colorize(), winston_2.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_2.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level}: ${message}${metaString}`;
}));
// Determinar el entorno
const environment = process.env.NODE_ENV || 'development';
const isDevelopment = environment === 'development';
// Configurar transports según el entorno
const logTransports = [];
// Siempre añadir el transport de consola en desarrollo
if (isDevelopment) {
    logTransports.push(new winston_2.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}
// Añadir transports de archivo
logTransports.push(new winston_2.transports.File({
    filename: path_1.default.join('logs', 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
}), new winston_2.transports.File({
    filename: path_1.default.join('logs', 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
}));
// Crear el logger
const logger = winston_1.default.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    defaultMeta: { service: 'trainfit-api' },
    transports: logTransports,
    exitOnError: false
});
exports.logger = logger;
/**
 * Middleware para registrar solicitudes HTTP
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {NextFunction} next - Función next de Express
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
        const duration = new Date().getTime() - startTime.getTime();
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
exports.requestLogger = requestLogger;
// Funciones de conveniencia para logging
const error = (message, meta = {}) => logger.error(message, meta);
exports.error = error;
const warn = (message, meta = {}) => logger.warn(message, meta);
exports.warn = warn;
const info = (message, meta = {}) => logger.info(message, meta);
exports.info = info;
const debug = (message, meta = {}) => logger.debug(message, meta);
exports.debug = debug;
// Método para registrar errores con stack trace
const logError = (message, error, meta = {}) => {
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
exports.logError = logError;
