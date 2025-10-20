"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImage = exports.updateClientProfile = exports.getClientProfile = exports.getClientPaymentStatus = exports.getClientProgress = exports.getRoutineDetails = exports.getAssignedRoutines = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUnreadNotificationsCount = exports.getClientNotifications = void 0;
const client_1 = require("@prisma/client");
const cloudinaryService_1 = require("../services/cloudinaryService");
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
// Obtener notificaciones del cliente
const getClientNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: Number(limit),
            include: {
                routine: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const total = await prisma.notification.count({
            where: {
                userId: userId,
            }
        });
        res.json({
            notifications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching client notifications:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getClientNotifications = getClientNotifications;
// Obtener contador de notificaciones no leídas
const getUnreadNotificationsCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await prisma.notification.count({
            where: {
                userId: userId,
                isRead: false
            }
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Error fetching unread notifications count:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getUnreadNotificationsCount = getUnreadNotificationsCount;
// Marcar notificación como leída
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await prisma.notification.update({
            where: {
                id: notificationId
            },
            data: {
                isRead: true
            }
        });
        res.json({ message: 'Notificación marcada como leída', notification });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// Marcar todas las notificaciones como leídas
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        await prisma.notification.updateMany({
            where: {
                userId: userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });
        res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Obtener rutinas asignadas al cliente
const getAssignedRoutines = async (req, res) => {
    try {
        const { userId } = req.params;
        const routines = await prisma.routine.findMany({
            where: {
                clientId: userId
            },
            include: {
                trainer: {
                    select: {
                        name: true,
                        trainerProfile: {
                            select: {
                                name: true,
                                specialty: true
                            }
                        }
                    }
                },
                assignments: {
                    where: {
                        clientId: userId
                    },
                    orderBy: {
                        assignedDate: 'desc'
                    },
                    take: 1
                }
            }
        });
        // Enriquecer con información de asignación
        const enrichedRoutines = routines.map(routine => ({
            ...routine,
            assignedAt: routine.assignments[0]?.assignedDate || routine.createdAt,
            startDate: routine.assignments[0]?.startDate,
            endDate: routine.assignments[0]?.endDate
        }));
        res.json({ routines: enrichedRoutines });
    }
    catch (error) {
        console.error('Error fetching assigned routines:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getAssignedRoutines = getAssignedRoutines;
// Obtener detalles de una rutina específica
const getRoutineDetails = async (req, res) => {
    try {
        const { routineId } = req.params;
        const { userId } = req.query;
        const routine = await prisma.routine.findFirst({
            where: {
                id: routineId,
                clientId: userId
            },
            include: {
                trainer: {
                    select: {
                        name: true,
                        trainerProfile: {
                            select: {
                                name: true,
                                specialty: true
                            }
                        }
                    }
                },
                progress: {
                    where: {
                        userId: userId
                    },
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        });
        if (!routine) {
            return res.status(404).json({ error: 'Rutina no encontrada' });
        }
        res.json({ routine });
    }
    catch (error) {
        console.error('Error fetching routine details:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getRoutineDetails = getRoutineDetails;
// Obtener progreso del cliente
const getClientProgress = async (req, res) => {
    try {
        const { userId } = req.params;
        const { routineId, startDate, endDate } = req.query;
        let whereClause = {
            userId: userId
        };
        if (routineId) {
            whereClause.routineId = routineId;
        }
        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        const progress = await prisma.progress.findMany({
            where: whereClause,
            include: {
                routine: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });
        // Calcular métricas de progreso
        const totalSessions = progress.length;
        const completedSessions = progress.filter(p => p.metrics && p.metrics.completed).length;
        const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
        const progressData = {
            totalSessions,
            completedSessions,
            completionRate: Math.round(completionRate),
            recentProgress: progress.slice(0, 10)
        };
        res.json({ progress: progressData });
    }
    catch (error) {
        console.error('Error fetching client progress:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getClientProgress = getClientProgress;
// Obtener estado de pago del cliente
const getClientPaymentStatus = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ message: 'User not authenticated or user ID missing' });
        }
        // Mock data for now - replace with actual payment logic
        const paymentStatus = {
            status: 'up-to-date',
            amount: 15000,
            dueDate: '2024-02-15',
            isUpToDate: true,
            lastPayment: '2024-01-15'
        };
        res.json(paymentStatus);
    }
    catch (error) {
        console.error('Error fetching payment status:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getClientPaymentStatus = getClientPaymentStatus;
// Obtener perfil completo del cliente
const getClientProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({ message: 'User not authenticated or user ID missing' });
        }
        // Usar el userId del parámetro de la URL
        const targetUserId = userId || user.id;
        // Obtener el perfil completo del cliente
        const clientProfile = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                name: true,
                email: true,
                clientProfile: {
                    select: {
                        nickname: true,
                        profileImage: true,
                        weight: true,
                        goals: true,
                        initialObjective: true,
                        trainingDaysPerWeek: true,
                        phone: true,
                        age: true,
                        gender: true,
                        fitnessLevel: true,
                        height: true,
                        medicalConditions: true,
                        medications: true,
                        injuries: true
                    }
                }
            }
        });
        if (!clientProfile) {
            return res.status(404).json({ message: 'Perfil de cliente no encontrado' });
        }
        res.json({
            success: true,
            data: {
                id: clientProfile.id,
                name: clientProfile.name,
                email: clientProfile.email,
                nickname: clientProfile.clientProfile?.nickname,
                profileImage: clientProfile.clientProfile?.profileImage,
                weight: clientProfile.clientProfile?.weight,
                goals: clientProfile.clientProfile?.goals,
                initialObjective: clientProfile.clientProfile?.initialObjective,
                trainingDaysPerWeek: clientProfile.clientProfile?.trainingDaysPerWeek,
                phone: clientProfile.clientProfile?.phone,
                age: clientProfile.clientProfile?.age,
                gender: clientProfile.clientProfile?.gender,
                fitnessLevel: clientProfile.clientProfile?.fitnessLevel,
                height: clientProfile.clientProfile?.height,
                medicalConditions: clientProfile.clientProfile?.medicalConditions,
                medications: clientProfile.clientProfile?.medications,
                injuries: clientProfile.clientProfile?.injuries
            }
        });
    }
    catch (error) {
        console.error('Error fetching client profile:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getClientProfile = getClientProfile;
// Actualizar perfil del cliente (incluyendo imagen, apodo, peso, frecuencia y objetivo)
const updateClientProfile = async (req, res) => {
    try {
        console.log('\n=== UPDATE CLIENT PROFILE REQUEST ===');
        console.log('Params:', req.params);
        console.log('Body:', req.body);
        console.log('User:', req.user);
        const { userId } = req.params;
        const user = req.user;
        const { nickname, profileImage, weight, trainingDaysPerWeek, initialObjective } = req.body;
        if (!user || !user.id) {
            console.log('❌ User not authenticated');
            return res.status(401).json({ message: 'User not authenticated or user ID missing' });
        }
        // Verificar que el usuario puede actualizar este perfil
        const targetUserId = userId || user.id;
        console.log('Target User ID:', targetUserId);
        console.log('Current User ID:', user.id);
        console.log('User Role:', user.role);
        if (user.id !== targetUserId && user.role !== 'ADMIN') {
            console.log('❌ Permission denied');
            return res.status(403).json({ message: 'No tienes permisos para actualizar este perfil' });
        }
        // Preparar datos para actualizar
        const updateData = {};
        if (nickname !== undefined)
            updateData.nickname = nickname;
        if (profileImage !== undefined)
            updateData.profileImage = profileImage;
        if (weight !== undefined)
            updateData.weight = parseFloat(weight.toString());
        if (trainingDaysPerWeek !== undefined)
            updateData.trainingDaysPerWeek = parseInt(trainingDaysPerWeek.toString());
        if (initialObjective !== undefined)
            updateData.initialObjective = initialObjective;
        console.log('Update Data:', updateData);
        // Actualizar el perfil del cliente
        console.log('Updating profile for userId:', targetUserId);
        const updatedProfile = await prisma.clientProfile.update({
            where: { userId: targetUserId },
            data: updateData
        });
        console.log('✅ Profile updated successfully:', updatedProfile);
        console.log('=== END UPDATE CLIENT PROFILE ===\n');
        res.json({
            success: true,
            data: updatedProfile,
            message: 'Perfil actualizado correctamente'
        });
    }
    catch (error) {
        console.error('❌ Error updating client profile:', error);
        console.log('=== END UPDATE CLIENT PROFILE (ERROR) ===\n');
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.updateClientProfile = updateClientProfile;
// Subir imagen de perfil
const uploadProfileImage = async (req, res) => {
    try {
        console.log('🚀 Iniciando uploadProfileImage');
        const { userId } = req.params;
        const user = req.user;
        console.log('👤 Usuario autenticado:', { userId: user?.id, targetUserId: userId, role: user?.role });
        if (!user || !user.id) {
            console.log('❌ Usuario no autenticado');
            return res.status(401).json({ message: 'User not authenticated or user ID missing' });
        }
        // Verificar que el usuario puede subir imagen para este perfil
        const targetUserId = userId || user.id;
        if (user.id !== targetUserId && user.role !== 'ADMIN') {
            console.log('❌ Sin permisos para subir imagen');
            return res.status(403).json({ message: 'No tienes permisos para subir imagen a este perfil' });
        }
        // Verificar que se subió un archivo
        if (!req.file) {
            console.log('❌ No se encontró archivo en la petición');
            return res.status(400).json({ message: 'No se ha subido ningún archivo' });
        }
        console.log('📁 Archivo recibido:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });
        // Subir imagen a Cloudinary
        console.log('☁️ Iniciando subida a Cloudinary...');
        const imageUrl = await (0, cloudinaryService_1.uploadToCloudinary)(req.file);
        console.log('✅ Imagen subida exitosamente:', imageUrl);
        // Eliminar archivo temporal
        if (fs_1.default.existsSync(req.file.path)) {
            console.log('🗑️ Eliminando archivo temporal:', req.file.path);
            fs_1.default.unlinkSync(req.file.path);
        }
        // Actualizar la imagen de perfil
        console.log('💾 Actualizando perfil en base de datos para usuario:', targetUserId);
        const updatedProfile = await prisma.clientProfile.update({
            where: { userId: targetUserId },
            data: { profileImage: imageUrl }
        });
        console.log('✅ Perfil actualizado en BD:', updatedProfile.profileImage);
        const response = {
            success: true,
            data: { profileImage: updatedProfile.profileImage },
            message: 'Imagen de perfil actualizada correctamente'
        };
        console.log('📤 Enviando respuesta:', response);
        res.json(response);
    }
    catch (error) {
        console.error('Error uploading profile image:', error);
        // Limpiar archivo temporal en caso de error
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.uploadProfileImage = uploadProfileImage;
