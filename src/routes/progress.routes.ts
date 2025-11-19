import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import { getClientProgress } from '../controllers/clientProgress.controller';

const router = express.Router();

// Proteger y autorizar solo clientes
router.use(protect);
router.use(authorize([Role.CLIENT]));

// Ruta principal de progreso del cliente
router.get('/', getClientProgress as express.RequestHandler);

export default router;