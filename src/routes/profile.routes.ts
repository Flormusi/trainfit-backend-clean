import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import {
  getProfile,
  createOrUpdateProfile
} from '../controllers/clientProfile.controller';

const router = express.Router();

// Rutas para usuarios autenticados (clientes y trainers)
router.use(protect);
router.use(authorize([Role.CLIENT, Role.TRAINER]));

router.route('/')
  .get(getProfile)
  .post(createOrUpdateProfile)
  .put(createOrUpdateProfile);

// Nota: La ruta '/clients' y el handler getClientProfiles provenían de legacy y se eliminan
// para evitar dependencias de módulos excluidos. Si se requiere, podemos reimplementarla
// con Prisma en controllers modernos.

export default router;