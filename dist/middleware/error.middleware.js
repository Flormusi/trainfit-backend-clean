"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Middleware para manejo de errores
const errorHandler = (err, req, res, next) => {
    console.error('Error atrapado en middleware:', err.message || err);
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server Error'
    });
};
exports.default = errorHandler;
