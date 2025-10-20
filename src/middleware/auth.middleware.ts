import { Response, NextFunction, Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { UserProfile } from '../types/express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserProfile;
  }
}

const prisma = new PrismaClient();

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
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
    } catch (error: unknown) {
        console.log('❌ protect: Token verification failed:', error);
        res.status(401).json({ message: 'Not authorized to access this route' });
        return;
    }
};

export const authorize = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
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