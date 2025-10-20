import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { getClientProgress } from '../controllers/clientProgress.controller';
import { Role } from '@prisma/client';

const router = express.Router();

// ✅ Proteger todas las rutas
router.use(protect);
// ✅ Asegurarse que solo los clientes accedan
router.use(authorize([Role.CLIENT]));

// ✅ Ruta para obtener el progreso del cliente
router.get('/progress', getClientProgress as express.RequestHandler);

export default router;