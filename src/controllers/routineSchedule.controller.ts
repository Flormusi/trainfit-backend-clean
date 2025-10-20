import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RequestWithUser } from '../types/express';

const prisma = new PrismaClient();

// GET /api/routine-schedule - Obtener todas las rutinas programadas
export const getRoutineSchedules = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Obtener citas/rutinas programadas del usuario
    const routineSchedules = await prisma.appointment.findMany({
      where: {
        OR: [
          { trainerId: userId },
          { clientId: userId }
        ]
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json(routineSchedules);
  } catch (error) {
    console.error('Error obteniendo rutinas programadas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/routine-schedule - Crear nueva rutina programada
export const createRoutineSchedule = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      clientId,
      location,
      notes
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Validar campos requeridos
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos: title, startTime, endTime' 
      });
    }

    // Crear la cita/rutina programada
    const routineSchedule = await prisma.appointment.create({
      data: {
        title,
        description: description || '',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        trainerId: userId,
        clientId: clientId || userId,
        location: location || '',
        notes: notes || ''
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(routineSchedule);
  } catch (error) {
    console.error('Error creando rutina programada:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/routine-schedule/:id - Actualizar rutina programada
export const updateRoutineSchedule = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      clientId,
      location,
      notes
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Verificar que la cita existe y pertenece al usuario
    const existingSchedule = await prisma.appointment.findFirst({
      where: {
        id,
        OR: [
          { trainerId: userId },
          { clientId: userId }
        ]
      }
    });

    if (!existingSchedule) {
      return res.status(404).json({ message: 'Rutina programada no encontrada' });
    }

    // Actualizar la cita/rutina programada
    const updatedSchedule = await prisma.appointment.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(clientId !== undefined && { clientId }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes })
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error actualizando rutina programada:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/routine-schedule/:id - Eliminar rutina programada
export const deleteRoutineSchedule = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Verificar que la cita existe y pertenece al usuario
    const existingSchedule = await prisma.appointment.findFirst({
      where: {
        id,
        OR: [
          { trainerId: userId },
          { clientId: userId }
        ]
      }
    });

    if (!existingSchedule) {
      return res.status(404).json({ message: 'Rutina programada no encontrada' });
    }

    // Eliminar la cita/rutina programada
    await prisma.appointment.delete({
      where: { id }
    });

    res.json({ message: 'Rutina programada eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando rutina programada:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};