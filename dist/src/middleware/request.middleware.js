"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestMiddleware = void 0;
const requestMiddleware = (req, res, next) => {
    console.log('🔧 requestMiddleware called for:', req.method, req.path);
    console.log('🔧 req.user exists:', !!req.user);
    // Asegurarse de que req.user esté definido antes de continuar
    if (!req.user) {
        console.log('❌ requestMiddleware: User not authenticated');
        res.status(401).json({ message: 'User not authenticated' });
        return;
    }
    console.log('✅ requestMiddleware: User authenticated:', req.user.id, req.user.role);
    // Convertir Request a RequestWithUser
    const reqWithUser = req;
    // Asegurar que el usuario tenga todos los campos requeridos
    const userProfile = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || null,
        role: req.user.role,
        hasCompletedOnboarding: req.user.hasCompletedOnboarding || false,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
        status: req.user.status || null,
        resetPasswordToken: req.user.resetPasswordToken || null,
        resetPasswordExpire: req.user.resetPasswordExpire || null
    };
    // Asignar el perfil de usuario a la propiedad user
    reqWithUser.user = userProfile;
    console.log('✅ requestMiddleware: Proceeding to next middleware');
    next();
};
exports.requestMiddleware = requestMiddleware;
