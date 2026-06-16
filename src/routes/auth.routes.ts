// src/routes/auth.routes.ts

import { Router } from 'express';
import {
  register,
  login,
  generateInviteToken,
  activateAccount,
  getInviteInfo,
  googleTokenExchange,
} from '../controllers/auth.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/invite/:clientId', protect, authorize([Role.TRAINER]), generateInviteToken);
router.get('/join/:token', getInviteInfo);
router.post('/join/:token', activateAccount);
router.post('/google/token', googleTokenExchange);

export default router;