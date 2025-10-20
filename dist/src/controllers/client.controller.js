"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMonthlyRoutineEmail = exports.deleteAssignedRoutine = exports.getPaymentStatus = exports.getClientRoutines = exports.deleteClient = exports.getClientById = exports.recordProgress = exports.addClientByTrainer = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const emailService_1 = require("../services/emailService");
const passwordGenerator_1 = require("../utils/passwordGenerator");
const prisma = new client_1.PrismaClient();
// Helper function to enrich routine exercises with complete exercise data
const enrichRoutineExercises = async (routines) => {
    const enrichedRoutines = await Promise.all(routines.map(async (routine) => {
        if (routine.exercises && Array.isArray(routine.exercises)) {
            const enrichedExercises = await Promise.all(routine.exercises.map(async (exercise) => {
                // Try to find the exercise in the Exercise table by name
                const exerciseData = await prisma.exercise.findFirst({
                    where: {
                        name: exercise.name || exercise.exerciseId
                    }
                });
                // If found, merge the exercise data with the routine exercise data
                if (exerciseData) {
                    return {
                        ...exercise,
                        image_url: exerciseData.imageUrl || null,
                        imageUrl: exerciseData.imageUrl || null, // Mantener ambos para compatibilidad
                        description: exerciseData.description,
                        type: exerciseData.type,
                        equipment: exerciseData.equipment,
                        difficulty: exerciseData.difficulty,
                        muscles: exerciseData.muscles
                    };
                }
                // If not found, return the original exercise
                return exercise;
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
// Añadir cliente (hecho por entrenador)
const addClientByTrainer = async (req, res) => {
    const { email, password, name, phone, goals, weight, initialObjective, trainingDaysPerWeek, medicalConditions, medications, injuries } = req.body;
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: no user context found.' });
        return;
    }
    const trainer = req.user;
    if (!email || !password || !name) {
        res.status(400).json({ message: 'Email, password, and name are required for the new client.' });
        return;
    }
    try {
        const existingClient = await prisma.user.findUnique({ where: { email } });
        if (existingClient) {
            // Verificar si ya existe la relación trainer-client
            const existingRelation = await prisma.trainerClient.findFirst({
                where: {
                    trainerId: trainer.id,
                    clientId: existingClient.id
                }
            });
            if (existingRelation) {
                res.status(400).json({ message: 'Este cliente ya está asociado a tu cuenta.' });
                return;
            }
            // Si el cliente existe pero no está asociado, crear la relación
            await prisma.trainerClient.create({
                data: {
                    trainerId: trainer.id,
                    clientId: existingClient.id
                }
            });
            // Enviar correo de bienvenida al cliente existente (sin nueva contraseña)
            let emailResult = { success: false, timestamp: new Date() };
            try {
                emailResult = await emailService_1.EmailService.sendWelcomeEmail({
                    clientName: existingClient.name || name,
                    clientEmail: existingClient.email,
                    temporaryPassword: 'Tu contraseña actual (sin cambios)',
                    trainerName: trainer.name || 'Tu entrenador',
                    loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173/login'
                });
                console.log(`✅ Correo de bienvenida enviado a cliente existente: ${existingClient.email}`);
            }
            catch (emailError) {
                console.error('Error al enviar correo de bienvenida a cliente existente:', emailError);
                emailResult = { success: false, error: emailError.message, timestamp: new Date() };
            }
            const { password: _, ...clientData } = existingClient;
            res.status(200).json({
                message: 'Cliente asociado exitosamente a tu cuenta.',
                client: clientData,
                emailSent: emailResult.success,
                emailError: emailResult.error || null
            });
            return;
        }
        // Generar contraseña temporal si no se proporciona una
        const temporaryPassword = password || (0, passwordGenerator_1.generateSecureTemporaryPassword)(12);
        const hashedPassword = await bcryptjs_1.default.hash(temporaryPassword, 12);
        const clientProfileData = {
            name,
            phone,
            goals: goals || [],
            weight: weight ? parseFloat(weight.toString()) : null,
            initialObjective: initialObjective || 'Sin definir',
            trainingDaysPerWeek: trainingDaysPerWeek ? parseInt(trainingDaysPerWeek.toString(), 10) : 3,
            medicalConditions,
            medications,
            injuries
        };
        const newClient = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: client_1.Role.CLIENT,
                hasCompletedOnboarding: false,
                clientProfile: {
                    create: clientProfileData
                }
            },
            include: {
                clientProfile: true
            }
        });
        // Crear la relación directa trainer-client
        await prisma.trainerClient.create({
            data: {
                trainerId: trainer.id,
                clientId: newClient.id
            }
        });
        // Crear una rutina inicial (opcional, ya no es necesaria para la relación)
        const initialRoutine = await prisma.routine.create({
            data: {
                name: 'Rutina Inicial',
                description: 'Rutina inicial para nuevo cliente',
                trainerId: trainer.id,
                clientId: newClient.id,
                exercises: []
            }
        });
        // Enviar correo de bienvenida con credenciales
        let emailResult = { success: false, timestamp: new Date() };
        try {
            emailResult = await emailService_1.EmailService.sendWelcomeEmail({
                clientName: name,
                clientEmail: email,
                temporaryPassword: temporaryPassword,
                trainerName: trainer.name || 'Tu entrenador',
                loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173/login'
            });
            console.log(`✅ Correo de bienvenida enviado exitosamente a: ${email}`);
        }
        catch (emailError) {
            console.error('Error al enviar correo de bienvenida:', emailError);
            emailResult = { success: false, error: emailError.message, timestamp: new Date() };
        }
        const { password: _, ...clientData } = newClient;
        res.status(201).json({
            message: 'Cliente agregado exitosamente.',
            client: clientData,
            routine: initialRoutine,
            emailSent: emailResult.success,
            emailError: emailResult.error || null
        });
    }
    catch (error) {
        console.error('Error adding client by trainer:', error);
        res.status(500).json({ message: 'Internal server error while adding client.' });
    }
};
exports.addClientByTrainer = addClientByTrainer;
// Registrar progreso
const recordProgress = async (req, res) => {
    const { routineId, date, notes, metrics, clientId } = req.body;
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: no user context found.' });
        return;
    }
    try {
        const progress = await prisma.progress.create({
            data: {
                routine: { connect: { id: routineId } },
                date: new Date(date),
                notes,
                metrics,
                user: { connect: { id: clientId } }
            }
        });
        res.status(201).json(progress);
    }
    catch (error) {
        console.error('Error recording progress:', error);
        res.status(500).json({ message: 'Internal server error while recording progress.' });
    }
};
exports.recordProgress = recordProgress;
// Ver cliente por ID
const getClientById = async (req, res) => {
    const { clientId } = req.params;
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: no user context found.' });
        return;
    }
    const trainer = req.user;
    try {
        const client = await prisma.user.findUnique({
            where: { id: clientId },
            include: {
                clientProfile: true,
                progressRecords: true,
                assignedRoutines: true
            }
        });
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }
        // Verificar si el entrenador tiene acceso al cliente a través de la relación TrainerClient
        const hasAccess = await prisma.trainerClient.findFirst({
            where: {
                trainerId: trainer.id,
                clientId: client.id
            }
        });
        if (!hasAccess && trainer.role !== client_1.Role.ADMIN) {
            res.status(403).json({ message: 'Forbidden: You can only view your own clients.' });
            return;
        }
        const { password: _, ...clientData } = client;
        res.status(200).json({ data: clientData });
    }
    catch (error) {
        console.error('Error fetching client by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getClientById = getClientById;
// Eliminar cliente
const deleteClient = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: no user context found.' });
        return;
    }
    const trainer = req.user;
    const { clientId } = req.params;
    try {
        // Verificar si el cliente existe y está asociado al entrenador
        const trainerClientRelation = await prisma.trainerClient.findFirst({
            where: {
                trainerId: trainer.id,
                clientId: clientId
            },
            include: {
                client: {
                    include: {
                        clientProfile: true
                    }
                }
            }
        });
        if (!trainerClientRelation) {
            res.status(404).json({ message: 'Cliente no encontrado o no está asociado a este entrenador.' });
            return;
        }
        const client = trainerClientRelation.client;
        // Eliminar todas las rutinas asociadas al cliente
        await prisma.routine.deleteMany({
            where: {
                clientId: client.id,
                trainerId: trainer.id
            }
        });
        // Eliminar la relación trainer-client
        await prisma.trainerClient.delete({
            where: {
                id: trainerClientRelation.id
            }
        });
        // Eliminar el perfil del cliente y el usuario
        await prisma.clientProfile.delete({
            where: { userId: client.id }
        });
        await prisma.user.delete({
            where: { id: client.id }
        });
        res.status(200).json({ message: 'Cliente eliminado exitosamente' });
    }
    catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el cliente' });
    }
};
exports.deleteClient = deleteClient;
const getClientRoutines = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: no user context found.' });
    }
    const user = req.user;
    const { clientId } = req.params;
    try {
        // Si es un cliente, obtener sus rutinas asignadas
        if (user.role === 'CLIENT') {
            // Buscar rutinas directas
            const directRoutines = await prisma.routine.findMany({
                where: { clientId: user.id },
                include: {
                    trainer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            });
            // Buscar rutinas asignadas a través de RoutineAssignment
            const assignedRoutines = await prisma.routineAssignment.findMany({
                where: { clientId: user.id },
                include: {
                    routine: {
                        include: {
                            trainer: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    role: true
                                }
                            }
                        }
                    }
                }
            });
            // Combinar rutinas directas y asignadas, evitando duplicados
            const allRoutines = [...directRoutines];
            assignedRoutines.forEach(assignment => {
                const routineWithAssignment = {
                    ...assignment.routine,
                    assignedDate: assignment.assignedDate,
                    startDate: assignment.startDate,
                    endDate: assignment.endDate,
                    assignmentId: assignment.id
                };
                // Verificar si la rutina ya existe en las rutinas directas
                const exists = allRoutines.find(r => r.id === assignment.routine.id);
                if (!exists) {
                    allRoutines.push(routineWithAssignment);
                }
            });
            console.log('Found routines for client:', user.id, 'Total:', allRoutines.length);
            // Enrich exercises with complete data
            const enrichedRoutines = await enrichRoutineExercises(allRoutines);
            return res.status(200).json({ data: enrichedRoutines });
        }
        // Si es un entrenador, obtener las rutinas de un cliente específico
        if (user.role === 'TRAINER') {
            // Si se proporciona clientId, obtener rutinas de ese cliente específico
            if (clientId) {
                // Verificar que el cliente está asociado al entrenador
                const trainerClientRelation = await prisma.trainerClient.findFirst({
                    where: {
                        trainerId: user.id,
                        clientId: clientId
                    }
                });
                if (!trainerClientRelation) {
                    return res.status(403).json({ message: 'No tienes acceso a este cliente.' });
                }
                // Buscar rutinas directas
                const directRoutines = await prisma.routine.findMany({
                    where: {
                        clientId: clientId
                    },
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                });
                // Buscar rutinas asignadas a través de RoutineAssignment
                const assignedRoutines = await prisma.routineAssignment.findMany({
                    where: {
                        clientId: clientId
                    },
                    include: {
                        routine: {
                            include: {
                                client: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        role: true
                                    }
                                },
                                trainer: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        role: true
                                    }
                                }
                            }
                        },
                        client: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                });
                // Combinar rutinas directas y asignadas, evitando duplicados
                const allRoutines = [...directRoutines];
                assignedRoutines.forEach(assignment => {
                    const routineWithAssignment = {
                        ...assignment.routine,
                        assignedDate: assignment.assignedDate,
                        startDate: assignment.startDate,
                        endDate: assignment.endDate,
                        assignmentId: assignment.id
                    };
                    // Verificar si la rutina ya existe en las rutinas directas
                    const exists = allRoutines.find(r => r.id === assignment.routine.id);
                    if (!exists) {
                        allRoutines.push(routineWithAssignment);
                    }
                });
                console.log('Found routines for client:', clientId, 'Total:', allRoutines.length);
                // Enrich exercises with complete data
                const enrichedRoutines = await enrichRoutineExercises(allRoutines);
                return res.status(200).json({ data: enrichedRoutines });
            }
            else {
                // Si no se proporciona clientId, obtener todas las rutinas del entrenador
                const routines = await prisma.routine.findMany({
                    where: { trainerId: user.id },
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                });
                // Enrich exercises with complete data
                const enrichedRoutines = await enrichRoutineExercises(routines);
                return res.status(200).json({ data: enrichedRoutines });
            }
        }
        // Si no es ni cliente ni entrenador
        return res.status(403).json({ message: 'Unauthorized: invalid role for this operation.' });
    }
    catch (error) {
        console.error('Error fetching client routines:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getClientRoutines = getClientRoutines;
// Obtener estado de pago del cliente
const getPaymentStatus = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: no user context found.' });
        return;
    }
    const user = req.user;
    try {
        // Por ahora devolvemos datos simulados
        // En una implementación real, esto se conectaría con un sistema de pagos
        const paymentStatus = {
            isUpToDate: Math.random() > 0.3, // 70% probabilidad de estar al día
            lastPaymentDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            nextPaymentDue: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            amount: 50.00,
            currency: 'USD'
        };
        res.status(200).json({ success: true, paymentStatus });
    }
    catch (error) {
        console.error('Error fetching payment status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPaymentStatus = getPaymentStatus;
// Eliminar rutina asignada (solo para clientes)
const deleteAssignedRoutine = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: no user context found.' });
        return;
    }
    const user = req.user;
    const { routineId } = req.params;
    // Solo los clientes pueden eliminar sus rutinas asignadas
    if (user.role !== 'CLIENT') {
        res.status(403).json({ message: 'Solo los clientes pueden eliminar rutinas asignadas.' });
        return;
    }
    try {
        // Verificar que la rutina existe y pertenece al cliente
        const routine = await prisma.routine.findFirst({
            where: {
                id: routineId,
                clientId: user.id
            }
        });
        if (!routine) {
            res.status(404).json({ message: 'Rutina no encontrada o no tienes acceso a ella.' });
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
    }
    catch (error) {
        console.error('Error deleting assigned routine:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al eliminar la rutina'
        });
    }
};
exports.deleteAssignedRoutine = deleteAssignedRoutine;
// Enviar rutina mensual por email
const sendMonthlyRoutineEmail = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: no user context found.' });
        return;
    }
    const user = req.user;
    try {
        // Obtener las rutinas del cliente
        const routines = await prisma.routine.findMany({
            where: { clientId: user.id },
            include: {
                trainer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 1 // Obtener la rutina más reciente
        });
        if (routines.length === 0) {
            res.status(404).json({ message: 'No se encontraron rutinas asignadas' });
            return;
        }
        const routine = routines[0];
        // Configurar el transportador de email (usando configuración de desarrollo)
        const transporter = nodemailer_1.default.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER || 'demo@trainfit.com',
                pass: process.env.EMAIL_PASS || 'demo_password'
            }
        });
        // Crear el contenido del email
        const emailContent = `
      <h2>Tu Rutina Mensual - TrainFit</h2>
      <p>Hola ${user.name || 'Cliente'},</p>
      <p>Aquí tienes tu rutina mensual asignada por tu entrenador ${routine.trainer?.name || 'tu entrenador'}:</p>
      
      <h3>${routine.name}</h3>
      <p><strong>Descripción:</strong> ${routine.description || 'Sin descripción'}</p>
      
      <h4>Ejercicios:</h4>
       <ul>
         ${Array.isArray(routine.exercises) ? routine.exercises.map((exercise) => `
           <li>
             <strong>${exercise.name || 'Ejercicio'}:</strong> 
             ${exercise.sets || 3} series x ${exercise.reps || 12} repeticiones
             ${exercise.weight ? ` - ${exercise.weight}kg` : ''}
             ${exercise.notes ? `<br><em>Notas: ${exercise.notes}</em>` : ''}
           </li>
         `).join('') : '<li>No hay ejercicios asignados</li>'}
       </ul>
      
      <p>¡Sigue trabajando duro y alcanza tus objetivos!</p>
      <p>Saludos,<br>El equipo de TrainFit</p>
    `;
        // Enviar el email
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@trainfit.com',
            to: user.email,
            subject: 'Tu Rutina Mensual - TrainFit',
            html: emailContent
        });
        res.status(200).json({
            success: true,
            message: 'Rutina enviada por email exitosamente'
        });
    }
    catch (error) {
        console.error('Error sending monthly routine email:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el email. Por favor, inténtalo de nuevo más tarde.'
        });
    }
};
exports.sendMonthlyRoutineEmail = sendMonthlyRoutineEmail;
