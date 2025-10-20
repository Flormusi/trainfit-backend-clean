"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
router.get('/:clientId', authMiddleware_1.protect, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.clientId).select('name email role');
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return; // Add explicit return to make it void
        }
        res.json(user);
        // No explicit return here, so it's implicitly void for this path
    }
    catch (error) {
        console.error('Error al obtener el usuario:', error);
        res.status(500).json({ message: 'Error del servidor' });
        // No explicit return here, implicitly void for this path too
    }
});
exports.default = router;
