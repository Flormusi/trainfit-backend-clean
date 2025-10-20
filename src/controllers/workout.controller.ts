import { Request, Response } from 'express';
import prisma from '../models/exercise.model';
import { Exercise } from '../models/exercise.model';

// @desc    Create new workout
// @route   POST /api/workouts
// @access  Private
export const createWorkout = async (req: Request, res: Response) => {
  try {
    const { name, description, type, difficulty, equipment, muscles = [] } = req.body;
    const trainerId = (req as any).user.id;

    const exercise = await prisma.exercise.create({
      data: {
        name,
        description,
        type,
        difficulty,
        equipment,
        muscles,
        trainerId
      }
    });

    res.status(201).json({
      success: true,
      data: exercise
    });
  } catch (error: any) {
    console.error('Error creating workout:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all workouts
// @route   GET /api/workouts
// @access  Private
export const getWorkouts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.type) where.type = req.query.type as string;
    if (req.query.difficulty) where.difficulty = req.query.difficulty as string;
    if ((req as any).user.role === 'TRAINER') where.trainerId = (req as any).user.id;

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.exercise.count({ where })
    ]);

    const pagination: any = {};
    if (skip + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (skip > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: exercises.length,
      pagination,
      data: exercises
    });
  } catch (error: any) {
    console.error('Error getting workouts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
// @desc    Get single workout
// @route   GET /api/workouts/:id
// @access  Private
export const getWorkout = async (req: Request, res: Response) => {
  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: req.params.id }
    });
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error: any) {
    console.error('Error getting workout:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
// @desc    Update workout
// @route   PUT /api/workouts/:id
// @access  Private (Trainer, Admin)
export const updateWorkout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, type, difficulty, equipment, muscles } = req.body;
    const trainerId = (req as any).user.id;

    const exercise = await prisma.exercise.findUnique({
      where: { id }
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    if (exercise.trainerId !== trainerId && (req as any).user.role !== 'ADMIN') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this exercise'
      });
    }

    const updatedExercise = await prisma.exercise.update({
      where: { id },
      data: {
        name,
        description,
        type,
        difficulty,
         equipment,
         muscles
       }
     });

      res.status(200).json({
      success: true,
      data: updatedExercise
    });
  } catch (error: any) {
    console.error('Error updating exercise:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete workout
// @route   DELETE /api/workouts/:id
// @access  Private (Trainer, Admin)
export const deleteWorkout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trainerId = (req as any).user.id;

    const exercise = await prisma.exercise.findUnique({
      where: { id }
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    if (exercise.trainerId !== trainerId && (req as any).user.role !== 'ADMIN') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this exercise'
      });
    }

    await prisma.exercise.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};