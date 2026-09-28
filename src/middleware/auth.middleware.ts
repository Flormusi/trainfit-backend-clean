import { Response, NextFunction, Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { UserProfile } from '../types/express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserProfile;
  }
}

import prisma from '../utils/prisma';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    let token;

    // Buscar token en el header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];

    }
    // Si no se encuentra en Authorization, buscar en las cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;

    }

    if (!token) {

        res.status(401).json({ message: 'Not authorized to access this route' });
        return;
    }


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        });

        if (!user) {

            res.status(401).json({ message: 'User not found in database' });
            return;
        }
        

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
        

        next();
    } catch (error: unknown) {

        res.status(401).json({ message: 'Not authorized to access this route' });
        return;
    }
};

export const authorize = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {


        
        if (!req.user) {

            res.status(403).json({
                message: 'User is not authorized to access this route'
            });
            return;
        }


        if (!roles.includes(req.user.role)) {

            res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
            return;
        }


        next();
    };
};