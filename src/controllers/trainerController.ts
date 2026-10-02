import { Request, Response, NextFunction } from 'express';
import { Role, Prisma } from '@prisma/client';
import { NotificationService } from '../services/notificationService';
import { EmailService } from '../services/emailService';
import { RequestWithUser } from '../types/express';

import prisma from '../utils/prisma';
import { lookupExercises, lookupRoutineExercises } from '../services/exerciseLookup';

const mergeExerciseData = (exercise: any, exerciseData: any) => exerciseData ? ({
  ...exercise,
  imageUrl: exerciseData.imageUrl,
  description: exerciseData.description,
  type: exerciseData.type,
  equipment: exerciseData.equipment,
  difficulty: exerciseData.difficulty,
  muscles: exerciseData.muscles
}) : exercise;

const enrichExercises = async (exercises: any[], trainerId: string) => {
  const matches = await lookupExercises(exercises, trainerId, { skipComplete: false, nameMode: 'equals' });
  return exercises.map(exercise => mergeExerciseData(exercise, matches.get(exercise)));
};

const enrichRoutines = async (routines: any[]) => {
  const matches = await lookupRoutineExercises(routines, { skipComplete: false, nameMode: 'equals' });
  return routines.map(routine => ({
    ...routine,
    exercises: Array.isArray(routine.exercises)
      ? routine.exercises.map((exercise: any) => mergeExerciseData(exercise, matches.get(exercise)))
      : routine.exercises
  }));
};

// Get dashboard data
export const getUnassignedWorkoutPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const unassignedPlans = await prisma.routine.findMany({
      where: {
        trainerId: user.id,
        clientId: {
          equals: ""
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        exercises: true
      }
    });

    res.status(200).json(unassignedPlans);
  } catch (error) {
    console.error("Error fetching unassigned workout plans:");
    res.status(500).json({ message: 'Internal server error while fetching unassigned workout plans' });
  }
};

// Actualizar información del cliente
export const updateClientInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { clientId } = req.params;
    const { name, email, phone, weight, height, age, gender, fitnessLevel, goals, initialObjective, trainingDaysPerWeek, medicalConditions, medications, injuries, membershipTier, nickname } = req.body;






    // Actualizar nombre y email en User si se proporcionaron
    if (name || email) {
      const userUpdateData: any = {};
      if (name) userUpdateData.name = name.trim();
      if (email) userUpdateData.email = email.trim().toLowerCase();
      await prisma.user.update({ where: { id: clientId }, data: userUpdateData });
    }

    // Verificar que el cliente está asociado al entrenador
    const trainerClientRelation = await prisma.trainerClient.findFirst({
      where: {
        trainerId: user.id,
        clientId: clientId
      }
    });

    if (!trainerClientRelation) {

      res.status(403).json({ message: 'No tienes acceso a este cliente.' });
      return;
    }

    // Preparar los datos para actualizar
    const updateData: any = {};
    
    if (phone !== undefined) updateData.phone = phone;
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (height !== undefined) updateData.height = parseFloat(height);
    if (age !== undefined) updateData.age = parseInt(age);
    if (gender !== undefined) updateData.gender = gender;
    if (fitnessLevel !== undefined) updateData.fitnessLevel = fitnessLevel;
    if (goals !== undefined) {
      // Convertir goals a array si es un string
      updateData.goals = Array.isArray(goals) ? goals : [goals];
    }
    if (initialObjective !== undefined) updateData.initialObjective = initialObjective;
    if (trainingDaysPerWeek !== undefined) updateData.trainingDaysPerWeek = parseInt(trainingDaysPerWeek);
    if (medicalConditions !== undefined) updateData.medicalConditions = medicalConditions;
    if (medications !== undefined) updateData.medications = medications;
    if (injuries !== undefined) updateData.injuries = injuries;
    if (membershipTier !== undefined) updateData.membershipTier = membershipTier || null;
    if (nickname !== undefined) updateData.nickname = nickname?.trim() || null;



    // Verificar si el cliente tiene un perfil, si no, crearlo
    let clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: clientId }
    });

    if (!clientProfile) {
      // Crear el perfil del cliente si no existe
      const clientUser = await prisma.user.findUnique({
        where: { id: clientId },
        select: { name: true }
      });

      clientProfile = await prisma.clientProfile.create({
        data: {
          userId: clientId,
          name: clientUser?.name || 'Cliente',
          ...updateData
        }
      });
    } else {
      // Actualizar el perfil existente
      clientProfile = await prisma.clientProfile.update({
        where: { userId: clientId },
        data: updateData
      });
    }



    // Obtener la información completa del cliente para la respuesta
    const updatedClient = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        clientProfile: {
          select: {
            phone: true,
            weight: true,
            height: true,
            age: true,
            gender: true,
            fitnessLevel: true,
            goals: true,
            initialObjective: true,
            trainingDaysPerWeek: true,
            medicalConditions: true,
            medications: true,
            injuries: true,
            membershipTier: true,
            nickname: true
          }
        }
      }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Información del cliente actualizada exitosamente',
      data: {
        id: updatedClient?.id,
        name: updatedClient?.name,
        email: updatedClient?.email,
        phone: updatedClient?.clientProfile?.phone,
        weight: updatedClient?.clientProfile?.weight,
        height: updatedClient?.clientProfile?.height,
        age: updatedClient?.clientProfile?.age,
        gender: updatedClient?.clientProfile?.gender,
        fitnessLevel: updatedClient?.clientProfile?.fitnessLevel,
        goals: updatedClient?.clientProfile?.goals,
        initialObjective: updatedClient?.clientProfile?.initialObjective,
        trainingDaysPerWeek: updatedClient?.clientProfile?.trainingDaysPerWeek,
        medicalConditions: updatedClient?.clientProfile?.medicalConditions,
        medications: updatedClient?.clientProfile?.medications,
        injuries: updatedClient?.clientProfile?.injuries
      }
    });
  } catch (error) {
    console.error("Error updating client info:");
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al actualizar la información del cliente' 
    });
  }
};

