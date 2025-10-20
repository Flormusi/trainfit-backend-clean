"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.forgotPassword = exports.getCurrentUser = exports.login = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../src/utils/prisma")); // Updated path
const client_1 = require("@prisma/client"); // Asegúrate que Role está exportado o definido
const registerUser = async (req, res) => {
    const { email, password, name, role, /* otros campos como membershipTier si vienen del request */ } = req.body;
    // const { email, password, name, role, membershipTier } = req.body; // Si membershipTier viene en el request
    if (!email || !password || !role) {
        return res.status(400).json({ message: 'El correo electrónico, la contraseña y el rol son obligatorios' });
    }
    if (role === 'CLIENT' /* && !membershipTier */) {
        // Si membershipTier es obligatorio para CLIENT, deberías validarlo aquí también
        // return res.status(400).json({ message: 'El nivel de membresía es obligatorio para los clientes' });
    }
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role, // Asegúrate que 'role' es uno de los valores del enum Role
                // membership_tier: role === 'CLIENT' ? membershipTier : undefined, // Elimina esta línea
            },
        });
        // Si el usuario es un CLIENTE y necesitas crear un ClientProfile:
        if (newUser.role === client_1.Role.CLIENT) {
            // Aquí podrías querer crear un ClientProfile asociado
            // await prisma.clientProfile.create({
            //     data: {
            //         userId: newUser.id,
            //         name: newUser.name || '', // o tomar el nombre del request
            //         // Aquí podrías añadir membership_tier si lo mueves a ClientProfile
            //         // membershipTier: membershipTier
            //         // otros campos de ClientProfile
            //     }
            // });
        }
        // Generar JWT
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, role: newUser.role }, // <--- CAMBIA 'userId' a 'id'
        process.env.JWT_SECRET || 'DEFAULT_SECRET_KEY', { expiresIn: '1h' });
        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name,
            },
        });
    }
    catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({ message: 'El correo electrónico ya está en uso' });
        }
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.registerUser = registerUser;
// Make sure this is placed AFTER the registerUser function
const login = async (req, res) => {
    console.log('[AUTH_LOGIN_START] Login attempt received at:', new Date().toISOString());
    console.log('[AUTH_LOGIN_HEADERS] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[AUTH_LOGIN_BODY] Request body:', JSON.stringify(req.body, null, 2));
    console.log('LOGIN_CONTROLLER_BODY:', JSON.stringify(req.body, null, 2));
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials - user not found' });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials - password incorrect' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true en producción
            sameSite: 'lax', // o 'strict' o 'none' según tus necesidades de CSRF y cross-site
            maxAge: 3600000 // 1 hora en milisegundos
        });
        // No incluyas la contraseña u otra información sensible aquí
        // No envíes el token en el cuerpo de la respuesta si ya lo estás enviando como cookie
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                hasCompletedOnboarding: true // Por defecto true para usuarios existentes
            }
        });
    }
    catch (error) {
        console.error('Error during login:', error);
        // Asegúrate que 'res' esté disponible aquí. Si 'error' es una instancia de Error, puedes acceder a error.message
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        res.status(500).json({ message: 'Server error during login', error: errorMessage });
    }
};
exports.login = login;
// Placeholder for getCurrentUser
const getCurrentUser = async (req, res) => {
    // The user object should be attached to req by the 'protect' middleware
    // For now, req.user might be undefined or have a different structure
    // until 'protect' middleware is fully aligned with PostgreSQL users.
    // @ts-ignore
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: 'Not authorized, user ID not found in token' });
    }
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                // membership_tier: true,
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            status: 'success',
            data: user,
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Failed to get user information' });
    }
};
exports.getCurrentUser = getCurrentUser;
// Placeholder for forgotPassword
const forgotPassword = async (req, res) => {
    // Implementation for password reset logic (e.g., send reset email)
    res.status(501).json({ message: 'Forgot password not implemented yet' });
};
exports.forgotPassword = forgotPassword;
// Placeholder for updateProfile
const updateProfile = async (req, res) => {
    // Implementation for updating user profile
    res.status(501).json({ message: 'Update profile not implemented yet' });
};
exports.updateProfile = updateProfile;
