import { Request } from 'express';
import { Role } from '@prisma/client';

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    hasCompletedOnboarding: boolean;
    createdAt: Date;
    updatedAt: Date;
    status: string | null;
    resetPasswordToken: string | null;
    resetPasswordExpire: Date | null;
}

export interface RequestWithUser extends Request {
    user?: UserProfile;
}