// Obtener asignaciones de rutinas por mes
export const getRoutineAssignments = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string };
    if (!user || !user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated or user ID missing'
      });
    }
    
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        status: 'error',
        message: 'Year and month are required'
      });
    }
    
    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);
    
    if (isNaN(yearNum) || isNaN(monthNum)) {
      return res.status(400).json({
        status: 'error',
        message: 'Year and month must be valid numbers'
      });
    }
    
    // Calcular el primer y último día del mes
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // El día 0 del siguiente mes es el último día del mes actual
    
    const assignments = await prisma.routineAssignment.findMany({
      where: {
        trainerId: user.id,
        OR: [
          {
            // Asignaciones que comienzan en el mes seleccionado
            startDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            // Asignaciones que terminan en el mes seleccionado
            endDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            // Asignaciones que abarcan todo el mes seleccionado
            AND: [
              {
                startDate: {
                  lt: startDate
                }
              },
              {
                endDate: {
                  gt: endDate
                }
              }
            ]
          }
        ]
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            clientProfile: true
          }
        },
        routine: true
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: assignments,
      message: 'Routine assignments retrieved successfully'
    });
  } catch (error) {
    console.error("Error getting routine assignments:");
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting routine assignments'
    });
  }
};

// Eliminar asignación de rutina
export const removeRoutineAssignment = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string };
    if (!user || !user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated or user ID missing'
      });
    }
    
    const { assignmentId, clientId, routineId } = req.params;
    
    let assignment;
    
    // Si tenemos clientId y routineId, buscar la asignación activa
    if (clientId && routineId) {
      assignment = await prisma.routineAssignment.findFirst({
        where: {
          clientId,
          routineId,
          trainerId: user.id
        },
        include: {
          client: true,
          routine: true
        }
      });
    } else if (assignmentId) {
      // Verificar que la asignación existe y pertenece al entrenador
      assignment = await prisma.routineAssignment.findFirst({
        where: {
          id: assignmentId,
          trainerId: user.id
        },
        include: {
          client: true,
          routine: true
        }
      });
    }
    
    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found or not owned by this trainer'
      });
    }
    
    // Eliminar la asignación
    await prisma.routineAssignment.delete({
      where: {
        id: assignment.id
      }
    });
    
    // Crear notificación para el cliente
    await prisma.notification.create({
      data: {
        userId: assignment.clientId,
        title: 'Rutina desasignada',
        message: `Tu entrenador ha eliminado la asignación de la rutina "${assignment.routine.name}".`,
        type: 'ROUTINE_UNASSIGNED',
        isRead: false
      }
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Routine assignment removed successfully'
    });
  } catch (error) {
    console.error("Error removing routine assignment:");
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while removing routine assignment'
    });
  }
};

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const currentTrainerId = user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [clientCount, routineCount, exerciseCount, sessionsToday, overdueCount, clients] = await Promise.all([
      prisma.user.count({
        where: {
          role: Role.CLIENT,
          assignedRoutines: { some: { trainerId: currentTrainerId } }
        }
      }),
      prisma.routine.count({
        where: { trainerId: currentTrainerId }
      }),
      prisma.exercise.count({
        where: { trainerId: currentTrainerId }
      }),
      prisma.appointment.count({
        where: {
          trainerId: currentTrainerId,
          startTime: { gte: todayStart, lte: todayEnd },
          status: { not: 'CANCELLED' }
        }
      }),
      Promise.resolve(0), // overdueCount: Payment model doesn't link to trainer directly
      prisma.user.findMany({
        where: {
          role: Role.CLIENT,
          trainersAsClient: { some: { trainerId: currentTrainerId } }
        },
        include: { clientProfile: { select: { weight: true } } }
      })
    ]);

    // Progreso promedio: porcentaje de clientes con peso registrado
    const clientsWithProfile = clients.filter(c => c.clientProfile?.weight);
    const averageProgress = clients.length > 0
      ? Math.round((clientsWithProfile.length / clients.length) * 100)
      : 0;

    res.status(200).json({
      clientCount,
      routineCount,
      exerciseCount,
      sessionsToday,
      overdueCount,
      averageProgress
    });
  } catch (error) {
    console.error("Error fetching dashboard data:");
    res.status(500).json({ message: 'Internal server error while fetching dashboard data' });
  }
};

