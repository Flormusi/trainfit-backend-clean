"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignedWorkouts = exports.getAssignedRoutines = exports.createOrUpdateProfile = exports.getProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Función auxiliar para enriquecer ejercicios con datos completos
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
                imageUrl: fullExercise?.imageUrl || exercise.imageUrl || exercise.image_url || null,
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
// ✅ Obtener perfil del cliente
const getProfile = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};
exports.getProfile = getProfile;
// ✅ Crear o actualizar perfil del cliente
const createOrUpdateProfile = async (req, res) => {
    try {
        const { name, phone, goals, weight, medicalConditions, medications, injuries } = req.body;
        if (!req.user?.id) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            return;
        }
        if (!name) {
            res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
            return;
        }
        console.log('🧾 Datos recibidos para guardar perfil:', {
            name, phone, goals, weight, medicalConditions, medications, injuries
        });
        const updatedProfile = await prisma.clientProfile.upsert({
            where: { userId: req.user.id },
            update: {
                name,
                phone,
                goals,
                weight: weight ? parseFloat(weight.toString()) : null,
                medicalConditions,
                medications,
                injuries
            },
            create: {
                userId: req.user.id,
                name,
                phone,
                goals,
                weight: weight ? parseFloat(weight.toString()) : null,
                medicalConditions,
                medications,
                injuries
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
    }
    catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};
exports.createOrUpdateProfile = createOrUpdateProfile;
// ✅ Obtener rutinas asignadas
const getAssignedRoutines = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            return;
        }
        console.log('🔍 Buscando rutinas para el usuario:', req.user.id);
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
            },
            orderBy: {
                createdAt: 'desc'
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
            },
            orderBy: {
                assignedDate: 'desc'
            }
        });
        // Combinar ambos tipos de rutinas
        const allRoutines = [
            ...directRoutines,
            ...assignmentRoutines.map(assignment => assignment.routine)
        ];
        // Eliminar duplicados basados en el ID
        const uniqueRoutines = allRoutines.filter((routine, index, self) => index === self.findIndex(r => r.id === routine.id));
        // Ordenar las rutinas por fecha de creación descendente (más recientes primero)
        uniqueRoutines.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
        // Enriquecer ejercicios con datos completos
        const enrichedRoutines = await Promise.all(uniqueRoutines.map(async (routine) => ({
            ...routine,
            exercises: await enrichRoutineExercises(routine.exercises)
        })));
        console.log('✅ Rutinas encontradas:', {
            directas: directRoutines.length,
            porAsignacion: assignmentRoutines.length,
            total: enrichedRoutines.length
        });
        res.status(200).json({
            success: true,
            data: enrichedRoutines
        });
    }
    catch (error) {
        console.error('❌ Error al obtener rutinas:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};
exports.getAssignedRoutines = getAssignedRoutines;
// ✅ Obtener workouts asignados
const getAssignedWorkouts = async (req, res) => {
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
                updatedAt: true
            }
        });
        // Enriquecer ejercicios con datos completos
        const enrichedRoutines = await Promise.all(routines.map(async (routine) => ({
            ...routine,
            exercises: await enrichRoutineExercises(routine.exercises)
        })));
        res.status(200).json({
            success: true,
            data: enrichedRoutines
        });
    }
    catch (error) {
        console.error('Error al obtener workouts:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};
exports.getAssignedWorkouts = getAssignedWorkouts;
