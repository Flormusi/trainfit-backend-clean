"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoutineDetailsForClient = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Helper function to enrich routine exercises with complete exercise data
const enrichRoutineExercises = async (exercises) => {
    if (!exercises || !Array.isArray(exercises)) {
        return [];
    }
    const enrichedExercises = await Promise.all(exercises.map(async (exercise) => {
        try {
            // Si el ejercicio ya tiene datos completos, devolverlo tal como está
            if (exercise.imageUrl && exercise.description) {
                return exercise;
            }
            // Buscar el ejercicio completo en la base de datos
            let fullExercise = null;
            // Buscar por exerciseId si existe
            if (exercise.exerciseId) {
                fullExercise = await prisma.exercise.findUnique({
                    where: { id: exercise.exerciseId }
                });
            }
            // Si no se encontró por ID, buscar por nombre
            if (!fullExercise && exercise.name) {
                fullExercise = await prisma.exercise.findFirst({
                    where: {
                        name: {
                            contains: exercise.name,
                            mode: 'insensitive'
                        }
                    }
                });
            }
            // Combinar datos del ejercicio original con los datos completos encontrados
            return {
                ...exercise,
                image_url: fullExercise?.imageUrl || exercise.imageUrl || exercise.image_url || null,
                imageUrl: fullExercise?.imageUrl || exercise.imageUrl || exercise.image_url || null, // Mantener ambos para compatibilidad
                description: fullExercise?.description || exercise.description || null,
                type: fullExercise?.type || exercise.type || null,
                equipment: fullExercise?.equipment || exercise.equipment || null,
                difficulty: fullExercise?.difficulty || exercise.difficulty || null,
                muscles: fullExercise?.muscles || exercise.muscles || null
            };
        }
        catch (error) {
            console.error('Error enriching exercise:', exercise.name, error);
            return exercise; // Devolver el ejercicio original si hay error
        }
    }));
    return enrichedExercises;
};
// Obtener detalles de rutina para cliente
const getRoutineDetailsForClient = async (req, res) => {
    try {
        console.log('\n🚀 CONTROLADOR EJECUTÁNDOSE: getRoutineDetailsForClient');
        console.log('🔍 Iniciando getRoutineDetailsForClient');
        const user = req.user;
        if (!user || !user.id) {
            console.log('❌ Usuario no autenticado');
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { id } = req.params;
        console.log('📋 Buscando rutina con ID:', id, 'para usuario:', user.id);
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
        console.log('🔍 Rutina directa encontrada:', routine ? 'SÍ' : 'NO');
        // Si no se encuentra rutina directa, buscar en asignaciones
        if (!routine) {
            console.log('🔍 Buscando en asignaciones...');
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
                console.log('✅ Asignación encontrada:', assignment.id);
                routine = assignment.routine;
                // Agregar información de la asignación
                routine.assignedDate = assignment.assignedDate;
                routine.startDate = assignment.startDate;
                routine.endDate = assignment.endDate;
                routine.assignmentId = assignment.id;
            }
            else {
                console.log('❌ No se encontró asignación');
            }
        }
        console.log('🎯 Rutina final encontrada:', routine ? 'SÍ' : 'NO');
        if (!routine) {
            console.log('❌ Enviando 404 - Rutina no encontrada');
            res.status(404).json({ message: 'Routine not found or not accessible' });
            return;
        }
        console.log('✅ Enviando rutina con ID:', routine.id);
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
            }
            catch (error) {
                console.error('Error parsing exercises JSON:', error);
                exercisesArray = [];
            }
        }
        // Enriquecer ejercicios con datos completos
        const enrichedRoutine = {
            ...routine,
            exercises: await enrichRoutineExercises(exercisesArray)
        };
        res.status(200).json({ data: enrichedRoutine });
    }
    catch (error) {
        console.error('Error fetching routine details for client:', error);
        res.status(500).json({ message: 'Internal server error while fetching routine details' });
    }
};
exports.getRoutineDetailsForClient = getRoutineDetailsForClient;