// Exercise management
export const getExercises = async (req: Request, res: Response): Promise<void> => {
  try {



    const user = req.user;
    if (!user || !user.id) {

      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }


    if (user.role !== 'TRAINER') {

      res.status(403).json({ message: 'User is not authorized to access this route' });
      return;
    }


    const exercises = await prisma.exercise.findMany({
      where: { trainerId: user.id }
    });


    const response = {
      success: true,
      data: exercises
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching exercises:");
    res.status(500).json({ message: 'Internal server error while fetching exercises' });
  }
};

export const createExercise = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const exercise = await prisma.exercise.create({
      data: {
        ...req.body,
        trainerId: user.id
      }
    });

    res.status(201).json(exercise);
  } catch (error) {
    console.error("Error creating exercise:");
    res.status(500).json({ message: 'Internal server error while creating exercise' });
  }
};

export const updateExercise = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { id } = req.params;
    const exercise = await prisma.exercise.update({
      where: { id, trainerId: user.id },
      data: req.body
    });

    res.status(200).json(exercise);
  } catch (error) {
    console.error("Error updating exercise:");
    res.status(500).json({ message: 'Internal server error while updating exercise' });
  }
};

export const updateRoutine = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { id } = req.params;
    const { name, clientId, duration, notes, exercises } = req.body;
    const routine = await prisma.routine.update({
      where: { id, trainerId: user.id },
      data: { name, clientId, duration, notes, exercises },
      include: { client: true }
    });

    res.status(200).json(routine);
  } catch (error) {
    console.error("Error updating routine:");
    res.status(500).json({ message: 'Internal server error while updating routine' });
  }
};

