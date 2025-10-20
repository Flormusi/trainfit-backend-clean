/**
 * Controlador mejorado para la gestión de entrenadores
 * Implementa las recomendaciones de estructura de respuesta, validación,
 * manejo de errores y logging.
 */

import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../types/express';
import { PrismaClient, Role, Prisma } from '@prisma/client';
import { NotificationService } from '../services/notificationService';
import { success, error, createError } from '../utils/responseHandler';
import { logger } from '../utils/logger';

import prisma from '../utils/prisma';
// No necesitamos crear una nueva instancia de PrismaClient ya que la importamos desde utils/prisma

/**
 * @desc    Obtener datos del dashboard
 * @route   GET /api/trainer/dashboard
 * @access  Private/Trainer
 */
export const getDashboardData = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user?.id) {
      return next(createError('Usuario no autenticado', 401));
    }

    const currentTrainerId = user.id;

    logger.info('Obteniendo datos del dashboard', { userId: currentTrainerId });

    const [clientCount, routineCount, exerciseCount] = await Promise.all([
      prisma.user.count({
        where: {
          role: Role.CLIENT,
          routineAssignmentsAsClient: { some: { trainerId: currentTrainerId } }
        }
      }),
      prisma.routine.count({
        where: { trainerId: currentTrainerId }
      }),
      prisma.exercise.count({
        where: { trainerId: currentTrainerId }
      })
    ]);

    // Usar el formato de respuesta estandarizado
    return success(res, 200, {
      clientCount,
      routineCount,
      exerciseCount
    }, 'Datos del dashboard obtenidos correctamente');
  } catch (err) {
    logger.error('Error al obtener datos del dashboard', { error: err });
    return next(err);
  }
};

/**
 * @desc    Obtener ejercicios del entrenador
 * @route   GET /api/trainer/exercises
 * @access  Private/Trainer
 */
export const getExercises = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user?.id) {
      return next(createError('Usuario no autenticado', 401));
    }

    if (user.role !== 'TRAINER') {
      return next(createError('No autorizado para acceder a esta ruta', 403));
    }

    logger.info('Obteniendo ejercicios', { userId: user.id });

    // Implementar paginación
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Implementar filtrado
    const filter: any = { trainerId: user.id };
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.difficulty) {
      filter.difficulty = req.query.difficulty;
    }
    
    // Filtrado por objetivos
    if (req.query.objective) {
      const objective = req.query.objective as string;
      
      // Mapeo de objetivos a categorías de ejercicios
      const objectiveMapping: { [key: string]: string[] } = {
        'fuerza': ['fuerza', 'potencia'],
        'hipertrofia': ['hipertrofia', 'fuerza'],
        'fuerza-resistencia': ['fuerza-resistencia', 'resistencia'],
        'resistencia-cardio': ['resistencia-cardio', 'cardio'],
        'potencia': ['potencia', 'fuerza'],
        'quema-grasa': ['quema-grasa', 'cardio'],
        'estetica-salud': ['estetica-salud', 'hipertrofia'],
        'movilidad': ['movilidad']
      };
      
      const objectives = objectiveMapping[objective] || [objective];
      filter.objectives = {
        hasSome: objectives
      };
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where: filter,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.exercise.count({ where: filter })
    ]);

    // Usar el formato de respuesta estandarizado
    return success(res, 200, {
      exercises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Ejercicios obtenidos correctamente');
  } catch (err) {
    logger.error('Error al obtener ejercicios', { error: err });
    return next(err);
  }
};

/**
 * @desc    Crear un nuevo ejercicio
 * @route   POST /api/trainer/exercises
 * @access  Private/Trainer
 */
export const createExercise = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user?.id) {
      return next(createError('Usuario no autenticado', 401));
    }

    logger.info('Creando nuevo ejercicio', { userId: user.id });

    const exercise = await prisma.exercise.create({
      data: {
        ...req.body,
        trainerId: user.id
      }
    });

    // Usar el formato de respuesta estandarizado
    return success(res, 201, exercise, 'Ejercicio creado correctamente');
  } catch (err) {
    // Manejar errores específicos
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return next(createError('Ya existe un ejercicio con ese nombre', 409));
      }
    }
    
    logger.error('Error al crear ejercicio', { error: err });
    return next(err);
  }
};

/**
 * @desc    Obtener clientes del entrenador
 * @route   GET /api/trainer/clients
 * @access  Private/Trainer
 */
export const getTrainerClients = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user?.id) {
      return next(createError('Usuario no autenticado', 401));
    }

    const currentTrainerId = user.id;

    logger.info('Obteniendo clientes del entrenador', { userId: currentTrainerId });

    // Implementar paginación
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Implementar búsqueda
    const search = req.query.search as string;
    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
          ]
        }
      : {};

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: Role.CLIENT,
          trainersAsClient: {
            some: {
              trainerId: currentTrainerId
            }
          },
          ...searchFilter
        },
        select: {
          id: true,
          name: true,
          email: true,
          // phone: true, // Comentado porque no existe en el tipo UserSelect
          createdAt: true,
          clientProfile: {
            select: {
              goals: true,
              weight: true,
              initialObjective: true,
              trainingDaysPerWeek: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.user.count({
        where: {
          role: Role.CLIENT,
          trainersAsClient: {
            some: {
              trainerId: currentTrainerId
            }
          },
          ...searchFilter
        }
      })
    ]);

    // Usar el formato de respuesta estandarizado
    return success(res, 200, {
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Clientes obtenidos correctamente');
  } catch (err) {
    logger.error('Error al obtener clientes', { error: err });
    return next(err);
  }
};

/**
 * @desc    Obtener datos de analíticas
 * @route   GET /api/trainer/analytics
 * @access  Private/Trainer
 */
export const getAnalytics = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = req.user;
    if (!user?.id) {
      return next(createError('Usuario no autenticado', 401));
    }

    const period = req.query.period as string || 'week';
    let startDate = new Date();
    
    // Calcular la fecha de inicio según el período
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Por defecto, una semana
    }

    logger.info('Obteniendo analíticas', { userId: user.id, period, startDate });

    const [routinesCreated, newClients, progressUpdates] = await Promise.all([
      prisma.routine.count({
        where: {
          trainerId: user.id,
          createdAt: { gte: startDate }
        }
      }),
      prisma.user.count({
        where: {
          role: Role.CLIENT,
          trainersAsClient: {
            some: {
              trainerId: user.id
            }
          },
          createdAt: { gte: startDate }
        }
      }),
      prisma.progress.count({
        where: {
          routine: {
            trainerId: user.id
          },
          createdAt: { gte: startDate }
        }
      })
    ]);

    // Usar el formato de respuesta estandarizado
    return success(res, 200, {
      routinesCreated,
      newClients,
      progressUpdates,
      period
    }, 'Datos de analíticas obtenidos correctamente');
  } catch (err) {
    logger.error('Error al obtener analíticas', { error: err });
    return next(err);
  }
};