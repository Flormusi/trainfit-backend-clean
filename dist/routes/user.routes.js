"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express")); // Importamos RequestHandler
const auth_middleware_1 = require("../middleware/auth.middleware");
// import User, { IUser } from '../models/user.model'; // Comenta la línea original
const user_model_1 = __importDefault(require("../models/user.model")); // Importa el default por separado
const router = express_1.default.Router();
// Definimos el controlador como una constante tipada con RequestHandler
const getUserByIdHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientId } = req.params;
    console.log(`Solicitud async para obtener datos del cliente ID: ${clientId}`);
    try {
        const user = yield user_model_1.default.findById(clientId);
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        // WARNING: The following is a workaround, not a true fix.
        // It assumes 'user' is indeed an IUser and _id is an ObjectId.
        const userId = user._id;
        res.json({
            id: userId ? userId.toString() : 'unknown_id', // Add a check if userId could be undefined
            name: user.name,
            email: user.email,
        });
    }
    catch (err) {
        console.error('Error al obtener usuario:', err);
        next(err); // Pass error to Express error handler
    }
});
router.use(auth_middleware_1.protect);
// Usamos la constante del controlador definida arriba
router.get('/:clientId', getUserByIdHandler);
exports.default = router;
