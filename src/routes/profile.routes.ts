import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getProfile,
  createProfile,
  updateProfile,
  getClientProfiles
} from '../controllers/profile.controller';

const router = express.Router();

// Routes for all authenticated users
router.route('/')
  .get(protect, getProfile)
  .post(protect, createProfile)
  .put(protect, updateProfile);

// Routes for trainers only
router.get('/clients', protect, authorize('trainer', 'admin'), getClientProfiles);

export default router;