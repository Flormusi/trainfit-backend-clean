import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import { getClientStats } from '../controllers/clientStats.controller';

const router = express.Router();

// Protegemos la ruta para clientes
router.use(protect);
router.use(authorize([Role.CLIENT]));

router.get('/stats', getClientStats);

export default router;