"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const clientStats_controller_1 = require("../controllers/clientStats.controller");
const router = express_1.default.Router();
// Protegemos la ruta para clientes
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorize)('client'));
router.get('/stats', clientStats_controller_1.getClientStats);
exports.default = router;
