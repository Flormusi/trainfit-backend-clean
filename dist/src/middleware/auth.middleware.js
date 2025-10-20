"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const protect = async (req, res, next) => {
    console.log('🔐 protect middleware called for:', req.method, req.path);
    let token;
    // Buscar token en el header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('🔐 Token found in Authorization header');
    }
    // Si no se encuentra en Authorization, buscar en las cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log('🔐 Token found in cookies');
    }
    if (!token) {
        console.log('❌ protect: No token found');
        res.status(401).json({ message: 'Not authorized to access this route' });
        return;
    }
    console.log('🔐 Token exists, verifying...');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('🔐 Token verified, user ID:', decoded.id);
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        });
        if (!user) {
            console.log('❌ protect: User not found in database for ID:', decoded.id);
            res.status(401).json({ message: 'User not found in database' });
            return;
        }
        console.log('✅ protect: User found:', user.id, user.role);
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name || '',
            hasCompletedOnboarding: user.hasCompletedOnboarding,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            status: user.status || 'active',
            resetPasswordToken: user.resetPasswordToken,
            resetPasswordExpire: user.resetPasswordExpire
        };
        console.log('✅ protect: Proceeding to next middleware');
        next();
    }
    catch (error) {
        console.log('❌ protect: Token verification failed:', error);
        res.status(401).json({ message: 'Not authorized to access this route' });
        return;
    }
};
exports.protect = protect;
const authorize = (roles) => {
    return (req, res, next) => {
        console.log('🔑 authorize middleware called, required roles:', roles);
        console.log('🔑 req.user exists:', !!req.user);
        if (!req.user) {
            console.log('❌ authorize: No user found in request');
            res.status(403).json({
                message: 'User is not authorized to access this route'
            });
            return;
        }
        console.log('🔑 User role:', req.user.role, 'Required roles:', roles);
        if (!roles.includes(req.user.role)) {
            console.log('❌ authorize: User role not authorized');
            res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
            return;
        }
        console.log('✅ authorize: User authorized, proceeding to next middleware');
        next();
    };
};
exports.authorize = authorize;