export const deleteRoutine = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { id } = req.params;
    await prisma.routine.delete({
      where: { id, trainerId: user.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting routine:");
    res.status(500).json({ message: 'Internal server error while deleting routine' });
  }
};

export const deleteExercise = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { id } = req.params;
    await prisma.exercise.delete({
      where: { id, trainerId: user.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting exercise:");
    res.status(500).json({ message: 'Internal server error while deleting exercise' });
  }
};

// Routine management
export const getRoutines = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const routines = await prisma.routine.findMany({
      where: { trainerId: user.id },
      include: { client: true }
    });

    // Enriquecer ejercicios con datos completos
    const enrichedRoutines = await enrichRoutines(routines);

    res.status(200).json(enrichedRoutines);
  } catch (error) {
    console.error("Error fetching routines:");
    res.status(500).json({ message: 'Internal server error while fetching routines' });
  }
};

export const getRoutineById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { id } = req.params;
    const routine = await prisma.routine.findFirst({
      where: { 
        id: id,
        trainerId: user.id 
      },
      include: { 
        client: true
      }
    });

    if (!routine) {
      res.status(404).json({ message: 'Routine not found' });
      return;
    }

    // Enriquecer ejercicios con datos completos
    const enrichedRoutine = {
      ...routine,
      exercises: await enrichExercises(routine.exercises as any[], user.id)
    };

    res.status(200).json({ data: enrichedRoutine });
  } catch (error) {
    console.error("Error fetching routine by ID:");
    res.status(500).json({ message: 'Internal server error while fetching routine' });
  }
};

// Nutrition plans
export const getNutritionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const nutritionPlans = await prisma.nutritionPlan.findMany({
      where: { trainerId: user.id },
      include: { client: true }
    });

    res.status(200).json(nutritionPlans);
  } catch (error) {
    console.error("Error fetching nutrition plans:");
    res.status(500).json({ message: 'Internal server error while fetching nutrition plans' });
  }
};

export const createNutritionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const nutritionPlan = await prisma.nutritionPlan.create({
      data: {
        ...req.body,
        trainerId: user.id
      }
    });

    res.status(201).json(nutritionPlan);
  } catch (error) {
    console.error("Error creating nutrition plan:");
    res.status(500).json({ message: 'Internal server error while creating nutrition plan' });
  }
};

export const updateNutritionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { id } = req.params;
    const nutritionPlan = await prisma.nutritionPlan.update({
      where: { id, trainerId: user.id },
      data: req.body
    });

    res.status(200).json(nutritionPlan);
  } catch (error) {
    console.error("Error updating nutrition plan:");
    res.status(500).json({ message: 'Internal server error while updating nutrition plan' });
  }
};

export const deleteNutritionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { id } = req.params;
    await prisma.nutritionPlan.delete({
      where: { id, trainerId: user.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting nutrition plan:");
    res.status(500).json({ message: 'Internal server error while deleting nutrition plan' });
  }
};

// Profile management
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: { trainerProfile: true }
    });

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching profile:");
    res.status(500).json({ message: 'Internal server error while fetching profile' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: req.body,
      include: { trainerProfile: true }
    });

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error updating profile:");
    res.status(500).json({ message: 'Internal server error while updating profile' });
  }
};

// Analytics
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { period } = req.query;
    const currentDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(currentDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(currentDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(currentDate.getMonth() - 1); // Default to last month
    }

    const analytics = await prisma.$transaction([
      prisma.routine.count({
        where: {
          trainerId: user.id,
          createdAt: { gte: startDate }
        }
      }),
      prisma.user.count({
        where: {
          role: Role.CLIENT,
          assignedRoutines: {
            some: {
              trainerId: user.id,
              createdAt: { gte: startDate }
            }
          }
        }
      }),
      prisma.progress.count({
        where: {
          routine: {
            trainerId: user.id
          },
          date: { gte: startDate }
        }
      })
    ]);

    res.status(200).json({
      routinesCreated: analytics[0],
      newClients: analytics[1],
      progressUpdates: analytics[2]
    });
  } catch (error) {
    console.error("Error fetching analytics:");
    res.status(500).json({ message: 'Internal server error while fetching analytics' });
  }
};

