import { lookupExercises } from '../services/exerciseLookup';
import { Request, Response } from 'express';

import { RequestWithUser } from '../types/express';

import prisma from '../utils/prisma';

// Helper function to enrich routine exercises with complete exercise data
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
          image_url: fullExercise?.imageUrl || exercise.imageUrl || exercise.image_url || null,
          imageUrl: fullExercise?.imageUrl || exercise.imageUrl || exercise.image_url || null, // Mantener ambos para compatibilidad
          description: fullExercise?.description || exercise.description || null,
          type: fullExercise?.type || exercise.type || null,
          equipment: fullExercise?.equipment || exercise.equipment || null,
          difficulty: fullExercise?.difficulty || exercise.difficulty || null,
          muscles: fullExercise?.muscles || exercise.muscles || null,
          weightsPerSeries: Array.isArray((exercise as any).weightsPerSeries)
            ? (exercise as any).weightsPerSeries
            : (typeof exercise.weight === 'string' && exercise.weight.includes('-')
                ? exercise.weight.split('-').map((w: string) => {
                    const n = parseFloat(String(w).replace(',', '.'));
                    return isNaN(n) ? 0 : Math.round(n * 10) / 10;
                  })
                : (exercise as any).weightsPerSeries)
        };
      } catch (error) {
        console.error("Error enriching exercise:");
        return exercise; // Devolver el ejercicio original si hay error
      }
    })
  );

  return enrichedExercises;
};

// Obtener detalles de rutina para cliente
export const getRoutineDetailsForClient = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {


    const user = req.user;
    if (!user || !user.id) {

      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { id } = req.params;

    
    // Buscar rutina directa del cliente
    let routine = await prisma.routine.findFirst({
      where: { 
        id: id,
        clientId: user.id 
      },
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



    // Si no se encuentra rutina directa, buscar en asignaciones
    if (!routine) {

      const assignment = await prisma.routineAssignment.findFirst({
        where: {
          clientId: user.id,
          routineId: id,
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

      if (assignment) {

        routine = assignment.routine as any;
        // Agregar información de la asignación
        (routine as any).assignedDate = assignment.assignedDate;
        (routine as any).startDate = assignment.startDate;
        (routine as any).endDate = assignment.endDate;
        (routine as any).assignmentId = assignment.id;
      }
    }



    if (!routine) {

      res.status(404).json({ message: 'Routine not found or not accessible' });
      return;
    }



    // Procesar ejercicios desde JSON
    let exercisesArray = [];
    if (routine.exercises) {
      try {
        exercisesArray = typeof routine.exercises === 'string' 
          ? JSON.parse(routine.exercises) 
          : routine.exercises;
        
        if (!Array.isArray(exercisesArray)) {
          exercisesArray = [];
        }
      } catch (error) {
        console.error("Error parsing exercises JSON:");
        exercisesArray = [];
      }
    }

    // Enriquecer ejercicios con datos completos
    const enrichedRoutine = {
      ...routine,
      exercises: await enrichRoutineExercises(exercisesArray, routine.trainerId)
    };

    res.status(200).json({ data: enrichedRoutine });
  } catch (error) {
    console.error("Error fetching routine details for client:");
    res.status(500).json({ message: 'Internal server error while fetching routine details' });
  }
};
