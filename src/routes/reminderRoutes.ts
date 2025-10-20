import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
const prisma = new PrismaClient();

// Obtener recordatorios del usuario
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.user.id },
      orderBy: { reminderTime: 'asc' }
    });

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error al obtener recordatorios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo recordatorio
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { title, message, reminderType, reminderTime, appointmentId } = req.body;

    const reminder = await prisma.reminder.create({
      data: {
        title,
        message,
        reminderType,
        reminderTime: new Date(reminderTime),
        userId: req.user.id,
        appointmentId: appointmentId || null
      }
    });

    res.status(201).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Error al crear recordatorio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Marcar recordatorio como enviado
router.patch('/:id/sent', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const reminder = await prisma.reminder.update({
      where: { 
        id,
        userId: req.user.id 
      },
      data: { 
        isSent: true
      }
    });

    res.json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Error al actualizar recordatorio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar recordatorio
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    await prisma.reminder.delete({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    res.json({
      success: true,
      message: 'Recordatorio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar recordatorio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;