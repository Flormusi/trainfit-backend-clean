"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_controller_ts_1 = require("../src/controllers/client.controller.ts");
const profile_controller_ts_1 = require("../src/controllers/profile.controller.ts");
const auth_middleware_1 = require("../src/middleware/auth.middleware");
const router = express_1.default.Router();
// Rutas para la gestión de clientes por parte de un entrenador
router.route('/')
    .get(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(['trainer', 'ADMIN']), client_controller_ts_1.getClients); // MODIFICADO: Sin '...'
// Nueva ruta para que un entrenador agregue un cliente
router.post('/add-by-trainer', auth_middleware_1.protect, (0, auth_middleware_1.authorize)(['trainer']), client_controller_ts_1.addClientByTrainer); // MODIFICADO: Sin '...' y 'trainer' en minúscula
router.route('/:clientId')
    .get(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(['trainer', 'ADMIN']), client_controller_ts_1.getClient); // MODIFICADO: Sin '...'
router.route('/:clientId/notes')
    .put(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(['trainer']), client_controller_ts_1.updateClientNotes); // MODIFICADO: Sin '...'
router.route('/:clientId/assign-workout')
    .post(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(['trainer']), client_controller_ts_1.assignWorkout); // MODIFICADO: Sin '...'
// Rutas para el perfil del cliente
router.route('/:clientId/profile')
    .get(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(['trainer', 'ADMIN', 'CLIENT']), profile_controller_ts_1.getProfile) // MODIFICADO: Sin '...'
    .put(auth_middleware_1.protect, (0, auth_middleware_1.authorize)(['trainer', 'ADMIN', 'CLIENT']), profile_controller_ts_1.updateProfile); // MODIFICADO: Sin '...'
exports.default = router;