// Charts data: real monthly data for dashboard charts
export const getChartsData = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user?.id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const trainerId = user.id;
    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date();

    // Últimos 6 meses
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { label: MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
    });

    // Progreso (entrenamientos completados) por mes
    const progressByMonth = await Promise.all(months.map(m =>
      prisma.progress.count({
        where: {
          routine: { trainerId },
          date: {
            gte: new Date(m.year, m.month, 1),
            lt: new Date(m.year, m.month + 1, 1)
          }
        }
      })
    ));

    // Nuevos clientes por mes (via TrainerClient)
    const newClientsByMonth = await Promise.all(months.map(m =>
      prisma.trainerClient.count({
        where: {
          trainerId,
          createdAt: {
            gte: new Date(m.year, m.month, 1),
            lt: new Date(m.year, m.month + 1, 1)
          }
        }
      })
    ));

    // Peso actual de cada cliente
    const clients = await prisma.user.findMany({
      where: {
        role: Role.CLIENT,
        trainersAsClient: { some: { trainerId } }
      },
      include: { clientProfile: { select: { weight: true } } }
    });

    const weightData = clients
      .filter(c => c.clientProfile?.weight)
      .map(c => ({
        name: c.name?.split(' ')[0] || c.email?.split('@')[0] || 'Cliente',
        peso: c.clientProfile!.weight
      }));

    const trainingsData = months.map((m, i) => ({
      month: m.label,
      entrenamientos: progressByMonth[i]
    }));

    const clientsData = months.map((m, i) => ({
      month: m.label,
      nuevos: newClientsByMonth[i]
    }));

    res.status(200).json({ weightData, trainingsData, clientsData });
  } catch (error) {
    console.error("Error fetching charts data:");
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all clients assigned to a trainer
export const getTrainerClients = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  if (!user || !user.id) {
    res.status(401).json({ message: 'User not authenticated or user ID missing' });
    return;
  }

  const currentTrainerId = user.id;

  try {
    const clients = await prisma.user.findMany({
      where: {
        role: Role.CLIENT,
        trainersAsClient: {
          some: {
            trainerId: currentTrainerId
          }
        }
      },
      include: {
        clientProfile: true,
        assignedRoutines: {
          where: {
            trainerId: currentTrainerId
          }
        },
        assignedNutritionPlans: {
          where: {
            trainerId: currentTrainerId
          }
        }
      }
    });

    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching trainer clients:");
    res.status(500).json({ message: 'Internal server error while fetching trainer clients' });
  }
};

// Create a routine for a client
export const createClientRoutine = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { clientId, name, description, exercises } = req.body as {
      clientId: string;
      name: string;
      description?: string;
      exercises?: Prisma.JsonValue;
    };

    if (!clientId || !name) {
      res.status(400).json({
        status: 'error',
        message: 'Client ID and routine name are required'
      });
      return;
    }

    // Verificar que el cliente existe y está asociado al entrenador
    const trainerClientRelation = await prisma.trainerClient.findFirst({
      where: {
        trainerId: user.id,
        clientId: clientId
      },
      include: {
        client: true
      }
    });
    
    if (!trainerClientRelation) {
      res.status(404).json({
        status: 'error',
        message: 'Client not found or not assigned to this trainer'
      });
      return;
    }
    
    const routine = await prisma.routine.create({
      data: {
        name,
        description,
        client: { connect: { id: clientId } },
        trainer: { connect: { id: user.id } },
        exercises: exercises as Prisma.InputJsonValue
      },
      include: {
        client: true,
        trainer: true
      }
    });
    
    // Crear notificación en el dashboard del cliente
    await prisma.notification.create({
      data: {
        userId: clientId,
        title: '¡Nueva rutina asignada!',
        message: `Tu entrenador te ha asignado una nueva rutina: "${name}". Revísala en tu dashboard y comienza tu entrenamiento.`,
        type: 'ROUTINE_ASSIGNED',
        isRead: false,
        routineId: routine.id
      }
    });
    
    // Enviar notificación por email al cliente (no bloquea si falla)
    try {
      await EmailService.sendRoutineAssignmentEmail({
        clientName: trainerClientRelation.client.name || 'Cliente',
        clientEmail: trainerClientRelation.client.email,
        routineName: name,
        trainerName: user.name !== null ? user.name : 'Tu entrenador',
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/dashboard`,
        routineUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/${clientId}/routine/${routine.id}`
      });
    } catch (emailError) {
      console.warn("⚠️ Email no enviado (configuración pendiente):");
    }
    
    res.status(201).json({
      status: 'success',
      data: { routine },
      message: 'Rutina creada y notificaciones enviadas exitosamente'
    });
  } catch (error) {
    console.error("Error creating client routine:");
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid data provided for routine creation'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error while creating client routine'
      });
    }
  }
};

