"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class NotificationService {
    // Crear una nueva notificación
    static async createNotification(data) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId: data.userId,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    routineId: data.routineId,
                    isRead: false
                }
            });
            console.log('Notificación creada:', notification);
            return notification;
        }
        catch (error) {
            console.error('Error creando notificación:', error);
            throw error;
        }
    }
    // Notificación cuando se asigna una rutina a un cliente
    static async notifyRoutineAssigned(trainerId, clientName, routineName, routineId) {
        return this.createNotification({
            userId: trainerId,
            title: 'Rutina asignada',
            message: `Has asignado la rutina "${routineName}" a ${clientName}`,
            type: 'routine_assigned',
            routineId
        });
    }
    // Notificación cuando un cliente actualiza su progreso
    static async notifyProgressUpdate(trainerId, clientName, exerciseName) {
        return this.createNotification({
            userId: trainerId,
            title: 'Progreso actualizado',
            message: `${clientName} ha registrado progreso en ${exerciseName}`,
            type: 'progress_update'
        });
    }
    // Notificación cuando se registra un nuevo cliente
    static async notifyNewClient(trainerId, clientName, clientEmail) {
        return this.createNotification({
            userId: trainerId,
            title: 'Nuevo cliente',
            message: `${clientName} (${clientEmail}) se ha registrado como tu cliente`,
            type: 'new_client'
        });
    }
    // Notificación de recordatorio de pago
    static async notifyPaymentReminder(trainerId, clientName, daysOverdue) {
        return this.createNotification({
            userId: trainerId,
            title: 'Recordatorio de pago',
            message: `${clientName} tiene ${daysOverdue} días de retraso en el pago`,
            type: 'payment_reminder'
        });
    }
    // Notificación cuando un cliente alcanza un objetivo
    static async notifyGoalAchieved(trainerId, clientName, goalDescription) {
        return this.createNotification({
            userId: trainerId,
            title: '¡Objetivo alcanzado!',
            message: `${clientName} ha alcanzado su objetivo: ${goalDescription}`,
            type: 'goal_achieved'
        });
    }
    // Obtener notificaciones no leídas para un usuario
    static async getUnreadNotifications(userId) {
        try {
            const notifications = await prisma.notification.findMany({
                where: {
                    userId,
                    isRead: false
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return notifications;
        }
        catch (error) {
            console.error('Error obteniendo notificaciones no leídas:', error);
            throw error;
        }
    }
    // Marcar todas las notificaciones como leídas
    static async markAllAsRead(userId) {
        try {
            await prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });
            return { success: true, message: 'Todas las notificaciones marcadas como leídas' };
        }
        catch (error) {
            console.error('Error marcando notificaciones como leídas:', error);
            throw error;
        }
    }
    // Eliminar notificaciones antiguas (más de 30 días)
    static async cleanupOldNotifications() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const deletedCount = await prisma.notification.deleteMany({
                where: {
                    createdAt: {
                        lt: thirtyDaysAgo
                    },
                    isRead: true
                }
            });
            console.log(`Eliminadas ${deletedCount.count} notificaciones antiguas`);
            return deletedCount;
        }
        catch (error) {
            console.error('Error limpiando notificaciones antiguas:', error);
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
