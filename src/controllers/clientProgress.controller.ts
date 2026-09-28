import { Request, Response } from 'express';


import prisma from '../utils/prisma';

// ✅ Get client progress
export const getClientProgress = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }



    const progress = await prisma.progress.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
      include: {
        routine: true
      }
    });

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    console.error("💥 Error al obtener progreso:");
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};