// Asignar rutina existente a cliente

export const assignRoutineToClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { clientId, routineId, startDate, endDate } = req.body as {
      clientId: string;
      routineId: string;
      startDate: string;
      endDate: string;
    };

    if (!clientId || !routineId) {
      res.status(400).json({
        status: 'error',
        message: 'Client ID and routine ID are required'
      });
      return;
    }

    // Verificar que el cliente existe y está asociado al entrenador
    const trainerClientRelation = await prisma.trainerClient.findFirst({
      where: {
        trainerId: user.id,
        clientId: clientId
      },
      include: {
        client: true
      }
    });
    
    if (!trainerClientRelation) {
      res.status(404).json({
        status: 'error',
        message: 'Client not found or not assigned to this trainer'
      });
      return;
    }

    // Verificar que la rutina existe y pertenece al entrenador
    const routine = await prisma.routine.findFirst({
      where: {
        id: routineId,
        trainerId: user.id
      }
    });

    if (!routine) {
      res.status(404).json({
        status: 'error',
        message: 'Routine not found or not owned by this trainer'
      });
      return;
    }

    // Crear asignación de rutina
    const assignment = await prisma.routineAssignment.create({
      data: {
        clientId,
        routineId,
        trainerId: user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        assignedDate: new Date()
      },
      include: {
        client: true,
        routine: true,
        trainer: true
      }
    });

    // Crear notificación en el dashboard del cliente
    await prisma.notification.create({
      data: {
        userId: clientId,
        title: '¡Nueva rutina asignada!',
        message: `Tu entrenador te ha asignado la rutina "${routine.name}". Revísala en tu dashboard y comienza tu entrenamiento.`,
        type: 'ROUTINE_ASSIGNED',
        isRead: false,
        routineId: routineId
      }
    });

    // Notificar al entrenador que ha asignado una rutina
    await NotificationService.notifyRoutineAssigned(
      user.id, 
      trainerClientRelation.client.name || 'Cliente', 
      routine.name, 
      routineId
    );

    // Enviar notificación por email al cliente (no bloquea si falla)
    try {
      await EmailService.sendRoutineAssignmentEmail({
        clientName: trainerClientRelation.client.name || 'Cliente',
        clientEmail: trainerClientRelation.client.email,
        routineName: routine.name,
        trainerName: user.name !== null ? user.name : 'Tu entrenador',
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/dashboard`,
        routineUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/${clientId}/routine/${routineId}`,
        startDate,
        endDate
      });
    } catch (emailError) {
      console.warn("⚠️ Email no enviado (configuración pendiente):");
    }

    res.status(201).json({
      status: 'success',
      data: { assignment },
      message: 'Rutina asignada y notificaciones enviadas exitosamente'
    });
  } catch (error) {
    console.error("Error assigning routine:");
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid data provided for routine assignment'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error while assigning routine'
      });
    }
  }
};

// Obtener notificaciones del cliente
export const getClientNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limitar a las últimas 20 notificaciones
    });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error: any) {
    console.error("Error al obtener notificaciones:");
    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const { notificationId } = req.params;

    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: req.user.id // Asegurar que la notificación pertenece al usuario
      },
      data: { isRead: true }
    });

    res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error: any) {
    console.error("Error al marcar notificación como leída:");
    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }
};

