"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
// ✅ Middleware para proteger rutas
exports.protect = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let token;
    if ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'defaultsecret');
            const user = yield user_model_1.default.findById(decoded.id).select('-password');
            if (!user) {
                console.log('🚫 Usuario no encontrado aunque el token era válido');
                res.status(401);
                throw new Error('No autorizado, usuario no encontrado');
            }
            req.user = user;
            console.log(`✅ Usuario autenticado: ${user.name} (rol: ${user.role}, ID: ${user._id})`);
            next();
        }
        catch (error) {
            console.error('🚫 Error en la verificación del token:', error);
            res.status(401);
            throw new Error('Token inválido');
        }
    }
    else {
        console.log('🚫 No se proporcionó token de autenticación');
        res.status(401);
        throw new Error('No autorizado, no se proporcionó token');
    }
}));
// ✅ Middleware para restringir acceso por roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('No autorizado, usuario no autenticado');
        }
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            console.log(`🚫 Acceso denegado: usuario con rol ${req.user.role}, permitido: ${roles.join(', ')}`);
            res.status(403);
            throw new Error(`Usuario con rol ${req.user.role} no autorizado`);
        }
        next();
    };
};
exports.authorize = authorize;
