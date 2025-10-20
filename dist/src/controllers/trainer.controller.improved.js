"use strict";
/**
 * Controlador mejorado para la gestión de entrenadores
 * Implementa las recomendaciones de estructura de respuesta, validación,
 * manejo de errores y logging.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.getTrainerClients = exports.createExercise = exports.getExercises = exports.getDashboardData = void 0;
const client_1 = require("@prisma/client");
const responseHandler_1 = require("../utils/responseHandler");
const logger_1 = require("../utils/logger");
const prisma_1 = __importDefault(require("../utils/prisma"));
// No necesitamos crear una nueva instancia de PrismaClient ya que la importamos desde utils/prisma
/**
 * @desc    Obtener datos del dashboard
 * @route   GET /api/trainer/dashboard
 * @access  Private/Trainer
 */
const getDashboardData = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user?.id) {
            return next((0, responseHandler_1.createError)('Usuario no autenticado', 401));
        }
        const currentTrainerId = user.id;
        logger_1.logger.info('Obteniendo datos del dashboard', { userId: currentTrainerId });
        const [clientCount, routineCount, exerciseCount] = await Promise.all([
            prisma_1.default.user.count({
                where: {
                    role: client_1.Role.CLIENT,
                    assignedRoutines: { some: { trainerId: currentTrainerId } }
                }
            }),
            prisma_1.default.routine.count({
                where: { trainerId: currentTrainerId }
            }),
            prisma_1.default.exercise.count({
                where: { trainerId: currentTrainerId }
            })
        ]);
        // Usar el formato de respuesta estandarizado
        return (0, responseHandler_1.success)(res, 200, {
            clientCount,
            routineCount,
            exerciseCount
        }, 'Datos del dashboard obtenidos correctamente');
    }
    catch (err) {
        logger_1.logger.error('Error al obtener datos del dashboard', { error: err });
        return next(err);
    }
};
exports.getDashboardData = getDashboardData;
/**
 * @desc    Obtener ejercicios del entrenador
 * @route   GET /api/trainer/exercises
 * @access  Private/Trainer
 */
const getExercises = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user?.id) {
            return next((0, responseHandler_1.createError)('Usuario no autenticado', 401));
        }
        if (user.role !== 'TRAINER') {
            return next((0, responseHandler_1.createError)('No autorizado para acceder a esta ruta', 403));
        }
        logger_1.logger.info('Obteniendo ejercicios', { userId: user.id });
        // Implementar paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Implementar filtrado
        const filter = { trainerId: user.id };
        if (req.query.type) {
            filter.type = req.query.type;
        }
        if (req.query.difficulty) {
            filter.difficulty = req.query.difficulty;
        }
        // Filtrado por objetivos
        if (req.query.objective) {
            const objective = req.query.objective;
            // Mapeo de objetivos a categorías de ejercicios
            const objectiveMapping = {
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
            prisma_1.default.exercise.findMany({
                where: filter,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.exercise.count({ where: filter })
        ]);
        // Usar el formato de respuesta estandarizado
        return (0, responseHandler_1.success)(res, 200, {
            exercises,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }, 'Ejercicios obtenidos correctamente');
    }
    catch (err) {
        logger_1.logger.error('Error al obtener ejercicios', { error: err });
        return next(err);
    }
};
exports.getExercises = getExercises;
/**
 * @desc    Crear un nuevo ejercicio
 * @route   POST /api/trainer/exercises
 * @access  Private/Trainer
 */
const createExercise = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user?.id) {
            return next((0, responseHandler_1.createError)('Usuario no autenticado', 401));
        }
        logger_1.logger.info('Creando nuevo ejercicio', { userId: user.id });
        const exercise = await prisma_1.default.exercise.create({
            data: {
                ...req.body,
                trainerId: user.id
            }
        });
        // Usar el formato de respuesta estandarizado
        return (0, responseHandler_1.success)(res, 201, exercise, 'Ejercicio creado correctamente');
    }
    catch (err) {
        // Manejar errores específicos
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {
                return next((0, responseHandler_1.createError)('Ya existe un ejercicio con ese nombre', 409));
            }
        }
        logger_1.logger.error('Error al crear ejercicio', { error: err });
        return next(err);
    }
};
exports.createExercise = createExercise;
/**
 * @desc    Obtener clientes del entrenador
 * @route   GET /api/trainer/clients
 * @access  Private/Trainer
 */
const getTrainerClients = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user?.id) {
            return next((0, responseHandler_1.createError)('Usuario no autenticado', 401));
        }
        const currentTrainerId = user.id;
        logger_1.logger.info('Obteniendo clientes del entrenador', { userId: currentTrainerId });
        // Implementar paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Implementar búsqueda
        const search = req.query.search;
        const searchFilter = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            }
            : {};
        const [clients, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where: {
                    role: client_1.Role.CLIENT,
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
            prisma_1.default.user.count({
                where: {
                    role: client_1.Role.CLIENT,
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
        return (0, responseHandler_1.success)(res, 200, {
            clients,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }, 'Clientes obtenidos correctamente');
    }
    catch (err) {
        logger_1.logger.error('Error al obtener clientes', { error: err });
        return next(err);
    }
};
exports.getTrainerClients = getTrainerClients;
/**
 * @desc    Obtener datos de analíticas
 * @route   GET /api/trainer/analytics
 * @access  Private/Trainer
 */
const getAnalytics = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user?.id) {
            return next((0, responseHandler_1.createError)('Usuario no autenticado', 401));
        }
        const period = req.query.period || 'week';
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
        logger_1.logger.info('Obteniendo analíticas', { userId: user.id, period, startDate });
        const [routinesCreated, newClients, progressUpdates] = await Promise.all([
            prisma_1.default.routine.count({
                where: {
                    trainerId: user.id,
                    createdAt: { gte: startDate }
                }
            }),
            prisma_1.default.user.count({
                where: {
                    role: client_1.Role.CLIENT,
                    trainersAsClient: {
                        some: {
                            trainerId: user.id
                        }
                    },
                    createdAt: { gte: startDate }
                }
            }),
            prisma_1.default.progress.count({
                where: {
                    routine: {
                        trainerId: user.id
                    },
                    createdAt: { gte: startDate }
                }
            })
        ]);
        // Usar el formato de respuesta estandarizado
        return (0, responseHandler_1.success)(res, 200, {
            routinesCreated,
            newClients,
            progressUpdates,
            period
        }, 'Datos de analíticas obtenidos correctamente');
    }
    catch (err) {
        logger_1.logger.error('Error al obtener analíticas', { error: err });
        return next(err);
    }
};
exports.getAnalytics = getAnalytics;
