"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client"); // 👈 Import Role enum
const clientProfile_controller_1 = require("../controllers/clientProfile.controller");
const clientProgress_controller_1 = require("../controllers/clientProgress.controller"); // 👈 Importa el controlador de progreso
const router = express_1.default.Router();
// Middleware para proteger y autorizar solo a clientes
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorize)([client_1.Role.CLIENT])); // Pasando un array con el rol
// Perfil del cliente (get y create/update)
router.route('/profile')
    .get(clientProfile_controller_1.getProfile)
    .post(clientProfile_controller_1.createOrUpdateProfile)
    .put(clientProfile_controller_1.createOrUpdateProfile);
// Otras rutas del cliente
router.get('/routines', clientProfile_controller_1.getAssignedRoutines);
router.get('/workouts', clientProfile_controller_1.getAssignedWorkouts);
router.get('/progress', clientProgress_controller_1.getClientProgress);
// Ruta de prueba
router.get('/test', (req, res) => {
    res.status(200).json({ message: '✅ clientProfile route is working!' });
});
exports.default = router;
