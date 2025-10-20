"use strict";
// src/routes/auth.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Rutas de autenticación
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.get('/me', auth_middleware_1.protect, auth_controller_1.getMe);
router.post('/forgotpassword', auth_controller_1.forgotPassword);
router.put('/resetpassword/:resettoken', auth_controller_1.resetPassword);
router.put('/updateprofile', auth_middleware_1.protect, auth_controller_1.updateProfile);
exports.default = router;
