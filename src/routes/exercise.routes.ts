import express from 'express';
import {
  createWorkout as createExercise,
  getWorkouts as getExercises,
  getWorkout as getExercise,
  updateWorkout as updateExercise,
  deleteWorkout as deleteExercise
} from '../controllers/workout.controller';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router
  .route('/')
  .get(protect, getExercises)
  .post(protect, authorize('TRAINER', 'ADMIN'), createExercise);

router
  .route('/:id')
  .get(protect, getExercise)
  .put(protect, authorize('TRAINER', 'ADMIN'), updateExercise)
  .delete(protect, authorize('TRAINER', 'ADMIN'), deleteExercise);

export default router;