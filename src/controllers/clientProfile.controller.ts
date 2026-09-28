import { lookupExercises } from '../services/exerciseLookup';
import { Request, Response } from 'express';


import prisma from '../utils/prisma';

// Función auxiliar para enriquecer ejercicios con datos completos
const enrichRoutineExercises = async (exercises: any[], trainerId: string): Promise<any[]> => {
  if (!exercises || !Array.isArray(exercises)) {
    return [];
  }

  let matches;
  try {
    matches = await lookupExercises(exercises, trainerId);
  } catch {
    console.error('Exercise lookup failed');
    return exercises;
  }

  const enrichedExercises = await Promise.all(
    exercises.map(async (exercise) => {
      try {
        // Si el ejercicio ya tiene datos completos, devolverlo tal como está
        if (exercise.imageUrl && exercise.description) {
          return exercise;
        }

        const fullExercise = matches.get(exercise);

        // Combinar datos del ejercicio original con los datos completos encontrados
        return {
          ...exercise,
          imageUrl: fullExercise?.imageUrl || exercise.imageUrl || exercise.image_url || null,
          description: fullExercise?.description || exercise.description || null,
          type: fullExercise?.type || exercise.type || null,
          equipment: fullExercise?.equipment || exercise.equipment || null,
          difficulty: fullExercise?.difficulty || exercise.difficulty || null,
          muscles: fullExercise?.muscles || exercise.muscles || null
        };
      } catch (error) {
        console.error("Error enriching exercise:");
        return exercise; // Devolver el ejercicio original si hay error
      }
    })
  );

  return enrichedExercises;
};

// ✅ Obtener perfil del cliente
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!clientProfile) {
      res.status(404).json({ success: false, message: 'Perfil no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      data: clientProfile
    });
  } catch (error: any) {
    console.error("Error al obtener el perfil:");
    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }
};

// ✅ Crear o actualizar perfil del cliente
export const createOrUpdateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, goals, weight, medicalConditions, medications, injuries, initialObjective, trainingDaysPerWeek } = req.body;

    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    // Obtener el perfil existente para usar el nombre guardado si no viene en el body
    const existingProfile = await prisma.clientProfile.findUnique({
      where: { userId: req.user.id }
    });

    const profileName = name || existingProfile?.name || req.user?.name || 'Sin nombre';

    const updatedProfile = await prisma.clientProfile.upsert({
      where: { userId: req.user.id },
      update: {
        name: profileName,
        ...(phone !== undefined && { phone }),
        ...(goals !== undefined && { goals }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight.toString()) : null }),
        ...(medicalConditions !== undefined && { medicalConditions }),
        ...(medications !== undefined && { medications }),
        ...(injuries !== undefined && { injuries }),
        ...(initialObjective !== undefined && { initialObjective }),
        ...(trainingDaysPerWeek !== undefined && { trainingDaysPerWeek: parseInt(trainingDaysPerWeek.toString()) }),
      },
      create: {
        userId: req.user.id,
        name: profileName,
        phone,
        goals: goals || [],
        weight: weight ? parseFloat(weight.toString()) : null,
        medicalConditions,
        medications,
        injuries,
        initialObjective: initialObjective || 'Sin definir',
        trainingDaysPerWeek: trainingDaysPerWeek ? parseInt(trainingDaysPerWeek.toString()) : 3,
      }
    });

    // 👇 Actualizamos el estado del onboarding del usuario
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        hasCompletedOnboarding: true
      }
    });

    res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Perfil actualizado correctamente'
    });
  } catch (error: any) {
    console.error("Error al actualizar el perfil:");
    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }
};

// ✅ Obtener rutinas asignadas
export const getAssignedRoutines = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }



    // Buscar rutinas asignadas directamente
    const directRoutines = await prisma.routine.findMany({
      where: { clientId: req.user.id },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Buscar rutinas asignadas a través de RoutineAssignment
    const assignmentRoutines = await prisma.routineAssignment.findMany({
      where: { 
        clientId: req.user.id,
        endDate: {
          gte: new Date() // Solo rutinas que no han expirado
        }
      },
      include: {
        routine: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Combinar ambos tipos de rutinas
    const allRoutines = [
      ...directRoutines,
      ...assignmentRoutines.map(assignment => assignment.routine)
    ];

    // Eliminar duplicados basados en el ID
    const uniqueRoutines = allRoutines.filter((routine, index, self) => 
      index === self.findIndex(r => r.id === routine.id)
    );

    // Enriquecer ejercicios con datos completos
    const enrichedRoutines = await Promise.all(
      uniqueRoutines.map(async (routine) => ({
        ...routine,
        exercises: await enrichRoutineExercises(routine.exercises as any[], routine.trainerId)
      }))
    );



    res.status(200).json({
      success: true,
      data: enrichedRoutines
    });
  } catch (error: any) {
    console.error("❌ Error al obtener rutinas:");
    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }
};

// ✅ Obtener workouts asignados
export const getAssignedWorkouts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const routines = await prisma.routine.findMany({
      where: { clientId: req.user.id },
      select: {
        id: true,
        name: true,
        description: true,
        exercises: true,
        createdAt: true,
        updatedAt: true,
        trainerId: true
      }
    });

    // Enriquecer ejercicios con datos completos
    const enrichedRoutines = await Promise.all(
      routines.map(async ({ trainerId, ...routine }) => ({
        ...routine,
        exercises: await enrichRoutineExercises(routine.exercises as any[], trainerId)
      }))
    );

    res.status(200).json({
      success: true,
      data: enrichedRoutines
    });
  } catch (error: any) {
    console.error("Error al obtener workouts:");
    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }
};