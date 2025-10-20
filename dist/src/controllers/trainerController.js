"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendRoutineEmail = exports.removeClientRoutine = exports.createTestNotification = exports.getUnreadNotifications = exports.markAllNotificationsAsRead = exports.deleteWorkoutPlan = exports.createWorkoutPlan = exports.getAllWorkoutPlans = exports.getClientProgressByTrainer = exports.markNotificationAsRead = exports.getClientNotifications = exports.updateClientPayment = exports.assignRoutineToClient = exports.createClientRoutine = exports.getTrainerClients = exports.getAnalytics = exports.updateProfile = exports.getProfile = exports.deleteNutritionPlan = exports.updateNutritionPlan = exports.createNutritionPlan = exports.getNutritionPlans = exports.getRoutineById = exports.getRoutines = exports.deleteExercise = exports.deleteRoutine = exports.updateRoutine = exports.updateExercise = exports.createExercise = exports.getExercises = exports.getDashboardData = exports.removeRoutineAssignment = exports.getRoutineAssignments = exports.updateClientInfo = exports.getUnassignedWorkoutPlans = exports.getClientPaymentStatus = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const notificationService_1 = require("../services/notificationService");
const emailService_1 = require("../services/emailService");
const prisma = new client_1.PrismaClient();
// Helper function to enrich routine exercises with complete exercise data
// Obtener estado de pago de un cliente específico
const getClientPaymentStatus = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { clientId } = req.params;
        console.log('=== getClientPaymentStatus called ===');
        console.log('Trainer ID:', user.id);
        console.log('Client ID:', clientId);
        // Verificar que el cliente está asociado al entrenador
        const trainerClientRelation = await prisma.trainerClient.findFirst({
            where: {
                trainerId: user.id,
                clientId: clientId
            }
        });
        if (!trainerClientRelation) {
            console.log('No trainer-client relation found');
            res.status(403).json({ message: 'No tienes acceso a este cliente.' });
            return;
        }
        // Obtener suscripción del cliente
        const subscription = await prisma.subscription.findUnique({
            where: { userId: clientId },
            include: {
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        if (!subscription) {
            // Si no hay suscripción, devolver estado por defecto
            res.status(200).json({
                success: true,
                data: {
                    status: 'pending',
                    amount: 0,
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    plan: 'BASIC',
                    lastPayment: null
                }
            });
            return;
        }
        // Determinar el estado del pago
        const now = new Date();
        const dueDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date();
        let status = 'pending';
        console.log('=== Payment Status Debug ===');
        console.log('Subscription payments:', subscription.payments);
        if (subscription.payments && subscription.payments.length > 0) {
            const recentPayment = subscription.payments[0];
            console.log('Recent payment status:', recentPayment.status);
            console.log('Recent payment amount:', recentPayment.amount);
            if (recentPayment.status === 'SUCCEEDED') {
                status = 'paid';
            }
            else if (recentPayment.status === 'PENDING') {
                status = 'pending';
            }
            else if (dueDate < now) {
                status = 'overdue';
            }
        }
        else if (dueDate < now) {
            status = 'overdue';
        }
        console.log('Final status determined:', status);
        // Obtener el último pago (cualquier status) para mostrar la información más reciente
        const lastPayment = await prisma.payment.findFirst({
            where: {
                subscriptionId: subscription.id
            },
            orderBy: { createdAt: 'desc' }
        });
        // Obtener el último pago exitoso para determinar el estado
        const lastSuccessfulPayment = await prisma.payment.findFirst({
            where: {
                subscriptionId: subscription.id,
                status: 'SUCCEEDED'
            },
            orderBy: { createdAt: 'desc' }
        });
        // Usar el monto del último pago (independientemente del status) o el de la suscripción
        const displayAmount = lastPayment?.amount || 0;
        console.log('Payment status retrieved successfully:', {
            status,
            subscription: subscription.id,
            plan: subscription.plan,
            lastPaymentAmount: displayAmount
        });
        res.status(200).json({
            success: true,
            data: {
                status,
                amount: displayAmount,
                dueDate: subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : new Date().toISOString(),
                plan: subscription.plan,
                lastPayment: lastSuccessfulPayment ? lastSuccessfulPayment.createdAt.toISOString() : null
            }
        });
    }
    catch (error) {
        console.error('Error getting client payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener el estado de pago'
        });
    }
};
exports.getClientPaymentStatus = getClientPaymentStatus;
const enrichRoutineExercises = async (routines) => {
    // Validar que routines sea un array
    if (!Array.isArray(routines)) {
        console.error('enrichRoutineExercises: routines is not an array:', typeof routines, routines);
        return [];
    }
    const enrichedRoutines = await Promise.all(routines.map(async (routine) => {
        if (routine.exercises && routine.exercises.length > 0) {
            const enrichedExercises = await Promise.all(routine.exercises.map(async (exercise) => {
                // Try to find the exercise in the database to get additional details
                const foundExercise = await prisma.exercise.findUnique({
                    where: { id: exercise.exerciseId || exercise.id }
                });
                if (foundExercise) {
                    return {
                        ...exercise,
                        name: foundExercise.name,
                        description: foundExercise.description,
                        type: foundExercise.type,
                        equipment: foundExercise.equipment,
                        difficulty: foundExercise.difficulty,
                        muscles: foundExercise.muscles,
                        image_url: foundExercise.imageUrl || exercise.image_url || null,
                        imageUrl: foundExercise.imageUrl || exercise.image_url || null, // Mantener ambos para compatibilidad
                        videoUrl: foundExercise.videoUrl || exercise.videoUrl || null
                    };
                }
                // If not found, return the original exercise with all its data preserved
                return {
                    ...exercise,
                    // Ensure we preserve the original data if no database match is found
                    name: exercise.name || exercise.exerciseId || 'Ejercicio sin nombre',
                    image_url: exercise.image_url || null,
                    imageUrl: exercise.image_url || null,
                    sets: exercise.sets || exercise.series || '0',
                    reps: exercise.reps || '0',
                    weight: exercise.weight || 'N/A',
                    rest: exercise.rest || '0 seg',
                    notes: exercise.notes || ''
                };
            }));
            return {
                ...routine,
                exercises: enrichedExercises
            };
        }
        return routine;
    }));
    return enrichedRoutines;
};
// Get dashboard data
const getUnassignedWorkoutPlans = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching unassigned workout plans:', error);
        res.status(500).json({ message: 'Internal server error while fetching unassigned workout plans' });
    }
};
exports.getUnassignedWorkoutPlans = getUnassignedWorkoutPlans;
// Actualizar información del cliente
const updateClientInfo = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { clientId } = req.params;
        const { name, email, phone, weight, height, age, gender, fitnessLevel, goals, initialObjective, trainingDaysPerWeek, lastTrainingDate, medicalConditions, medications, injuries } = req.body;
        console.log('=== updateClientInfo called ===');
        console.log('Trainer ID:', user.id);
        console.log('Client ID:', clientId);
        console.log('Update data:', { name, email, phone, weight, height, age, gender, fitnessLevel, goals, initialObjective, trainingDaysPerWeek, lastTrainingDate, medicalConditions, medications, injuries });
        console.log('lastTrainingDate received:', lastTrainingDate, 'type:', typeof lastTrainingDate);
        // Verificar que el cliente está asociado al entrenador
        const trainerClientRelation = await prisma.trainerClient.findFirst({
            where: {
                trainerId: user.id,
                clientId: clientId
            }
        });
        if (!trainerClientRelation) {
            console.log('No trainer-client relation found');
            res.status(403).json({ message: 'No tienes acceso a este cliente.' });
            return;
        }
        // Preparar los datos para actualizar
        const updateData = {};
        if (phone !== undefined)
            updateData.phone = phone;
        if (weight !== undefined)
            updateData.weight = parseFloat(weight);
        if (height !== undefined)
            updateData.height = parseFloat(height);
        if (age !== undefined)
            updateData.age = parseInt(age);
        if (gender !== undefined)
            updateData.gender = gender;
        if (fitnessLevel !== undefined)
            updateData.fitnessLevel = fitnessLevel;
        if (goals !== undefined) {
            // Convertir goals a array si es un string
            updateData.goals = Array.isArray(goals) ? goals : [goals];
        }
        if (initialObjective !== undefined)
            updateData.initialObjective = initialObjective;
        if (trainingDaysPerWeek !== undefined)
            updateData.trainingDaysPerWeek = parseInt(trainingDaysPerWeek);
        if (lastTrainingDate !== undefined) {
            // Convertir la fecha string a formato ISO DateTime, asegurando que se interprete correctamente
            // Si viene en formato YYYY-MM-DD, crear la fecha en UTC para evitar problemas de zona horaria
            if (lastTrainingDate.includes('T')) {
                updateData.lastTrainingDate = new Date(lastTrainingDate);
            }
            else {
                // Para fechas en formato YYYY-MM-DD, crear la fecha en UTC al mediodía
                const [year, month, day] = lastTrainingDate.split('-').map(Number);
                updateData.lastTrainingDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
            }
        }
        if (medicalConditions !== undefined)
            updateData.medicalConditions = medicalConditions;
        if (medications !== undefined)
            updateData.medications = medications;
        if (injuries !== undefined)
            updateData.injuries = injuries;
        console.log('Prepared update data:', updateData);
        // Actualizar información básica del usuario si se proporciona
        const userUpdateData = {};
        if (name !== undefined)
            userUpdateData.name = name;
        if (email !== undefined)
            userUpdateData.email = email;
        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: clientId },
                data: userUpdateData
            });
            console.log('User basic info updated:', userUpdateData);
        }
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
        }
        else {
            // Actualizar el perfil existente
            clientProfile = await prisma.clientProfile.update({
                where: { userId: clientId },
                data: updateData
            });
        }
        console.log('Client profile updated successfully:', clientProfile);
        // Obtener la información completa del cliente para la respuesta
        const updatedClient = await prisma.user.findUnique({
            where: { id: clientId },
            include: {
                clientProfile: true
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
    }
    catch (error) {
        console.error('Error updating client info:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar la información del cliente'
        });
    }
};
exports.updateClientInfo = updateClientInfo;
// Obtener asignaciones de rutinas por mes
const getRoutineAssignments = async (req, res) => {
    try {
        const user = req.user;
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
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
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
            select: {
                id: true,
                clientId: true,
                routineId: true,
                trainerId: true,
                startDate: true,
                endDate: true,
                assignedDate: true,
                trainingObjectives: true,
                pyramidalRepsPattern: true,
                pyramidalRepsSequence: true,
                createdAt: true,
                updatedAt: true,
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
    }
    catch (error) {
        console.error('Error getting routine assignments:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while getting routine assignments'
        });
    }
};
exports.getRoutineAssignments = getRoutineAssignments;
// Eliminar asignación de rutina
const removeRoutineAssignment = async (req, res) => {
    try {
        const user = req.user;
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
        }
        else if (assignmentId) {
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
    }
    catch (error) {
        console.error('Error removing routine assignment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while removing routine assignment'
        });
    }
};
exports.removeRoutineAssignment = removeRoutineAssignment;
const getDashboardData = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const currentTrainerId = user.id;
        const [clientCount, routineCount, exerciseCount] = await Promise.all([
            prisma.user.count({
                where: {
                    role: client_2.Role.CLIENT,
                    assignedRoutines: { some: { trainerId: currentTrainerId } }
                }
            }),
            prisma.routine.count({
                where: { trainerId: currentTrainerId }
            }),
            prisma.exercise.count({
                where: { trainerId: currentTrainerId }
            })
        ]);
        res.status(200).json({
            clientCount,
            routineCount,
            exerciseCount
        });
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Internal server error while fetching dashboard data' });
    }
};
exports.getDashboardData = getDashboardData;
// Exercise management
const getExercises = async (req, res) => {
    try {
        console.log('Headers de la solicitud:', req.headers);
        console.log('Usuario en la solicitud:', req.user);
        const user = req.user;
        if (!user || !user.id) {
            console.log('Error: Usuario no autenticado o ID faltante');
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        console.log('Rol del usuario:', user.role);
        if (user.role !== 'TRAINER') {
            console.log('Error: Usuario no es un trainer');
            res.status(403).json({ message: 'User is not authorized to access this route' });
            return;
        }
        console.log('Buscando ejercicios para el trainer:', user.id);
        const exercises = await prisma.exercise.findMany({
            where: { trainerId: user.id }
        });
        console.log('Ejercicios encontrados:', exercises);
        const response = {
            success: true,
            data: exercises
        };
        console.log('Enviando respuesta:', response);
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({ message: 'Internal server error while fetching exercises' });
    }
};
exports.getExercises = getExercises;
const createExercise = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error creating exercise:', error);
        res.status(500).json({ message: 'Internal server error while creating exercise' });
    }
};
exports.createExercise = createExercise;
const updateExercise = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating exercise:', error);
        res.status(500).json({ message: 'Internal server error while updating exercise' });
    }
};
exports.updateExercise = updateExercise;
const updateRoutine = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { id } = req.params;
        const routine = await prisma.routine.update({
            where: { id, trainerId: user.id },
            data: req.body,
            include: { client: true }
        });
        res.status(200).json(routine);
    }
    catch (error) {
        console.error('Error updating routine:', error);
        res.status(500).json({ message: 'Internal server error while updating routine' });
    }
};
exports.updateRoutine = updateRoutine;
const deleteRoutine = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { id } = req.params;
        // First check if the routine exists and belongs to the trainer
        const existingRoutine = await prisma.routine.findFirst({
            where: { id, trainerId: user.id }
        });
        if (!existingRoutine) {
            res.status(404).json({ message: 'Routine not found or you do not have permission to delete it' });
            return;
        }
        await prisma.routine.delete({
            where: { id, trainerId: user.id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting routine:', error);
        res.status(500).json({ message: 'Internal server error while deleting routine' });
    }
};
exports.deleteRoutine = deleteRoutine;
const deleteExercise = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting exercise:', error);
        res.status(500).json({ message: 'Internal server error while deleting exercise' });
    }
};
exports.deleteExercise = deleteExercise;
// Routine management
const getRoutines = async (req, res) => {
    try {
        console.log('🔍 getRoutines called for user:', req.user?.id);
        const user = req.user;
        if (!user || !user.id) {
            console.log('❌ User not authenticated');
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        console.log('📋 Fetching routines for trainer:', user.id);
        const routines = await prisma.routine.findMany({
            where: { trainerId: user.id },
            include: { client: true }
        });
        console.log('📊 Found routines:', routines.length);
        // Enriquecer ejercicios con datos completos
        console.log('🔧 Enriching routine exercises...');
        const enrichedRoutines = await enrichRoutineExercises(routines);
        console.log('✅ Sending enriched routines:', enrichedRoutines.length);
        res.status(200).json(enrichedRoutines);
    }
    catch (error) {
        console.error('❌ Error fetching routines:', error);
        res.status(500).json({ message: 'Internal server error while fetching routines' });
    }
};
exports.getRoutines = getRoutines;
const getRoutineById = async (req, res) => {
    try {
        const user = req.user;
        console.log('🔍 getRoutineById - User:', user?.id);
        if (!user || !user.id) {
            console.log('❌ getRoutineById - User not authenticated');
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { id } = req.params;
        console.log('🔍 getRoutineById - Routine ID:', id);
        console.log('🔍 getRoutineById - Trainer ID:', user.id);
        const routine = await prisma.routine.findFirst({
            where: {
                id: id,
                trainerId: user.id
            },
            include: {
                client: true
            }
        });
        console.log('🔍 getRoutineById - Found routine:', routine ? 'YES' : 'NO');
        if (routine) {
            console.log('🔍 getRoutineById - Routine details:', {
                id: routine.id,
                name: routine.name,
                trainerId: routine.trainerId,
                clientId: routine.clientId
            });
        }
        if (!routine) {
            console.log('❌ getRoutineById - Routine not found for trainer:', user.id, 'routine:', id);
            res.status(404).json({ message: 'Routine not found' });
            return;
        }
        // Parsear ejercicios desde JSON y enriquecer con datos completos
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
        console.log('🔍 getRoutineById - Exercises count:', exercisesArray.length);
        const enrichedRoutine = {
            ...routine,
            exercises: await enrichRoutineExercises([{ exercises: exercisesArray }])
                .then(enriched => enriched[0]?.exercises || [])
        };
        console.log('✅ getRoutineById - Sending enriched routine:', {
            id: enrichedRoutine.id,
            name: enrichedRoutine.name,
            exercisesCount: enrichedRoutine.exercises.length
        });
        res.status(200).json({ data: enrichedRoutine });
    }
    catch (error) {
        console.error('❌ getRoutineById - Error fetching routine by ID:', error);
        res.status(500).json({ message: 'Internal server error while fetching routine' });
    }
};
exports.getRoutineById = getRoutineById;
// Nutrition plans
const getNutritionPlans = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching nutrition plans:', error);
        res.status(500).json({ message: 'Internal server error while fetching nutrition plans' });
    }
};
exports.getNutritionPlans = getNutritionPlans;
const createNutritionPlan = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error creating nutrition plan:', error);
        res.status(500).json({ message: 'Internal server error while creating nutrition plan' });
    }
};
exports.createNutritionPlan = createNutritionPlan;
const updateNutritionPlan = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating nutrition plan:', error);
        res.status(500).json({ message: 'Internal server error while updating nutrition plan' });
    }
};
exports.updateNutritionPlan = updateNutritionPlan;
const deleteNutritionPlan = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting nutrition plan:', error);
        res.status(500).json({ message: 'Internal server error while deleting nutrition plan' });
    }
};
exports.deleteNutritionPlan = deleteNutritionPlan;
// Profile management
const getProfile = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Internal server error while fetching profile' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error while updating profile' });
    }
};
exports.updateProfile = updateProfile;
// Analytics
const getAnalytics = async (req, res) => {
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
                    role: client_2.Role.CLIENT,
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
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Internal server error while fetching analytics' });
    }
};
exports.getAnalytics = getAnalytics;
// Get all clients assigned to a trainer
const getTrainerClients = async (req, res) => {
    const user = req.user;
    if (!user || !user.id) {
        res.status(401).json({ message: 'User not authenticated or user ID missing' });
        return;
    }
    const currentTrainerId = user.id;
    try {
        const clients = await prisma.user.findMany({
            where: {
                role: client_2.Role.CLIENT,
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
    }
    catch (error) {
        console.error('Error fetching trainer clients:', error);
        res.status(500).json({ message: 'Internal server error while fetching trainer clients' });
    }
};
exports.getTrainerClients = getTrainerClients;
// Create a routine for a client
const createClientRoutine = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { clientId, name, description, exercises } = req.body;
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
                exercises: exercises
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
        // Enviar notificación por email al cliente
        await emailService_1.EmailService.sendRoutineAssignmentEmail({
            clientName: trainerClientRelation.client.name || 'Cliente',
            clientEmail: trainerClientRelation.client.email,
            routineName: name,
            trainerName: user.name !== null ? user.name : 'Tu entrenador',
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/dashboard`,
            routineUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/${clientId}/routine/${routine.id}`
        });
        res.status(201).json({
            status: 'success',
            data: { routine },
            message: 'Rutina creada y notificaciones enviadas exitosamente'
        });
    }
    catch (error) {
        console.error('Error creating client routine:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid data provided for routine creation'
            });
        }
        else {
            res.status(500).json({
                status: 'error',
                message: 'Internal server error while creating client routine'
            });
        }
    }
};
exports.createClientRoutine = createClientRoutine;
// Asignar rutina existente a cliente
const assignRoutineToClient = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { clientId, routineId, startDate, endDate, trainingObjectives, pyramidalReps } = req.body;
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
                assignedDate: new Date(),
                trainingObjectives: trainingObjectives ? trainingObjectives : null,
                pyramidalRepsPattern: pyramidalReps?.pattern || null,
                pyramidalRepsSequence: pyramidalReps?.customSequence ? pyramidalReps.customSequence : null
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
        await notificationService_1.NotificationService.notifyRoutineAssigned(user.id, trainerClientRelation.client.name || 'Cliente', routine.name, routineId);
        // Enviar notificación por email al cliente
        await emailService_1.EmailService.sendRoutineAssignmentEmail({
            clientName: trainerClientRelation.client.name || 'Cliente',
            clientEmail: trainerClientRelation.client.email,
            routineName: routine.name,
            trainerName: user.name !== null ? user.name : 'Tu entrenador',
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/dashboard`,
            routineUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/${clientId}/routine/${routineId}`,
            startDate,
            endDate
        });
        res.status(201).json({
            status: 'success',
            data: { assignment },
            message: 'Rutina asignada y notificaciones enviadas exitosamente'
        });
    }
    catch (error) {
        console.error('Error assigning routine:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid data provided for routine assignment'
            });
        }
        else {
            res.status(500).json({
                status: 'error',
                message: 'Internal server error while assigning routine'
            });
        }
    }
};
exports.assignRoutineToClient = assignRoutineToClient;
// Actualizar información de pago del cliente
const updateClientPayment = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { clientId } = req.params;
        const { amount, dueDate, planType, plan } = req.body;
        const finalPlanType = planType || plan; // Compatibilidad con ambos nombres
        console.log('=== updateClientPayment called ===');
        console.log('Trainer ID:', user.id);
        console.log('Client ID:', clientId);
        console.log('Payment data:', { amount, dueDate, planType: finalPlanType });
        console.log('Request body:', req.body);
        console.log('Request status:', req.body.status);
        // Verificar que el cliente está asociado al entrenador
        const trainerClientRelation = await prisma.trainerClient.findFirst({
            where: {
                trainerId: user.id,
                clientId: clientId
            }
        });
        if (!trainerClientRelation) {
            console.log('No trainer-client relation found');
            res.status(403).json({ message: 'No tienes acceso a este cliente.' });
            return;
        }
        // Obtener o crear suscripción del cliente
        let subscription = await prisma.subscription.findUnique({
            where: { userId: clientId }
        });
        if (!subscription) {
            // Crear nueva suscripción si no existe
            subscription = await prisma.subscription.create({
                data: {
                    userId: clientId,
                    plan: finalPlanType || 'BASIC',
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días por defecto
                }
            });
        }
        else {
            // Actualizar suscripción existente
            const updateData = {};
            if (finalPlanType)
                updateData.plan = finalPlanType;
            if (dueDate)
                updateData.currentPeriodEnd = new Date(dueDate);
            subscription = await prisma.subscription.update({
                where: { userId: clientId },
                data: updateData
            });
        }
        // Crear o actualizar registro de pago si se especifica un monto
        if (amount) {
            // Mapear el status del frontend al backend usando los valores del enum PaymentStatus
            const statusMapping = {
                'paid': 'SUCCEEDED',
                'succeeded': 'SUCCEEDED',
                'pending': 'PENDING',
                'overdue': 'FAILED'
            };
            const paymentStatus = req.body.status && statusMapping[req.body.status]
                ? statusMapping[req.body.status]
                : 'PENDING';
            console.log('Payment status mapping:', req.body.status, '->', paymentStatus);
            // Buscar el pago más reciente para esta suscripción
            const existingPayment = await prisma.payment.findFirst({
                where: { subscriptionId: subscription.id },
                orderBy: { createdAt: 'desc' }
            });
            if (existingPayment) {
                // Actualizar el pago existente
                await prisma.payment.update({
                    where: { id: existingPayment.id },
                    data: {
                        amount: parseFloat(amount),
                        status: paymentStatus,
                        description: `Cuota actualizada por entrenador - ${new Date().toLocaleDateString()}`,
                        paidAt: paymentStatus === 'SUCCEEDED' ? new Date() : null
                    }
                });
                console.log('Updated existing payment:', existingPayment.id, 'with status:', paymentStatus);
            }
            else {
                // Crear nuevo pago si no existe ninguno
                await prisma.payment.create({
                    data: {
                        subscriptionId: subscription.id,
                        amount: parseFloat(amount),
                        currency: 'usd',
                        status: paymentStatus,
                        description: `Cuota actualizada por entrenador - ${new Date().toLocaleDateString()}`,
                        paidAt: paymentStatus === 'SUCCEEDED' ? new Date() : null
                    }
                });
                console.log('Created new payment with status:', paymentStatus);
            }
        }
        // Crear notificación para el cliente
        await prisma.notification.create({
            data: {
                userId: clientId,
                title: 'Información de pago actualizada',
                message: `Tu entrenador ha actualizado tu información de pago. ${amount ? `Nuevo monto: $${amount}` : ''} ${dueDate ? `Fecha de vencimiento: ${new Date(dueDate).toLocaleDateString()}` : ''}`,
                type: 'PAYMENT_UPDATE',
                isRead: false
            }
        });
        // Emitir evento de WebSocket para sincronización en tiempo real
        const io = global.io;
        if (io) {
            // Mapear el status del backend al frontend
            const statusMapping = {
                'SUCCEEDED': 'paid',
                'PENDING': 'pending',
                'FAILED': 'overdue'
            };
            const frontendStatus = req.body.status ? req.body.status : 'pending';
            io.to(`user-${clientId}`).emit('payment-updated', {
                amount: amount ? parseFloat(amount) : null,
                dueDate: dueDate ? new Date(dueDate) : subscription.currentPeriodEnd,
                plan: subscription.plan,
                status: frontendStatus
            });
            console.log(`📡 Evento payment-updated enviado al cliente ${clientId} con status: ${frontendStatus}`);
        }
        console.log('Client payment updated successfully');
        res.status(200).json({
            success: true,
            message: 'Información de pago actualizada exitosamente',
            data: {
                subscription,
                amount: amount ? parseFloat(amount) : null,
                dueDate: dueDate ? new Date(dueDate) : subscription.currentPeriodEnd
            }
        });
    }
    catch (error) {
        console.error('Error updating client payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar la información de pago'
        });
    }
};
exports.updateClientPayment = updateClientPayment;
// Obtener notificaciones del cliente
const getClientNotifications = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};
exports.getClientNotifications = getClientNotifications;
// Marcar notificación como leída
const markNotificationAsRead = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// Get client progress
const getClientProgressByTrainer = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ message: 'User not authenticated or user ID missing' });
        }
        const currentTrainerId = user.id;
        const { clientId } = req.params;
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
        const enrichedRoutines = await enrichRoutineExercises(routines);
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
    }
    catch (error) {
        console.error('Error fetching client progress:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch progress data'
        });
    }
};
exports.getClientProgressByTrainer = getClientProgressByTrainer;
// Get all workout plans for trainer
const getAllWorkoutPlans = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching workout plans:', error);
        res.status(500).json({ message: 'Internal server error while fetching workout plans' });
    }
};
exports.getAllWorkoutPlans = getAllWorkoutPlans;
// Create workout plan
const createWorkoutPlan = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error creating workout plan:', error);
        res.status(500).json({ message: 'Internal server error while creating workout plan' });
    }
};
exports.createWorkoutPlan = createWorkoutPlan;
// Delete workout plan
const deleteWorkoutPlan = async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting workout plan:', error);
        res.status(500).json({ message: 'Internal server error while deleting workout plan' });
    }
};
exports.deleteWorkoutPlan = deleteWorkoutPlan;
// Marcar todas las notificaciones como leídas
const markAllNotificationsAsRead = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            return;
        }
        await notificationService_1.NotificationService.markAllAsRead(req.user.id);
        res.status(200).json({
            success: true,
            message: 'Todas las notificaciones marcadas como leídas'
        });
    }
    catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Obtener notificaciones no leídas
