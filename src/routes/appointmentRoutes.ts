import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authenticateToken';
import { CalendarService } from '../services/calendarService';

const router = express.Router();
const prisma = new PrismaClient();
const calendarService = new CalendarService();

// Obtener todas las citas del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, status } = req.query;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const whereClause: any = {
      OR: [
        { clientId: userId },
        { trainerId: userId }
      ]
    };

    // Filtros opcionales
    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            clientProfile: {
              select: { name: true, phone: true }
            }
          }
        },
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            trainerProfile: {
              select: { name: true, specialty: true }
            }
          }
        },
        reminders: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nueva cita
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      clientId, 
      trainerId, 
      location, 
      notes,
      createReminders = true
    } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Título, fecha de inicio y fin son requeridos' });
    }

    // Determinar clientId y trainerId basado en el rol del usuario
    let finalClientId = clientId;
    let finalTrainerId = trainerId;

    if (userRole === 'TRAINER') {
      finalTrainerId = userId;
      if (!clientId) {
        return res.status(400).json({ message: 'ID del cliente es requerido' });
      }
    } else if (userRole === 'CLIENT') {
      finalClientId = userId;
      if (!trainerId) {
        return res.status(400).json({ message: 'ID del entrenador es requerido' });
      }
    }

    // Verificar que no haya conflictos de horario
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          { trainerId: finalTrainerId },
          { clientId: finalClientId }
        ],
        AND: [
          {
            OR: [
              {
                startTime: {
                  lte: new Date(startTime)
                },
                endTime: {
                  gt: new Date(startTime)
                }
              },
              {
                startTime: {
                  lt: new Date(endTime)
                },
                endTime: {
                  gte: new Date(endTime)
                }
              }
            ]
          }
        ],
        status: {
          not: 'CANCELLED'
        }
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({ message: 'Ya existe una cita en ese horario' });
    }

    // Crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        clientId: finalClientId,
        trainerId: finalTrainerId,
        location,
        notes
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            clientProfile: { select: { name: true, phone: true } }
          }
        },
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            trainerProfile: { select: { name: true, specialty: true } }
          }
        }
      }
    });

    // Crear recordatorios automáticos si se solicita
    if (createReminders) {
      const appointmentDate = new Date(startTime);
      
      // Recordatorio 24 horas antes
      const reminder24h = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
      // Recordatorio 1 hora antes
      const reminder1h = new Date(appointmentDate.getTime() - 60 * 60 * 1000);

      await prisma.reminder.createMany({
        data: [
          {
            title: `Recordatorio: ${title}`,
            message: `Tienes una cita mañana: ${title}`,
            reminderTime: reminder24h,
            reminderType: 'APPOINTMENT',
            userId: finalClientId,
            appointmentId: appointment.id
          },
          {
            title: `Recordatorio: ${title}`,
            message: `Tu cita comienza en 1 hora: ${title}`,
            reminderTime: reminder1h,
            reminderType: 'APPOINTMENT',
            userId: finalClientId,
            appointmentId: appointment.id
          },
          {
            title: `Recordatorio: ${title}`,
            message: `Tienes una cita mañana con tu cliente: ${title}`,
            reminderTime: reminder24h,
            reminderType: 'APPOINTMENT',
            userId: finalTrainerId,
            appointmentId: appointment.id
          }
        ]
      });
    }

    // Sincronización automática con calendarios
    try {
      const trainingEvent = {
        id: appointment.id,
        title: appointment.title,
        description: appointment.description || 'Entrenamiento programado desde TrainFit',
        startDate: appointment.startTime,
        endDate: appointment.endTime,
        location: appointment.location || 'Por definir',
        clientId: appointment.clientId,
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        trainerId: appointment.trainerId,
        type: 'entrenamiento' as const
      };

      // Verificar si el cliente tiene integración de calendario
      const integration = await calendarService.hasCalendarIntegration(appointment.clientId);
      
      await calendarService.processTrainingEvent(trainingEvent, integration || undefined);
      console.log('✅ Evento sincronizado automáticamente con calendario');
    } catch (calendarError) {
      console.error('⚠️ Error en sincronización de calendario (no crítico):', calendarError);
      // No interrumpimos el flujo principal si falla la sincronización
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar cita
router.put('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const appointmentId = req.params.appointmentId;
    const { title, description, startTime, endTime, status, location, notes } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Verificar que el usuario tiene permisos para modificar la cita
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [
          { clientId: userId },
          { trainerId: userId }
        ]
      }
    });

    if (!existingAppointment) {
      return res.status(404).json({ message: 'Cita no encontrada o sin permisos' });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (status) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            clientProfile: { select: { name: true, phone: true } }
          }
        },
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            trainerProfile: { select: { name: true, specialty: true } }
          }
        }
      }
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Cancelar cita
router.delete('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const appointmentId = req.params.appointmentId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Verificar permisos
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [
          { clientId: userId },
          { trainerId: userId }
        ]
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada o sin permisos' });
    }

    // Marcar como cancelada en lugar de eliminar
    const cancelledAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' }
    });

    // Desactivar recordatorios relacionados
    await prisma.reminder.updateMany({
      where: { appointmentId: appointmentId },
      data: { isActive: false }
    });

    res.json({ message: 'Cita cancelada exitosamente', appointment: cancelledAppointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener disponibilidad del entrenador
router.get('/trainer/:trainerId/availability', authenticateToken, async (req, res) => {
  try {
    const trainerId = req.params.trainerId;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Fecha es requerida' });
    }

    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        trainerId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        startTime: true,
        endTime: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;