"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.createError = exports.errorHandler = exports.error = exports.success = void 0;
/**
 * Crea una respuesta de éxito estandarizada
 * @param {Response} res - Objeto de respuesta Express
 * @param {number} statusCode - Código de estado HTTP (por defecto 200)
 * @param {*} data - Datos a enviar en la respuesta
 * @param {string} message - Mensaje descriptivo (opcional)
 */
const success = (res, statusCode = 200, data = null, message = '') => {
    const response = {
        success: true,
        message: message || getDefaultMessageForStatus(statusCode),
        data
    };
    return res.status(statusCode).json(response);
};
exports.success = success;
/**
 * Crea una respuesta de error estandarizada
 * @param {Response} res - Objeto de respuesta Express
 * @param {number} statusCode - Código de estado HTTP (por defecto 500)
 * @param {string} message - Mensaje de error
 * @param {Object} errors - Detalles adicionales del error (opcional)
 */
const error = (res, statusCode = 500, message = '', errors = null) => {
    const response = {
        success: false,
        message: message || getDefaultMessageForStatus(statusCode),
        errors
    };
    // Registrar el error en la consola para depuración
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[ERROR] ${statusCode}: ${message}`, errors || '');
    }
    return res.status(statusCode).json(response);
};
exports.error = error;
/**
 * Middleware para manejar errores de forma centralizada
 * @param {Error} err - Objeto de error
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {NextFunction} next - Función next de Express
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Error interno del servidor';
    let errors = err.errors || null;
    // Manejar errores específicos de Mongoose/MongoDB
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Error de validación';
        errors = Object.values(err.errors || {}).map((val) => val.message);
    }
    else if (err.code === 11000) {
        statusCode = 400;
        message = 'Valor duplicado';
        errors = { field: Object.keys(err.keyValue || {})[0], value: Object.values(err.keyValue || {})[0] };
    }
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Formato de datos inválido';
        errors = { field: err.path, value: err.value };
    }
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token inválido';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado';
    }
    return (0, exports.error)(res, statusCode, message, errors);
};
exports.errorHandler = errorHandler;
/**
 * Obtiene un mensaje predeterminado para un código de estado HTTP
 * @param {number} statusCode - Código de estado HTTP
 * @returns {string} Mensaje predeterminado
 */
function getDefaultMessageForStatus(statusCode) {
    const messages = {
        200: 'Operación exitosa',
        201: 'Recurso creado exitosamente',
        204: 'No hay contenido para mostrar',
        400: 'Solicitud incorrecta',
        401: 'No autorizado',
        403: 'Acceso prohibido',
        404: 'Recurso no encontrado',
        409: 'Conflicto con el estado actual',
        422: 'Entidad no procesable',
        500: 'Error interno del servidor',
        503: 'Servicio no disponible'
    };
    return messages[statusCode] || 'Operación completada';
}
/**
 * Crea un objeto de error personalizado con código de estado
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código de estado HTTP
 * @param {Object} errors - Detalles adicionales del error (opcional)
 * @returns {Error} Error personalizado
 */
const createError = (message, statusCode = 500, errors = null) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (errors)
        error.errors = errors;
    return error;
};
exports.createError = createError;
/**
 * Middleware para manejar rutas no encontradas
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const notFound = (req, res) => {
    return (0, exports.error)(res, 404, `Ruta no encontrada - ${req.originalUrl}`, { url: req.originalUrl });
};
exports.notFound = notFound;
