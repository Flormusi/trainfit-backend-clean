"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoutineTemplate = exports.duplicateRoutineTemplate = exports.deleteRoutineTemplate = exports.updateRoutineTemplate = exports.createRoutineTemplate = exports.getRoutineTemplateById = exports.getRoutineTemplates = void 0;
const client_1 = require("@prisma/client");
const exerciseSelectionService_1 = require("../services/exerciseSelectionService");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
// Obtener todas las plantillas con filtros opcionales
const getRoutineTemplates = async (req, res) => {
    try {
        const { trainingObjective, level, daysPerWeek, gender } = req.query;
        const filters = {
            isActive: true
        };
        if (trainingObjective) {
            filters.trainingObjective = trainingObjective;
        }
        if (level) {
            filters.level = level;
        }
        if (daysPerWeek) {
            filters.daysPerWeek = parseInt(daysPerWeek);
        }
        if (gender && gender !== 'unisex') {
            filters.OR = [
                { gender: gender },
                { gender: 'unisex' },
                { gender: null }
            ];
        }
        const templates = await prisma.routineTemplate.findMany({
            where: filters,
            include: {
                creator: {
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
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('Error fetching routine templates:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las plantillas de rutinas'
        });
    }
};
exports.getRoutineTemplates = getRoutineTemplates;
// Obtener una plantilla específica por ID
const getRoutineTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await prisma.routineTemplate.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }
        res.json({
            success: true,
            data: template
        });
    }
    catch (error) {
        console.error('Error fetching routine template:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la plantilla'
        });
    }
};
exports.getRoutineTemplateById = getRoutineTemplateById;
// Crear una nueva plantilla
const createRoutineTemplate = async (req, res) => {
    try {
        const { name, description, trainingObjective, level, daysPerWeek, gender, duration, exercises, notes } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        const template = await prisma.routineTemplate.create({
            data: {
                name,
                description,
                trainingObjective,
                level,
                daysPerWeek: parseInt(daysPerWeek),
                gender,
                duration,
                exercises,
                notes,
                createdBy: userId
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: template,
            message: 'Plantilla creada exitosamente'
        });
    }
    catch (error) {
        console.error('Error creating routine template:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la plantilla'
        });
    }
};
exports.createRoutineTemplate = createRoutineTemplate;
// Actualizar una plantilla existente
const updateRoutineTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, trainingObjective, level, daysPerWeek, gender, duration, exercises, notes, isActive } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        // Verificar que la plantilla existe y pertenece al usuario
        const existingTemplate = await prisma.routineTemplate.findUnique({
            where: { id }
        });
        if (!existingTemplate) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }
        if (existingTemplate.createdBy !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para modificar esta plantilla'
            });
        }
        const updatedTemplate = await prisma.routineTemplate.update({
            where: { id },
            data: {
                name,
                description,
                trainingObjective,
                level,
                daysPerWeek: daysPerWeek ? parseInt(daysPerWeek) : undefined,
                gender,
                duration,
                exercises,
                notes,
                isActive
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedTemplate,
            message: 'Plantilla actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('Error updating routine template:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la plantilla'
        });
    }
};
exports.updateRoutineTemplate = updateRoutineTemplate;
// Eliminar una plantilla (soft delete)
const deleteRoutineTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        // Verificar que la plantilla existe y pertenece al usuario
        const existingTemplate = await prisma.routineTemplate.findUnique({
            where: { id }
        });
        if (!existingTemplate) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }
        if (existingTemplate.createdBy !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar esta plantilla'
            });
        }
        // Soft delete - marcar como inactiva
        await prisma.routineTemplate.update({
            where: { id },
            data: {
                isActive: false
            }
        });
        res.json({
            success: true,
            message: 'Plantilla eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('Error deleting routine template:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la plantilla'
        });
    }
};
exports.deleteRoutineTemplate = deleteRoutineTemplate;
// Duplicar una plantilla existente
const duplicateRoutineTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        const originalTemplate = await prisma.routineTemplate.findUnique({
            where: { id }
        });
        if (!originalTemplate) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }
        const duplicatedTemplate = await prisma.routineTemplate.create({
            data: {
                name: name || `${originalTemplate.name} (Copia)`,
                description: originalTemplate.description,
                trainingObjective: originalTemplate.trainingObjective,
                level: originalTemplate.level,
                daysPerWeek: originalTemplate.daysPerWeek,
                gender: originalTemplate.gender,
                duration: originalTemplate.duration,
                exercises: originalTemplate.exercises,
                notes: originalTemplate.notes,
                createdBy: userId
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: duplicatedTemplate,
            message: 'Plantilla duplicada exitosamente'
        });
    }
    catch (error) {
        console.error('Error duplicating routine template:', error);
        res.status(500).json({
            success: false,
            message: 'Error al duplicar la plantilla'
        });
    }
};
exports.duplicateRoutineTemplate = duplicateRoutineTemplate;
/**
 * Generar plantilla de rutina por objetivo
 * POST /api/routines/templates
 */
