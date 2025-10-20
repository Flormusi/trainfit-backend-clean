import { Express, Request } from 'express';
import { Role } from '@prisma/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  hasCompletedOnboarding: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpire: Date | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

export interface RequestWithUser extends Express.Request {
  user: UserProfile;
}

export {};