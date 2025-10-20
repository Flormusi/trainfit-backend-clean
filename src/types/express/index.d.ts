import { User as PrismaUser, Role } from '@prisma/client';
import { UserProfile } from '../express';

declare global {
  namespace Express {
    export interface Request {
      user?: UserProfile;
    }
  }
}

export {};
