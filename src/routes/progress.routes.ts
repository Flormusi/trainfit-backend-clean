import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getMyProgress,
  getProgressRecord,
  createProgressRecord,
  updateProgressRecord,
  deleteProgressRecord,
  getProgressStats,
  getProgressTimeline,
  updateExerciseProgress
} from '../controllers/progress.controller';

const router = express.Router();

// All routes are protected
router.use(protect);

// Stats and timeline routes
router.get('/stats', getProgressStats);
router.get('/timeline', getProgressTimeline);

// CRUD routes
router.route('/')
  .get(getMyProgress)
  .post(createProgressRecord);

router.route('/:id')
  .get(getProgressRecord)
  .put(updateProgressRecord)
  .delete(deleteProgressRecord);

// Exercise progress route
router.post('/exercise/:exerciseId', updateExerciseProgress);

export default router;