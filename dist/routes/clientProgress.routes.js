"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const clientProgress_controller_1 = require("../controllers/clientProgress.controller");
const router = express_1.default.Router();
// ✅ Proteger todas las rutas
router.use(auth_middleware_1.protect);
// ✅ Asegurarse que solo los clientes accedan
router.use((0, auth_middleware_1.authorize)('client'));
// ✅ Ruta para obtener el progreso del cliente
router.get('/progress', clientProgress_controller_1.getClientProgress);
exports.default = router;
