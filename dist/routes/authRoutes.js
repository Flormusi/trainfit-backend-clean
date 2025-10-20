"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express")); // Changed this line
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware"); // Asegúrate que protect está importado si lo usas
const router = express_1.default.Router();
// Auth routes
router.post('/register', authController_1.registerUser); // Corrected to use registerUser
router.post('/login', authController_1.login);
router.get('/me', authMiddleware_1.protect, authController_1.getCurrentUser);
router.post('/forgotpassword', authController_1.forgotPassword);
router.put('/updateprofile', authMiddleware_1.protect, authController_1.updateProfile);
exports.default = router;
