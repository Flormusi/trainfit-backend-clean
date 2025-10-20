import { Router } from 'express';
import {
  createPaymentPreference,
  handlePaymentWebhook,
  getClientPaymentStatus,
  updateClientPayment
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

// Crear preferencia de pago
router.post('/create-preference', authenticateToken, createPaymentPreference);

// Webhook de Mercado Pago (sin autenticación)
router.post('/webhook', handlePaymentWebhook);

// Obtener estado de pago del cliente
router.get('/client/:clientId/status', authenticateToken, getClientPaymentStatus);

// Actualizar pago del cliente
router.put('/client/:clientId', authenticateToken, updateClientPayment);

export default router;