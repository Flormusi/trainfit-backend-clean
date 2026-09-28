import { Request, Response } from 'express';

import { uploadToCloudinary } from '../services/cloudinaryService';
import fs from 'fs';

import prisma from '../utils/prisma';

// Obtener notificaciones del cliente
export const getClientNotifications = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error fetching client notifications:");
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener contador de notificaciones no leídas
export const getUnreadNotificationsCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const count = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread notifications count:");
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error marking notification as read:");
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error marking all notifications as read:");
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener rutinas asignadas al cliente
export const getAssignedRoutines = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error fetching assigned routines:");
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener detalles de una rutina específica
export const getRoutineDetails = async (req: Request, res: Response) => {
  try {
    const { routineId } = req.params;
    const { userId } = req.query;
    
    const routine = await prisma.routine.findFirst({
      where: {
        id: routineId,
        clientId: userId as string
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
            userId: userId as string
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
  } catch (error) {
    console.error("Error fetching routine details:");
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener progreso del cliente
export const getClientProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { routineId, startDate, endDate } = req.query;
    
    let whereClause: any = {
      userId: userId
    };
    
    if (routineId) {
      whereClause.routineId = routineId as string;
    }
    
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
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
    const completedSessions = progress.filter(p => p.metrics && (p.metrics as any).completed).length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    const progressData = {
      totalSessions,
      completedSessions,
      completionRate: Math.round(completionRate),
      recentProgress: progress.slice(0, 10)
    };
    
    res.json({ progress: progressData });
  } catch (error) {
    console.error("Error fetching client progress:");
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estado de pago del cliente
export const getClientPaymentStatus = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error fetching payment status:");
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener perfil completo del cliente
export const getClientProfile = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Error fetching client profile:");
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar perfil del cliente (incluyendo imagen, apodo, peso, frecuencia y objetivo)
export const updateClientProfile = async (req: Request, res: Response) => {
  try {




    
    const { userId } = req.params;
    const user = req.user;
    const { nickname, profileImage, weight, trainingDaysPerWeek, initialObjective } = req.body;
    
    if (!user || !user.id) {

      return res.status(401).json({ message: 'User not authenticated or user ID missing' });
    }

    // Verificar que el usuario puede actualizar este perfil
    const targetUserId = userId || user.id;



    
    if (user.id !== targetUserId && user.role !== 'ADMIN') {

      return res.status(403).json({ message: 'No tienes permisos para actualizar este perfil' });
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (weight !== undefined) updateData.weight = parseFloat(weight.toString());
    if (trainingDaysPerWeek !== undefined) updateData.trainingDaysPerWeek = parseInt(trainingDaysPerWeek.toString());
    if (initialObjective !== undefined) updateData.initialObjective = initialObjective;



    // Actualizar el perfil del cliente

    const updatedProfile = await prisma.clientProfile.update({
      where: { userId: targetUserId },
      data: updateData
    });




    res.json({
      success: true,
      data: updatedProfile,
      message: 'Perfil actualizado correctamente'
    });
  } catch (error) {
    console.error("❌ Error updating client profile:");

    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Subir imagen de perfil
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {

    const { userId } = req.params;
    const user = req.user;
    

    
    if (!user || !user.id) {

      return res.status(401).json({ message: 'User not authenticated or user ID missing' });
    }

    // Verificar que el usuario puede subir imagen para este perfil
    const targetUserId = userId || user.id;
    if (user.id !== targetUserId && user.role !== 'ADMIN') {

      return res.status(403).json({ message: 'No tienes permisos para subir imagen a este perfil' });
    }

    // Verificar que se subió un archivo
    if (!req.file) {

      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }



    // Subir imagen a Cloudinary

    const imageUrl = await uploadToCloudinary(req.file);


    // Eliminar archivo temporal
    if (fs.existsSync(req.file.path)) {

      fs.unlinkSync(req.file.path);
    }

    // Actualizar la imagen de perfil

    const updatedProfile = await prisma.clientProfile.update({
      where: { userId: targetUserId },
      data: { profileImage: imageUrl }
    });


    const response = {
      success: true,
      data: { profileImage: updatedProfile.profileImage },
      message: 'Imagen de perfil actualizada correctamente'
    };

    res.json(response);
  } catch (error) {
     console.error("Error uploading profile image:");
     
     // Limpiar archivo temporal en caso de error
     if (req.file && fs.existsSync(req.file.path)) {
       fs.unlinkSync(req.file.path);
     }
     
     res.status(500).json({ error: 'Error interno del servidor' });
   }
 };