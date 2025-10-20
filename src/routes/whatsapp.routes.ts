import { Router } from 'express';
import {
  verifyWebhook,
  handleIncomingMessage,
  sendTestMessage,
  getWhatsAppStatus
} from '../controllers/whatsapp.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * Webhook de verificación de WhatsApp
 * GET /api/whatsapp/webhook
 */
router.get('/webhook', verifyWebhook);

/**
 * Webhook para recibir mensajes de WhatsApp
 * POST /api/whatsapp/webhook
 */
router.post('/webhook', handleIncomingMessage);

/**
 * Enviar mensaje de prueba (solo para desarrollo)
 * POST /api/whatsapp/test-message
 * Requiere autenticación
 */
router.post('/test-message', protect, sendTestMessage);

/**
 * Obtener estado del servicio de WhatsApp
 * GET /api/whatsapp/status
 * Requiere autenticación
 */
router.get('/status', protect, getWhatsAppStatus);

export default router;