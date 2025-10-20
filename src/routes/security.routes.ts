import { Router } from 'express';
import { getTokenRotations } from '../controllers/security.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Historial de rotaciones de token (solo entrenadores)
router.get('/token-rotations', protect, authorize([Role.TRAINER]), getTokenRotations);

export default router;