const getUnreadNotifications = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            return;
        }
        const notifications = await notificationService_1.NotificationService.getUnreadNotifications(req.user.id);
        res.status(200).json({
            success: true,
            data: notifications,
            count: notifications.length
        });
    }
    catch (error) {
        console.error('Error al obtener notificaciones no leídas:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};
exports.getUnreadNotifications = getUnreadNotifications;
// Crear notificación de prueba (para testing)
const createTestNotification = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            return;
        }
        const { type = 'system', title, message } = req.body;
        const notification = await notificationService_1.NotificationService.createNotification({
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
    }
    catch (error) {
        console.error('Error al crear notificación de prueba:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};
exports.createTestNotification = createTestNotification;
// Eliminar rutina directa del cliente
const removeClientRoutine = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { clientId, routineId } = req.params;
        console.log('=== removeClientRoutine called ===');
        console.log('Trainer ID:', user.id);
        console.log('Client ID:', clientId);
        console.log('Routine ID:', routineId);
        // Verificar que el cliente está asociado al entrenador
        const trainerClientRelation = await prisma.trainerClient.findFirst({
            where: {
                trainerId: user.id,
                clientId: clientId
            }
        });
        if (!trainerClientRelation) {
            console.log('No trainer-client relation found');
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
            console.log('Routine not found by ID:', routineId);
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
            console.log('Trainer does not have access to this routine');
            res.status(403).json({ message: 'No tienes acceso a esta rutina.' });
            return;
        }
        console.log('Routine found, proceeding to delete:', routine.name);
        // Eliminar la rutina
        await prisma.routine.delete({
            where: { id: routineId }
        });
        console.log('Routine deleted successfully');
        res.status(200).json({
            success: true,
            message: 'Rutina eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('Error removing client routine:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al eliminar la rutina'
        });
    }
};
exports.removeClientRoutine = removeClientRoutine;
// Reenviar email de rutina asignada
const resendRoutineEmail = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            res.status(401).json({ message: 'User not authenticated or user ID missing' });
            return;
        }
        const { clientId, routineId } = req.params;
        console.log('=== resendRoutineEmail called ===');
        console.log('Trainer ID:', user.id);
        console.log('Client ID:', clientId);
        console.log('Routine ID:', routineId);
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
            console.log('No trainer-client relation found');
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
            console.log('Routine not found by ID:', routineId);
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
            console.log('Trainer does not have access to this routine');
            res.status(403).json({ message: 'No tienes acceso a esta rutina.' });
            return;
        }
        console.log('Routine found, proceeding to resend email:', routine.name);
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
        // Reenviar email de notificación al cliente
        await emailService_1.EmailService.sendRoutineAssignmentEmail({
            clientName: trainerClientRelation.client.name || 'Cliente',
            clientEmail: trainerClientRelation.client.email,
            routineName: routine.name,
            trainerName: user.name !== null ? user.name : 'Tu entrenador',
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/dashboard`,
            routineUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client/${clientId}/routine/${routineId}`,
            startDate,
            endDate
        });
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
        console.log('Routine email resent successfully');
        res.status(200).json({
            success: true,
            message: `Email de la rutina "${routine.name}" reenviado exitosamente a ${trainerClientRelation.client.email}`
        });
    }
    catch (error) {
        console.error('Error resending routine email:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al reenviar el email'
        });
    }
};
exports.resendRoutineEmail = resendRoutineEmail;
