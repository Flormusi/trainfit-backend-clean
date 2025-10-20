"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/client.routes.ts
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_controller_1 = require("../controllers/client.controller");
const router = express_1.default.Router();
// Aplicar middleware de protección
router.use(auth_middleware_1.protect);
// Permitir acceso a clientes y entrenadores
router.use((0, auth_middleware_1.authorize)('client', 'trainer'));
// Rutas para clientes
router.get('/workouts', client_controller_1.getClientWorkouts);
router.get('/routines', client_controller_1.getClientRoutines);
router.get('/dashboard', client_controller_1.getClientDashboardData);
router.get('/progress', client_controller_1.getClientDashboardProgress);
router.get('/stats', client_controller_1.getClientStats); // Añadir esta ruta
// Ruta de prueba
router.get('/test', (req, res) => {
    // Añadir información del usuario para depuración
    res.status(200).json({
        message: '✅ client routes are working!',
        user: {
            id: req.user._id,
            role: req.user.role
        }
    });
});
exports.default = router;
