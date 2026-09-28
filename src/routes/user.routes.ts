import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { protect } from '../middleware/auth.middleware';
import { User, Prisma } from '@prisma/client';

import prisma from '../utils/prisma';

const router = express.Router();

interface GetUserParams {
  clientId: string;
}

type UserResponse = {
  id: string;
  name: string | null;
  email: string;
  role: User['role'];
  hasCompletedOnboarding: boolean;
}

interface ErrorResponse {
  message: string;
}

// Controlador para obtener usuario por ID
const getUserByIdHandler: RequestHandler<GetUserParams, UserResponse | ErrorResponse, any, any> = async (
  req,
  res,
  next
) => {
  const { clientId } = req.params;


  try {
    const user = await prisma.user.findUnique({
      where: { id: clientId }
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasCompletedOnboarding: user.hasCompletedOnboarding
    });
  } catch (err) {
    console.error("Error al obtener usuario:");
    next(err); // Pasa el error al manejador de errores de Express
  }
};


interface UpdateOnboardingParams {
  userId: string;
}

const updateUserOnboardingDataHandler: RequestHandler<UpdateOnboardingParams, UserResponse | ErrorResponse, any, any> = async (
  req,
  res,
  next
): Promise<void> => {
  const { userId } = req.params;
  const { name, ...profileData } = req.body;




  try {
    // Filtrar solo los campos que existen en el esquema ClientProfile
    const validProfileFields = {
      weight: profileData.weight ? parseFloat(profileData.weight) : null,
      height: profileData.height ? parseFloat(profileData.height) : null,
      age: profileData.age ? parseInt(profileData.age) : null,
      gender: profileData.gender || null,
      injuries: profileData.injuries || null,
      medicalConditions: profileData.medicalConditions || null,
      medications: profileData.medications || null,
      fitnessLevel: profileData.fitnessLevel || null,
      goals: profileData.goals || [],
      phone: profileData.phone || null,
      trainingDaysPerWeek: profileData.trainingDaysPerWeek ? parseInt(profileData.trainingDaysPerWeek) : 3
    };



    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        hasCompletedOnboarding: true,
        clientProfile: {
          upsert: {
            create: {
              name: name || '',
              ...validProfileFields
            },
            update: validProfileFields
          }
        }
      },
      include: {
        clientProfile: true
      }
    });

    if (!updatedUser) {
      res.status(404).json({ message: 'Usuario no encontrado para actualizar onboarding.' });
      return;
    }

    res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      hasCompletedOnboarding: updatedUser.hasCompletedOnboarding
    });
    return;
  } catch (error) {
    console.error("Error al actualizar datos de onboarding:");
    res.status(500).json({ message: 'Error interno del servidor al actualizar onboarding.' });
    return;
  }
};

router.use(protect);

router.get('/:clientId', getUserByIdHandler);
router.put('/:userId/onboarding', updateUserOnboardingDataHandler);

export default router;