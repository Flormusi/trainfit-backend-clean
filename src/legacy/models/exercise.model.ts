import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  type?: string;
  equipment?: string;
  difficulty?: string;
  muscles: string[];
  trainerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default prisma;