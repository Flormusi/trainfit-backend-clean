"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const authenticateToken_1 = require("../middleware/authenticateToken");
const router = (0, express_1.Router)();
// Crear preferencia de pago
router.post('/create-preference', authenticateToken_1.authenticateToken, paymentController_1.createPaymentPreference);
// Webhook de Mercado Pago (sin autenticación)
router.post('/webhook', paymentController_1.handlePaymentWebhook);
// Obtener estado de pago del cliente
router.get('/client/:clientId/status', authenticateToken_1.authenticateToken, paymentController_1.getClientPaymentStatus);
// Actualizar pago del cliente
router.put('/client/:clientId', authenticateToken_1.authenticateToken, paymentController_1.updateClientPayment);
exports.default = router;