const generateRoutineTemplate = async (req, res) => {
    try {
        const { objetivo, dias, nivel, genero } = req.body;
        // Validar parámetros requeridos
        if (!objetivo || !dias || !nivel) {
            return res.status(400).json({
                success: false,
                message: 'Los parámetros objetivo, dias y nivel son requeridos'
            });
        }
        // Validar valores permitidos
        const objetivosValidos = ['fuerza', 'hipertrofia', 'resistencia-cardio', 'potencia', 'quema-grasa'];
        const nivelesValidos = ['principiante', 'intermedio', 'avanzado'];
        const diasValidos = [2, 3];
        const generosValidos = ['masculino', 'femenino', 'unisex'];
        if (!objetivosValidos.includes(objetivo)) {
            return res.status(400).json({
                success: false,
                message: `Objetivo debe ser uno de: ${objetivosValidos.join(', ')}`
            });
        }
        if (!nivelesValidos.includes(nivel)) {
            return res.status(400).json({
                success: false,
                message: `Nivel debe ser uno de: ${nivelesValidos.join(', ')}`
            });
        }
        if (!diasValidos.includes(dias)) {
            return res.status(400).json({
                success: false,
                message: `Días debe ser 2 o 3`
            });
        }
        if (genero && !generosValidos.includes(genero)) {
            return res.status(400).json({
                success: false,
                message: `Género debe ser uno de: ${generosValidos.join(', ')}`
            });
        }
        logger_1.logger.info('Generando plantilla de rutina', {
            objetivo,
            dias,
            nivel,
            genero,
            userId: req.user?.id
        });
        // Generar ejercicios para cada día
        const template = {
            objetivo,
            dias,
            nivel,
            genero: genero || 'unisex',
            createdAt: new Date().toISOString(),
            days: []
        };
        for (let day = 1; day <= dias; day++) {
            const params = {
                objetivo,
                splitDay: day,
                nivel: nivel,
                genero: genero,
                dias: dias
            };
            try {
                const exercises = await (0, exerciseSelectionService_1.selectExercisesForDay)(params);
                // Determinar el nombre del día según el split
                let dayName = `Día ${day}`;
                if (dias === 2) {
                    dayName = day === 1 ? 'Upper (Tren Superior)' : 'Lower (Tren Inferior)';
                }
                else if (dias === 3) {
                    const dayNames = ['Push (Empuje)', 'Pull (Tirón)', 'Legs (Piernas)'];
                    dayName = dayNames[day - 1];
                }
                template.days.push({
                    day,
                    name: dayName,
                    exercises: exercises.map(exercise => ({
                        id: exercise.id,
                        name: exercise.name,
                        description: exercise.description,
                        type: exercise.type,
                        equipment: exercise.equipment,
                        difficulty: exercise.difficulty,
                        muscles: exercise.muscles,
                        imageUrl: exercise.imageUrl,
                        videoUrl: exercise.videoUrl,
                        sets: exercise.sets,
                        reps: exercise.reps,
                        weight: exercise.weight,
                        restTime: exercise.restTime,
                        notes: exercise.notes,
                        order: exercise.order,
                        category: exercise.category,
                        priority: exercise.priority
                    }))
                });
                logger_1.logger.info(`Día ${day} generado con ${exercises.length} ejercicios`);
            }
            catch (dayError) {
                logger_1.logger.error(`Error generando día ${day}:`, dayError);
                // Si falla un día, crear un día con ejercicios por defecto
                template.days.push({
                    day,
                    name: `Día ${day} (Fallback)`,
                    exercises: createFallbackDay(day, objetivo, nivel),
                    error: 'Se usaron ejercicios por defecto debido a falta de datos'
                });
            }
        }
        // Calcular estadísticas de la plantilla
        const stats = {
            totalExercises: template.days.reduce((sum, day) => sum + day.exercises.length, 0),
            exercisesByCategory: {
                movilidad: 0,
                principal: 0,
                finisher: 0
            },
            muscleGroups: new Set()
        };
        template.days.forEach(day => {
            day.exercises.forEach((exercise) => {
                if (stats.exercisesByCategory[exercise.category] !== undefined) {
                    stats.exercisesByCategory[exercise.category]++;
                }
                exercise.muscles.forEach((muscle) => stats.muscleGroups.add(muscle));
            });
        });
        const response = {
            success: true,
            message: 'Plantilla generada exitosamente',
            data: {
                template,
                stats: {
                    ...stats,
                    muscleGroups: Array.from(stats.muscleGroups)
                }
            }
        };
        logger_1.logger.info('Plantilla generada exitosamente', {
            objetivo,
            dias,
            totalExercises: stats.totalExercises,
            userId: req.user?.id
        });
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error('Error generando plantilla de rutina:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al generar la plantilla',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.generateRoutineTemplate = generateRoutineTemplate;
/**
 * Crear un día de ejercicios por defecto cuando falla la selección automática
 */
const createFallbackDay = (day, objetivo, nivel) => {
    const fallbackExercises = {
        1: [
            {
                id: `fallback_${day}_1`,
                name: 'Flexiones',
                description: 'Ejercicio básico de pecho y tríceps',
                type: 'Funcional',
                equipment: 'Peso corporal',
                difficulty: nivel === 'principiante' ? 'Principiante' : 'Intermedio',
                muscles: ['Pectorales', 'Tríceps'],
                sets: objetivo === 'fuerza' ? 4 : 3,
                reps: objetivo === 'fuerza' ? '3-5' : '8-12',
                weight: 'Peso corporal',
                restTime: objetivo === 'fuerza' ? '3 min' : '90 seg',
                notes: 'Ejercicio de respaldo',
                order: 1,
                category: 'principal',
                priority: 'multiarticular'
            },
            {
                id: `fallback_${day}_2`,
                name: 'Plancha',
                description: 'Ejercicio isométrico de core',
                type: 'Core',
                equipment: 'Peso corporal',
                difficulty: 'Principiante',
                muscles: ['Core'],
                sets: 3,
                reps: '30-60 seg',
                weight: 'Peso corporal',
                restTime: '60 seg',
                notes: 'Mantener posición',
                order: 2,
                category: 'finisher',
                priority: 'core'
            }
        ],
        2: [
            {
                id: `fallback_${day}_1`,
                name: 'Sentadillas',
                description: 'Ejercicio básico de piernas',
                type: 'Funcional',
                equipment: 'Peso corporal',
                difficulty: nivel === 'principiante' ? 'Principiante' : 'Intermedio',
                muscles: ['Cuádriceps', 'Glúteos'],
                sets: objetivo === 'fuerza' ? 4 : 3,
                reps: objetivo === 'fuerza' ? '3-5' : '10-15',
                weight: 'Peso corporal',
                restTime: objetivo === 'fuerza' ? '3 min' : '90 seg',
                notes: 'Ejercicio de respaldo',
                order: 1,
                category: 'principal',
                priority: 'multiarticular'
            },
            {
                id: `fallback_${day}_2`,
                name: 'Abdominales',
                description: 'Ejercicio básico de abdomen',
                type: 'Core',
                equipment: 'Peso corporal',
                difficulty: 'Principiante',
                muscles: ['Abdominales'],
                sets: 3,
                reps: '15-20',
                weight: 'Peso corporal',
                restTime: '45 seg',
                notes: 'Movimiento controlado',
                order: 2,
                category: 'finisher',
                priority: 'core'
            }
        ],
        3: [
            {
                id: `fallback_${day}_1`,
                name: 'Zancadas',
                description: 'Ejercicio unilateral de piernas',
                type: 'Funcional',
                equipment: 'Peso corporal',
                difficulty: nivel === 'principiante' ? 'Principiante' : 'Intermedio',
                muscles: ['Cuádriceps', 'Glúteos'],
                sets: objetivo === 'fuerza' ? 4 : 3,
                reps: objetivo === 'fuerza' ? '5-8' : '10-12',
                weight: 'Peso corporal',
                restTime: objetivo === 'fuerza' ? '2 min' : '90 seg',
                notes: 'Alternar piernas',
                order: 1,
                category: 'principal',
                priority: 'multiarticular'
            }
        ]
    };
    return fallbackExercises[day] || fallbackExercises[1];
};
