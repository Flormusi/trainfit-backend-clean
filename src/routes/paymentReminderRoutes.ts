import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authenticateToken';
import { CronService } from '../services/cronService';
import { EmailService } from '../services/emailService';
import { NotificationService } from '../services/notificationService';

const router = express.Router();
const prisma = new PrismaClient();

// Enviar recordatorio de pago manual (para entrenadores)
router.post('/send-manual-reminder/:clientId', authenticateToken, async (req: any, res) => {
  try {
    const { clientId } = req.params;
    const trainerId = req.user.id;

    // Verificar que el entrenador tiene acceso al cliente
    const trainerClient = await prisma.trainerClient.findFirst({
      where: {
        trainerId,
        clientId
      }
    });

    if (!trainerClient) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este cliente'
      });
    }

    // Obtener información del cliente
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        clientProfile: true,
        subscription: true
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Obtener información del entrenador
    const trainer = await prisma.user.findUnique({
      where: { id: trainerId },
      include: {
        trainerProfile: true
      }
    });

    const trainerName = trainer?.trainerProfile?.name || trainer?.name || 'tu entrenador';
    const clientName = client.clientProfile?.name || client.name || 'Cliente';

    // Enviar email de recordatorio
    const emailSent = await EmailService.sendPaymentReminderEmail(
      client.email,
      clientName,
      trainerName
    );

    if (emailSent) {
      // Crear notificación para el cliente
      await NotificationService.createNotification({
        userId: clientId,
        title: 'Recordatorio de pago',
        message: `Tu entrenador ${trainerName} te ha enviado un recordatorio de pago. Por favor, revisa tu email y realiza el pago correspondiente.`,
        type: 'payment_reminder'
      });

      // Crear notificación para el entrenador
      await NotificationService.createNotification({
        userId: trainerId,
        title: 'Recordatorio enviado',
        message: `Recordatorio de pago enviado exitosamente a ${clientName}`,
        type: 'system'
      });

      res.json({
        success: true,
        message: 'Recordatorio de pago enviado exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar el recordatorio por email'
      });
    }

  } catch (error) {
    console.error('Error enviando recordatorio manual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Probar sistema de recordatorios automáticos (solo para desarrollo)
router.post('/test-automatic-reminders', authenticateToken, async (req: any, res) => {
  try {
    // Solo permitir a administradores o en modo desarrollo
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Endpoint no disponible en producción'
      });
    }

    await CronService.testPaymentReminders();

    res.json({
      success: true,
      message: 'Prueba de recordatorios automáticos ejecutada'
    });

  } catch (error) {
    console.error('Error en prueba de recordatorios:', error);
    res.status(500).json({
      success: false,
      message: 'Error ejecutando prueba de recordatorios'
    });
  }
});

// Obtener notificaciones del usuario (cliente o entrenador)
router.get('/notifications', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const whereClause: any = { userId };
    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const totalCount = await prisma.notification.count({
      where: whereClause
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: {
        notifications,
        totalCount,
        unreadCount,
        hasMore: (parseInt(offset as string) + notifications.length) < totalCount
      }
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo notificaciones'
    });
  }
});

// Marcar notificación como leída
router.patch('/notifications/:notificationId/read', authenticateToken, async (req: any, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando notificación como leída'
    });
  }
});

// Marcar todas las notificaciones como leídas
router.patch('/notifications/mark-all-read', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });

  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando notificaciones como leídas'
    });
  }
});

// Crear suscripción de prueba para un cliente (solo para desarrollo)
router.post('/create-test-subscription/:clientId', authenticateToken, async (req: any, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Endpoint no disponible en producción'
      });
    }

    const { clientId } = req.params;
    const { daysUntilDue = 3 } = req.body;

    // Calcular fechas
    const now = new Date();
    const dueDate = new Date(now.getTime() + (parseInt(daysUntilDue) * 24 * 60 * 60 * 1000));
    const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 días atrás

    // Crear o actualizar suscripción
    const subscription = await prisma.subscription.upsert({
      where: { userId: clientId },
      update: {
        currentPeriodStart: startDate,
        currentPeriodEnd: dueDate,
        status: 'ACTIVE'
      },
      create: {
        userId: clientId,
        plan: 'BASIC',
        status: 'ACTIVE',
        currentPeriodStart: startDate,
        currentPeriodEnd: dueDate
      }
    });

    res.json({
      success: true,
      message: `Suscripción de prueba creada. Vence en ${daysUntilDue} días`,
      data: subscription
    });

  } catch (error) {
    console.error('Error creando suscripción de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando suscripción de prueba'
    });
  }
});

export default router;