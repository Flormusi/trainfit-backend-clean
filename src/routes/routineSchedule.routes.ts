import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getRoutineSchedules,
  createRoutineSchedule,
  updateRoutineSchedule,
  deleteRoutineSchedule
} from '../controllers/routineSchedule.controller';

const router = Router();

// Proteger todas las rutas
router.use(protect);

// GET /api/routine-schedule - Obtener todas las rutinas programadas
router.get('/', getRoutineSchedules);

// POST /api/routine-schedule - Crear nueva rutina programada
router.post('/', createRoutineSchedule);

// PUT /api/routine-schedule/:id - Actualizar rutina programada
router.put('/:id', updateRoutineSchedule);

// DELETE /api/routine-schedule/:id - Eliminar rutina programada
router.delete('/:id', deleteRoutineSchedule);

export default router;