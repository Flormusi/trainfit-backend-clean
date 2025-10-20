"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsapp_controller_1 = require("../controllers/whatsapp.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Webhook de verificación de WhatsApp
 * GET /api/whatsapp/webhook
 */
router.get('/webhook', whatsapp_controller_1.verifyWebhook);
/**
 * Webhook para recibir mensajes de WhatsApp
 * POST /api/whatsapp/webhook
 */
router.post('/webhook', whatsapp_controller_1.handleIncomingMessage);
/**
 * Enviar mensaje de prueba (solo para desarrollo)
 * POST /api/whatsapp/test-message
 * Requiere autenticación
 */
router.post('/test-message', auth_middleware_1.protect, whatsapp_controller_1.sendTestMessage);
/**
 * Obtener estado del servicio de WhatsApp
 * GET /api/whatsapp/status
 * Requiere autenticación
 */
router.get('/status', auth_middleware_1.protect, whatsapp_controller_1.getWhatsAppStatus);
exports.default = router;