// Get client progress
export const getClientProgressByTrainer = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.id) {
        return res.status(401).json({ message: 'User not authenticated or user ID missing' });
    }

    const currentTrainerId = user.id;
    const { clientId } = req.params as { clientId: string };

    // Verificar que el cliente está asociado al entrenador
    const trainerClientRelation = await prisma.trainerClient.findFirst({
      where: {
        trainerId: currentTrainerId,
        clientId: clientId
      }
    });
    
    if (!trainerClientRelation) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found or not assigned to this trainer'
      });
    }
    
    // Obtener progreso del cliente
    const progress = await prisma.progress.findMany({
      where: {
        userId: clientId
      },
      orderBy: {
        date: 'desc'
      },
      include: {
        routine: true
      }
    });
    
    // Obtener rutinas asignadas al cliente
    const routines = await prisma.routine.findMany({
      where: {
        clientId: clientId,
        trainerId: currentTrainerId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Enrich routines with complete exercise data
    const enrichedRoutines = await enrichRoutines(routines);
    
    // Mapear rutinas al formato esperado por el frontend
    const formattedRoutines = enrichedRoutines.map(routine => ({
      id: routine.id,
      name: routine.name,
      description: routine.description || '',
      assignedDate: routine.createdAt.toISOString(),
      status: 'active', // Por defecto, podrías agregar lógica para determinar el estado
      progress: 0, // Podrías calcular el progreso basado en los registros de progreso
      exercises: routine.exercises || []
    }));
    
    const responseData = {
      status: 'success',
      data: {
        progress,
        routines: formattedRoutines,
        paymentStatus: null // Por ahora null, podrías implementar lógica de pagos después
      }
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching client progress:");
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch progress data'
    });
  }
};

// Get all workout plans for trainer
export const getAllWorkoutPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const workoutPlans = await prisma.routine.findMany({
      where: {
        trainerId: user.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        exercises: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json(workoutPlans);
  } catch (error) {
    console.error("Error fetching workout plans:");
    res.status(500).json({ message: 'Internal server error while fetching workout plans' });
  }
};

// Create workout plan
export const createWorkoutPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { name, description, exercises, targetGroup } = req.body;

    const workoutPlan = await prisma.routine.create({
      data: {
        name,
        description,
        exercises: exercises || [],
        trainerId: user.id,
        clientId: "" // Empty string for unassigned plans
      },
      select: {
        id: true,
        name: true,
        description: true,
        exercises: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json(workoutPlan);
  } catch (error) {
    console.error("Error creating workout plan:");
    res.status(500).json({ message: 'Internal server error while creating workout plan' });
  }
};

// Delete workout plan
export const deleteWorkoutPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { id } = req.params;
    
    await prisma.routine.delete({
      where: {
        id,
        trainerId: user.id
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting workout plan:");
    res.status(500).json({ message: 'Internal server error while deleting workout plan' });
  }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    await NotificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error: any) {
    console.error("Error al marcar todas las notificaciones como leídas:");
    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }
};

// Obtener notificaciones no leídas
export const getUnreadNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const notifications = await NotificationService.getUnreadNotifications(req.user.id);

    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error: any) {
    console.error("Error al obtener notificaciones no leídas:");
    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }
};

// Crear notificación de prueba (para testing)
export const createTestNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const { type = 'system', title, message } = req.body;

    const notification = await NotificationService.createNotification({
      userId: req.user.id,
      title: title || 'Notificación de prueba',
      message: message || 'Esta es una notificación de prueba del sistema',
      type
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notificación de prueba creada'
    });
  } catch (error: any) {
    console.error("Error al crear notificación de prueba:");
    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }
};

// Eliminar rutina directa del cliente
export const removeClientRoutine = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { clientId, routineId } = req.params;






    // Verificar que el cliente está asociado al entrenador
    const trainerClientRelation = await prisma.trainerClient.findFirst({
      where: {
        trainerId: user.id,
        clientId: clientId
      }
    });

    if (!trainerClientRelation) {

      res.status(403).json({ message: 'No tienes acceso a este cliente.' });
      return;
    }

    // Verificar que la rutina existe - primero buscar por ID
    const routine = await prisma.routine.findUnique({
      where: {
        id: routineId
      }
    });

    if (!routine) {

      res.status(404).json({ message: 'Rutina no encontrada.' });
      return;
    }

    // Verificar que el entrenador actual tiene acceso a esta rutina a través de la asignación
    const routineAssignment = await prisma.routineAssignment.findFirst({
      where: {
        routineId: routineId,
        clientId: clientId,
        trainerId: user.id
      }
    });

    // Si no hay asignación directa, verificar si la rutina pertenece al entrenador
    const hasAccess = routineAssignment || routine.trainerId === user.id;
    
    if (!hasAccess) {

      res.status(403).json({ message: 'No tienes acceso a esta rutina.' });
      return;
    }



    // Eliminar la rutina
    await prisma.routine.delete({
      where: { id: routineId }
    });



    res.status(200).json({ 
      success: true, 
      message: 'Rutina eliminada exitosamente' 
    });
  } catch (error) {
    console.error("Error removing client routine:");
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al eliminar la rutina' 
    });
  }
};

