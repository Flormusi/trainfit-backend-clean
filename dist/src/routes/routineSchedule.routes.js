"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const routineSchedule_controller_1 = require("../controllers/routineSchedule.controller");
const router = (0, express_1.Router)();
// Proteger todas las rutas
router.use(auth_middleware_1.protect);
// GET /api/routine-schedule - Obtener todas las rutinas programadas
router.get('/', routineSchedule_controller_1.getRoutineSchedules);
// POST /api/routine-schedule - Crear nueva rutina programada
router.post('/', routineSchedule_controller_1.createRoutineSchedule);
// PUT /api/routine-schedule/:id - Actualizar rutina programada
router.put('/:id', routineSchedule_controller_1.updateRoutineSchedule);
// DELETE /api/routine-schedule/:id - Eliminar rutina programada
router.delete('/:id', routineSchedule_controller_1.deleteRoutineSchedule);
exports.default = router;
