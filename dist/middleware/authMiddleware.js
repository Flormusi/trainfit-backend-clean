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
exports.client = exports.trainer = exports.admin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// Protect routes
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    // Check if auth header exists and starts with Bearer
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            // Get user from token
            req.user = yield User_1.default.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized, user not found'
                });
            }
            next();
        }
        catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }
    else {
        res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
});
exports.protect = protect;
// Admin only middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        res.status(403).json({
            success: false,
            message: 'Not authorized as an admin'
        });
    }
};
exports.admin = admin;
// Trainer only middleware
const trainer = (req, res, next) => {
    if (req.user && req.user.role === 'trainer') {
        next();
    }
    else {
        res.status(403).json({
            success: false,
            message: 'Not authorized as a trainer'
        });
    }
};
exports.trainer = trainer;
// Client only middleware
const client = (req, res, next) => {
    if (req.user && req.user.role === 'client') {
        next();
    }
    else {
        res.status(403).json({
            success: false,
            message: 'Not authorized as a client'
        });
    }
};
exports.client = client;
