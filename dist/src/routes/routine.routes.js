"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const routine_controller_1 = require("../controllers/routine.controller");
const routineTemplate_controller_1 = require("../controllers/routineTemplate.controller");
const router = (0, express_1.Router)();
// Ruta de prueba sin middleware
router.get('/test', (req, res) => {
    console.log('🧪 Ruta de prueba funcionando correctamente');
    res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
});
// Ruta para generar plantillas por objetivo
router.post('/templates', auth_middleware_1.protect, routineTemplate_controller_1.generateRoutineTemplate);
// Ruta para obtener detalles de rutina (accesible para clientes)
router.get('/:id', auth_middleware_1.protect, routine_controller_1.getRoutineDetailsForClient);
exports.default = router;
