"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routineTemplate_controller_1 = require("../controllers/routineTemplate.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Rutas públicas (solo lectura)
router.get('/', routineTemplate_controller_1.getRoutineTemplates);
router.get('/:id', routineTemplate_controller_1.getRoutineTemplateById);
// Rutas protegidas (requieren autenticación)
router.post('/', auth_1.protect, routineTemplate_controller_1.createRoutineTemplate);
router.put('/:id', auth_1.protect, routineTemplate_controller_1.updateRoutineTemplate);
router.delete('/:id', auth_1.protect, routineTemplate_controller_1.deleteRoutineTemplate);
router.post('/:id/duplicate', auth_1.protect, routineTemplate_controller_1.duplicateRoutineTemplate);
exports.default = router;