// Reenviar email de rutina asignada
export const resendRoutineEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      res.status(401).json({ message: 'User not authenticated or user ID missing' });
      return;
    }

    const { clientId, routineId } = req.params;






    // Verificar que el cliente está asociado al entrenador
    const trainerClientRelation = await prisma.trainerClient.findFirst({
      where: {
        trainerId: user.id,
        clientId: clientId
      },
      include: {
        client: true
      }
    });

    if (!trainerClientRelation) {

      res.status(403).json({ message: 'No tienes acceso a este cliente.' });
      return;
    }

    // Verificar que la rutina existe - primero buscar por ID
    const routine = await prisma.routine.findUnique({
      where: {
        id: routineId
      }
    });

    if (!routine) {

      res.status(404).json({ message: 'Rutina no encontrada.' });
      return;
    }

    // Verificar que el entrenador actual tiene acceso a esta rutina a través de la asignación
    const routineAssignment = await prisma.routineAssignment.findFirst({
      where: {
        routineId: routineId,
        clientId: clientId,
        trainerId: user.id
      }
    });

    // Si no hay asignación directa, verificar si la rutina pertenece al entrenador
    const hasAccess = routineAssignment || routine.trainerId === user.id;
    
    if (!hasAccess) {

      res.status(403).json({ message: 'No tienes acceso a esta rutina.' });
      return;
    }



    // Buscar la asignación de rutina para obtener las fechas
    let finalRoutineAssignment = routineAssignment;
    if (!finalRoutineAssignment) {
      finalRoutineAssignment = await prisma.routineAssignment.findFirst({
        where: {
          clientId: clientId,
          routineId: routineId
        }
      });
    }

    // Si no hay asignación, usar fechas por defecto
    const startDate = finalRoutineAssignment?.startDate?.toISOString() || new Date().toISOString();
    const endDate = finalRoutineAssignment?.endDate?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 días desde hoy

    // Reenviar email de notificación al cliente (timeout de 15s para no bloquear)
    let emailSent = false;
    let emailTimeout: NodeJS.Timeout | undefined;
    try {
      emailSent = await Promise.race<boolean>([
        EmailService.sendRoutineAssignmentEmail({
          clientName: trainerClientRelation.client.name || 'Cliente',
          clientEmail: trainerClientRelation.client.email,
          routineName: routine.name,
          trainerName: user.name !== null ? user.name : 'Tu entrenador',
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/dashboard`,
          routineUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/${clientId}/routine/${routineId}`,
          startDate,
          endDate
        }),
        new Promise<boolean>((_, reject) => {
          emailTimeout = setTimeout(() => reject(new Error('Email timeout')), 15000);
        })
      ]);
    } catch (emailError) {
      console.warn('Email delivery failed: timeout');
    } finally {
      if (emailTimeout) clearTimeout(emailTimeout);
    }

    if (!emailSent) {
      res.status(502).json({
        success: false,
        message: 'No se pudo enviar el email. Revisá la configuración de correo e intentá nuevamente.'
      });
      return;
    }

    // Crear notificación de reenvío exitoso
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: '📧 Email reenviado',
        message: `Email de la rutina "${routine.name}" reenviado exitosamente a ${trainerClientRelation.client.name || 'el cliente'}.`,
        type: 'EMAIL_SENT',
        isRead: false
      }
    });



    res.status(200).json({ 
      success: true, 
      message: `Email de la rutina "${routine.name}" reenviado exitosamente a ${trainerClientRelation.client.email}` 
    });
  } catch (error) {
    console.error("Error resending routine email:");
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al reenviar el email' 
    });
  }
};
