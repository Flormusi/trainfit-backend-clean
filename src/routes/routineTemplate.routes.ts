import { Router } from 'express';
import {
  getRoutineTemplates,
  getRoutineTemplateById,
  createRoutineTemplate,
  updateRoutineTemplate,
  deleteRoutineTemplate,
  duplicateRoutineTemplate,
  getPresetRoutine
} from '../controllers/routineTemplate.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Rutas públicas (solo lectura)
router.get('/', getRoutineTemplates);
router.get('/preset', getPresetRoutine); // Nueva ruta para rutinas prediseñadas
router.get('/:id', getRoutineTemplateById);

// Rutas protegidas (requieren autenticación)
router.post('/', protect, createRoutineTemplate);
router.put('/:id', protect, updateRoutineTemplate);
router.delete('/:id', protect, deleteRoutineTemplate);
router.post('/:id/duplicate', protect, duplicateRoutineTemplate);

export default router;