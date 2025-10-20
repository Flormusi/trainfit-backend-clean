"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Ensure SignOptions is imported
const prisma = new client_1.PrismaClient();
const sendTokenResponse = (user, statusCode, res) => {
    const secret = process.env.JWT_SECRET;
    const expiresInOption = process.env.JWT_EXPIRE || '30d';
    if (!secret) {
        console.error('JWT_SECRET no definido.');
        res.status(500).json({ success: false, message: 'Error del servidor.' });
        return;
    }
    const jwtOptions = {
        expiresIn: expiresInOption, // Workaround: Type assertion
    };
    const token = jsonwebtoken_1.default.sign({ id: user.id }, secret, jwtOptions);
    const cookieOptions = {
        expires: new Date(Date.now() + parseInt(expiresInOption) * 24 * 60 * 60 * 1000), // Assuming '30d' format, parse for cookie
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };
    // A more robust way to handle cookie expiration based on expiresInOption:
    let cookieExpiresInMs;
    if (expiresInOption.endsWith('d')) {
        cookieExpiresInMs = parseInt(expiresInOption.replace('d', '')) * 24 * 60 * 60 * 1000;
    }
    else if (expiresInOption.endsWith('h')) {
        cookieExpiresInMs = parseInt(expiresInOption.replace('h', '')) * 60 * 60 * 1000;
    }
    else if (expiresInOption.endsWith('m')) {
        cookieExpiresInMs = parseInt(expiresInOption.replace('m', '')) * 60 * 1000;
    }
    else {
        cookieExpiresInMs = parseInt(expiresInOption) * 1000;
    }
    const robustCookieOptions = {
        expires: new Date(Date.now() + cookieExpiresInMs),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        domain: 'localhost'
    };
    const { password, resetPasswordToken, resetPasswordExpire, ...userOutput } = user;
    res.status(statusCode).cookie('token', token, robustCookieOptions).json({
        success: true,
        token,
        user: userOutput,
    });
};
// REGISTER
const register = async (req, res) => {
    try {
        const { name, email, password, role, clientProfileName, membershipTier } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'Email already registered' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const userRole = role.toUpperCase();
        if (!Object.values(client_1.Role).includes(userRole)) {
            res.status(400).json({ success: false, message: 'Invalid role specified' });
            return;
        }
        const userData = {
            name,
            email,
            password: hashedPassword,
            role: userRole,
            hasCompletedOnboarding: false,
        };
        if (userRole === client_1.Role.CLIENT) {
            userData.clientProfile = {
                create: {
                    name: clientProfileName || name,
                    ...(membershipTier && { membershipTier }),
                },
            };
        }
        const user = await prisma.user.create({
            data: userData,
            include: { clientProfile: userRole === client_1.Role.CLIENT },
        });
        sendTokenResponse(user, 201, res);
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.register = register;
// LOGIN
const login = async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { email, password: plainPassword } = req.body;
        console.log('Parsed credentials - email:', email);
        if (!email || !plainPassword) {
            console.log('Login attempt failed: Missing credentials');
            res.status(400).json({ success: false, message: 'Por favor, proporciona email y contraseña' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                role: true,
                hasCompletedOnboarding: true,
                password: true,
                name: true
            },
        });
        if (!user) {
            console.log('Login attempt failed: User not found -', email);
            res.status(401).json({ success: false, message: 'Credenciales inválidas', error: 'Usuario o contraseña incorrectos' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(plainPassword, user.password);
        if (!isMatch) {
            console.log('Login attempt failed: Invalid password for user -', email);
            res.status(401).json({ success: false, message: 'Credenciales inválidas', error: 'Usuario o contraseña incorrectos' });
            return;
        }
        console.log('Login successful for user:', email);
        const jwtSecret = process.env.JWT_SECRET;
        const jwtExpireOption = process.env.JWT_EXPIRE || '30d';
        if (!jwtSecret) {
            console.error('JWT_SECRET no está definido.');
            res.status(500).json({ message: 'Server config error' });
            return;
        }
        const jwtOptions = {
            expiresIn: jwtExpireOption, // Workaround: Type assertion
        };
        const token = jsonwebtoken_1.default.sign({ id: user.id }, jwtSecret, jwtOptions);
        const { password, ...userData } = user;
        const cookieOptions = {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            domain: 'localhost'
        };
        res.status(200)
            .cookie('token', token, cookieOptions)
            .json({
            success: true,
            token,
            user: userData
        });
    }
    catch (error) {
        console.error('Login error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            meta: error.meta
        });
        res.status(500).json({
            success: false,
            message: 'Error en el servidor. Por favor, inténtalo de nuevo más tarde.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.login = login;
