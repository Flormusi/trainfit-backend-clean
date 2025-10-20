import express from 'express';
import {
  createWorkout,
  getWorkouts,
  getWorkout,
  updateWorkout,
  deleteWorkout
} from '../controllers/workout.controller';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router
  .route('/')
  .get(protect, getWorkouts)
  .post(protect, authorize('trainer', 'admin'), createWorkout);

router
  .route('/:id')
  .get(protect, getWorkout)
  .put(protect, authorize('trainer', 'admin'), updateWorkout)
  .delete(protect, authorize('trainer', 'admin'), deleteWorkout);

export default router;