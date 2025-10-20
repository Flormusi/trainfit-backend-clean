"use strict";
// src/routes/auth.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// Rutas de autenticación
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
// router.get('/me', protect, getMe); // Comentado
// router.post('/forgotpassword', forgotPassword); // Comentado
// router.put('/resetpassword/:resettoken', resetPassword); // Comentado
// router.put('/updateprofile', protect, updateProfile); // Comentado
exports.default = router;
