import { Request, Response } from 'express';
import Exercise from '../models/exercise.model';

// @desc    Create new exercise
// @route   POST /api/exercises
// @access  Private/Admin
export const createExercise = async (req: Request, res: Response) => {
  try {
    // Add the creator field from the authenticated user
    const exerciseData = {
      ...req.body,
      createdBy: (req as any).user.id
    };
    
    const exercise = await Exercise.create(exerciseData);

    res.status(201).json({
      success: true,
      data: exercise
    });
  } catch (error: any) {
    console.error('Error creating exercise:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all exercises
// @route   GET /api/exercises
// @access  Private
export const getExercises = async (req: Request, res: Response) => {
  try {
    let query;
    
    // Copy req.query
    const reqQuery = { ...req.query };
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Finding resource
    query = Exercise.find(JSON.parse(queryStr));
    
    // Select Fields
    if (req.query.select) {
      const fields = (req.query.select as string).split(',').join(' ');
      query = query.select(fields);
    }
    
    // Sort
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Exercise.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query
    const exercises = await query;
    
    // Pagination result
    const pagination: any = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: exercises.length,
      pagination,
      data: exercises
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single exercise
// @route   GET /api/exercises/:id
// @access  Private
export const getExercise = async (req: Request, res: Response) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    
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
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update exercise
// @route   PUT /api/exercises/:id
// @access  Private (Trainer, Admin)
export const updateExercise = async (req: Request, res: Response) => {
  try {
    let exercise = await Exercise.findById(req.params.id);
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }
    
    // Make sure user is exercise owner or admin
    if (
      exercise.createdBy.toString() !== (req as any).user.id &&
      (req as any).user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this exercise'
      });
    }
    
    exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete exercise
// @route   DELETE /api/exercises/:id
// @access  Private (Trainer, Admin)
export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }
    
    // Make sure user is exercise owner or admin
    if (
      exercise.createdBy.toString() !== (req as any).user.id &&
      (req as any).user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this exercise'
      });
    }
    
    await exercise.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get exercise categories
// @route   GET /api/exercises/categories
// @access  Private
export const getExerciseCategories = async (req: Request, res: Response) => {
  try {
    const categories = [
      'strength',
      'cardio',
      'flexibility',
      'balance',
      'plyometric'
    ];
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get muscle groups
// @route   GET /api/exercises/muscle-groups
// @access  Private
export const getMuscleGroups = async (req: Request, res: Response) => {
  try {
    const muscleGroups = [
      'chest',
      'back',
      'shoulders',
      'biceps',
      'triceps',
      'forearms',
      'quadriceps',
      'hamstrings',
      'calves',
      'glutes',
      'abs',
      'obliques',
      'lower back',
      'full body'
    ];
    
    res.status(200).json({
      success: true,
      data: muscleGroups
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get equipment types
// @route   GET /api/exercises/equipment
// @access  Private
export const getEquipmentTypes = async (req: Request, res: Response) => {
  try {
    const equipmentTypes = [
      'barbell',
      'dumbbell',
      'kettlebell',
      'resistance bands',
      'cable machine',
      'smith machine',
      'bodyweight',
      'medicine ball',
      'stability ball',
      'foam roller',
      'bench',
      'pull-up bar',
      'treadmill',
      'stationary bike',
      'elliptical',
      'rowing machine',
      'none'
    ];
    
    res.status(200).json({
      success: true,
      data: equipmentTypes
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};