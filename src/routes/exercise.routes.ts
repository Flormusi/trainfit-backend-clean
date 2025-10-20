import express from 'express';
import {
  createExercise,
  getExercises,
  getExercise,
  updateExercise,
  deleteExercise
} from '../controllers/exercise.controller';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router
  .route('/')
  .get(protect, getExercises)
  .post(protect, authorize('trainer', 'admin'), createExercise);

router
  .route('/:id')
  .get(protect, getExercise)
  .put(protect, authorize('trainer', 'admin'), updateExercise)
  .delete(protect, authorize('trainer', 'admin'), deleteExercise);

export default router;