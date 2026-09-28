import { Request, Response, NextFunction } from 'express';
import { RequestWithUser, UserProfile } from '../types/express';
import { Role } from '@prisma/client';

export const requestMiddleware = (req: Request, res: Response, next: NextFunction): void => {


    
    // Asegurarse de que req.user esté definido antes de continuar
    if (!req.user) {

        res.status(401).json({ message: 'User not authenticated' });
        return;
    }


    
    // Convertir Request a RequestWithUser
    const reqWithUser = req as RequestWithUser;
    
    // Asegurar que el usuario tenga todos los campos requeridos
    const userProfile: UserProfile = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || null,
        role: req.user.role as Role,
        hasCompletedOnboarding: req.user.hasCompletedOnboarding || false,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
        status: req.user.status || null,
        resetPasswordToken: req.user.resetPasswordToken || null,
        resetPasswordExpire: req.user.resetPasswordExpire || null
    };
    
    // Asignar el perfil de usuario a la propiedad user
    reqWithUser.user = userProfile;


    next();
};