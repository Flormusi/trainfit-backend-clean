"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeEmailDataMiddleware = exports.sanitizeEmailData = exports.cleanupExpiredRateLimits = exports.emailRateLimit = exports.validateEmailSecurityMiddleware = exports.validateEmailSecurity = exports.validateWelcomeEmailData = void 0;
const Joi = __importStar(require("joi"));
/**
 * Esquema de validación para datos de correo de bienvenida
 */
const welcomeEmailSchema = Joi.object({
    clientName: Joi.string().min(2).max(100).required().messages({
        'string.min': 'El nombre del cliente debe tener al menos 2 caracteres',
        'string.max': 'El nombre del cliente no puede exceder 100 caracteres',
        'any.required': 'El nombre del cliente es obligatorio'
    }),
    clientEmail: Joi.string().email().required().messages({
        'string.email': 'El email del cliente debe tener un formato válido',
        'any.required': 'El email del cliente es obligatorio'
    }),
    trainerName: Joi.string().min(2).max(100).required().messages({
        'string.min': 'El nombre del entrenador debe tener al menos 2 caracteres',
        'string.max': 'El nombre del entrenador no puede exceder 100 caracteres',
        'any.required': 'El nombre del entrenador es obligatorio'
    }),
    temporaryPassword: Joi.string().min(8).max(50).required().messages({
        'string.min': 'La contraseña temporal debe tener al menos 8 caracteres',
        'string.max': 'La contraseña temporal no puede exceder 50 caracteres',
        'any.required': 'La contraseña temporal es obligatoria'
    }),
    loginUrl: Joi.string().uri().optional().messages({
        'string.uri': 'La URL de login debe ser una URL válida'
    }),
    supportEmail: Joi.string().email().optional().messages({
        'string.email': 'El email de soporte debe tener un formato válido'
    }),
    supportPhone: Joi.string().pattern(/^[+]?[0-9\s\-()]{10,20}$/).optional().messages({
        'string.pattern.base': 'El teléfono de soporte debe tener un formato válido'
    })
});
/**
 * Middleware para validar datos de correo de bienvenida
 */
const validateWelcomeEmailData = (req, res, next) => {
    const { error } = welcomeEmailSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({
            message: 'Datos de correo de bienvenida inválidos',
            errors: errorMessages
        });
    }
    next();
};
exports.validateWelcomeEmailData = validateWelcomeEmailData;
/**
 * Valida si un email tiene un formato válido y no está en la lista de dominios bloqueados
 */
const validateEmailSecurity = (email) => {
    // Lista de dominios temporales/desechables comunes (se puede expandir)
    const blockedDomains = [
        '10minutemail.com',
        'tempmail.org',
        'guerrillamail.com',
        'mailinator.com',
        'throwaway.email',
        'temp-mail.org',
        'yopmail.com'
    ];
    // Validar formato básico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, reason: 'Formato de email inválido' };
    }
    // Extraer dominio
    const domain = email.split('@')[1]?.toLowerCase();
    // Verificar si el dominio está bloqueado
    if (blockedDomains.includes(domain)) {
        return { isValid: false, reason: 'Dominio de email no permitido' };
    }
    // Verificar longitud razonable
    if (email.length > 254) {
        return { isValid: false, reason: 'Email demasiado largo' };
    }
    return { isValid: true };
};
exports.validateEmailSecurity = validateEmailSecurity;
/**
 * Middleware para validar la seguridad del email antes del envío
 */
const validateEmailSecurityMiddleware = (req, res, next) => {
    const { email, clientEmail } = req.body;
    const emailToValidate = email || clientEmail;
    if (!emailToValidate) {
        return res.status(400).json({
            message: 'Email requerido para validación de seguridad'
        });
    }
    const validation = (0, exports.validateEmailSecurity)(emailToValidate);
    if (!validation.isValid) {
        return res.status(400).json({
            message: 'Email no válido para envío',
            reason: validation.reason
        });
    }
    next();
};
exports.validateEmailSecurityMiddleware = validateEmailSecurityMiddleware;
const emailRateLimits = new Map();
/**
 * Middleware de rate limiting para envío de emails
 */
const emailRateLimit = (maxEmails = 10, windowMinutes = 60) => {
    return (req, res, next) => {
        const identifier = req.ip || req.user?.id || 'unknown';
        const now = Date.now();
        const windowMs = windowMinutes * 60 * 1000;
        const entry = emailRateLimits.get(identifier);
        if (!entry || now > entry.resetTime) {
            // Nueva ventana de tiempo
            emailRateLimits.set(identifier, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }
        if (entry.count >= maxEmails) {
            const resetIn = Math.ceil((entry.resetTime - now) / 1000 / 60);
            return res.status(429).json({
                message: 'Límite de envío de emails excedido',
                resetInMinutes: resetIn
            });
        }
        entry.count++;
        next();
    };
};
exports.emailRateLimit = emailRateLimit;
/**
 * Limpia entradas expiradas del rate limit (ejecutar periódicamente)
 */
const cleanupExpiredRateLimits = () => {
    const now = Date.now();
    for (const [key, entry] of emailRateLimits.entries()) {
        if (now > entry.resetTime) {
            emailRateLimits.delete(key);
        }
    }
};
exports.cleanupExpiredRateLimits = cleanupExpiredRateLimits;
/**
 * Sanitiza datos de entrada para prevenir inyección de HTML/XSS
 */
const sanitizeEmailData = (data) => {
    const sanitized = { ...data };
    // Lista de campos que deben ser sanitizados
    const fieldsToSanitize = ['clientName', 'trainerName', 'supportEmail', 'supportPhone'];
    fieldsToSanitize.forEach(field => {
        if (sanitized[field] && typeof sanitized[field] === 'string') {
            // Remover caracteres potencialmente peligrosos
            sanitized[field] = sanitized[field]
                .replace(/[<>"'&]/g, '') // Remover caracteres HTML básicos
                .trim() // Remover espacios al inicio y final
                .substring(0, 200); // Limitar longitud
        }
    });
    return sanitized;
};
exports.sanitizeEmailData = sanitizeEmailData;
/**
 * Middleware para sanitizar datos de email
 */
const sanitizeEmailDataMiddleware = (req, res, next) => {
    req.body = (0, exports.sanitizeEmailData)(req.body);
    next();
};
exports.sanitizeEmailDataMiddleware = sanitizeEmailDataMiddleware;
