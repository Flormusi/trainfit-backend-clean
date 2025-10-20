import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Progress from '../models/progress.model';
import User from '../models/user.model';

// @desc    Get all progress records for a user
// @route   GET /api/progress
// @access  Private
export const getMyProgress = async (req: Request, res: Response) => {
  try {
    const progress = await Progress.find({ 
      user: (req as any).user.id 
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: progress.length,
      data: progress
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single progress record
// @route   GET /api/progress/:id
// @access  Private
export const getProgressRecord = async (req: Request, res: Response) => {
  try {
    const progress = await Progress.findById(req.params.id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }
    
    // Make sure user owns the progress record or is a trainer for the user
    if (
      progress.user.toString() !== (req as any).user.id &&
      (req as any).user.role !== 'admin' &&
      !(await isTrainerForClient(progress.user, (req as any).user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this progress record'
      });
    }
    
    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Create new progress record
// @route   POST /api/progress
// @access  Private
export const createProgressRecord = async (req: Request, res: Response) => {
  try {
    // Add user to req.body
    req.body.user = (req as any).user.id;
    
    const progress = await Progress.create(req.body);
    
    res.status(201).json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update progress record
// @route   PUT /api/progress/:id
// @access  Private
export const updateProgressRecord = async (req: Request, res: Response) => {
  try {
    let progress = await Progress.findById(req.params.id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }
    
    // Make sure user owns the progress record or is a trainer for the user
    if (
      progress.user.toString() !== (req as any).user.id &&
      (req as any).user.role !== 'admin' &&
      !(await isTrainerForClient(progress.user, (req as any).user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this progress record'
      });
    }
    
    progress = await Progress.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete progress record
// @route   DELETE /api/progress/:id
// @access  Private
export const deleteProgressRecord = async (req: Request, res: Response) => {
  try {
    const progress = await Progress.findById(req.params.id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress record not found'
      });
    }
    
    // Make sure user owns the progress record or is a trainer for the user
    if (
      progress.user.toString() !== (req as any).user.id &&
      (req as any).user.role !== 'admin' &&
      !(await isTrainerForClient(progress.user, (req as any).user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this progress record'
      });
    }
    
    await progress.deleteOne();
    
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

// @desc    Get progress statistics
// @route   GET /api/progress/stats
// @access  Private
export const getProgressStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Get all progress records for the user
    const progressRecords = await Progress.find({ user: userId }).sort({ date: 1 });
    
    if (progressRecords.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          weightChange: null,
          bodyFatChange: null,
          measurementChanges: {},
          recordCount: 0,
          firstRecordDate: null,
          lastRecordDate: null
        }
      });
    }
    
    // Calculate weight change
    const firstWeight = progressRecords[0].weight;
    const lastWeight = progressRecords[progressRecords.length - 1].weight;
    const weightChange = firstWeight && lastWeight ? lastWeight - firstWeight : null;
    
    // Calculate body fat change
    const firstBodyFat = progressRecords[0].bodyFat;
    const lastBodyFat = progressRecords[progressRecords.length - 1].bodyFat;
    const bodyFatChange = firstBodyFat !== undefined && lastBodyFat !== undefined ? 
      lastBodyFat - firstBodyFat : null;
    
    // Calculate measurement changes
    const measurementChanges: Record<string, number | null> = {};
    const measurementKeys = ['chest', 'waist', 'hips', 'thighs', 'arms', 'shoulders'];
    
    measurementKeys.forEach(key => {
      // Define the measurement keys type properly
      type MeasurementKey = 'chest' | 'waist' | 'hips' | 'thighs' | 'arms' | 'shoulders';
      const measurementKey = key as MeasurementKey;
      
      const firstMeasurement = progressRecords[0].measurements?.[measurementKey];
      const lastMeasurement = progressRecords[progressRecords.length - 1].measurements?.[measurementKey];
      
      measurementChanges[key] = firstMeasurement !== undefined && lastMeasurement !== undefined ?
        lastMeasurement - firstMeasurement : null;
    });
    
    res.status(200).json({
      success: true,
      data: {
        weightChange,
        bodyFatChange,
        measurementChanges,
        recordCount: progressRecords.length,
        firstRecordDate: progressRecords[0].date,
        lastRecordDate: progressRecords[progressRecords.length - 1].date
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get progress timeline data
// @route   GET /api/progress/timeline
// @access  Private
export const getProgressTimeline = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { metric = 'weight', startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }
    
    // Build query
    const query: any = { user: userId };
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }
    
    // Get progress records
    const progressRecords = await Progress.find(query).sort({ date: 1 });
    
    // Format data for timeline
    const timelineData = progressRecords.map(record => {
      let value = null;
      
      if (metric === 'weight') {
        value = record.weight;
      } else if (metric === 'bodyFat') {
        value = record.bodyFat;
      } else if (metric?.toString().startsWith('measurements.')) {
        const measurementKey = metric.toString().split('.')[1] as keyof typeof record.measurements;
        value = record.measurements?.[measurementKey];
      }
      
      return {
        date: record.date,
        value
      };
    });
    
    res.status(200).json({
      success: true,
      data: timelineData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update exercise progress (weight, sets, reps)
// @route   POST /api/progress/exercise/:exerciseId
// @access  Private
export const updateExerciseProgress = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const { weight, sets, reps, notes } = req.body;
    const userId = (req as any).user.id;

    // Create or update progress record for this exercise
    const progressData = {
      user: userId,
      exerciseId,
      weight: weight || undefined,
      sets: sets || undefined,
      reps: reps || undefined,
      notes: notes || undefined,
      date: new Date()
    };

    // Find existing progress record for today or create new one
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let progress = await Progress.findOne({
      user: userId,
      exerciseId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (progress) {
      // Update existing record
      progress.weight = weight || progress.weight;
      progress.sets = sets || progress.sets;
      progress.reps = reps || progress.reps;
      progress.notes = notes || progress.notes;
      await progress.save();
    } else {
      // Create new record
      progress = await Progress.create(progressData);
    }

    res.status(200).json({
      success: true,
      message: 'Exercise progress updated successfully',
      data: progress
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Helper function to check if a user is a trainer for a specific client
const isTrainerForClient = async (clientId: mongoose.Schema.Types.ObjectId, trainerId: string): Promise<boolean> => {
  try {
    const client = await User.findById(clientId);
    return client?.trainer?.toString() === trainerId;
  } catch (error) {
    return false;
  }
};