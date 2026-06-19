import { Router } from 'express';
import {
  createPaymentPreference,
  handlePaymentWebhook,
  getClientPaymentStatus,
  updateClientPayment,
  getMyPaymentHistory,
  registerMyPayment,
  getClientPaymentHistory
} from '../legacy/paymentController';
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

// Historial de pagos del cliente autenticado
router.get('/my-history', authenticateToken, getMyPaymentHistory);

// El cliente registra cómo pagó
router.post('/my-payment', authenticateToken, registerMyPayment);

// El trainer ve el historial de pagos de un cliente
router.get('/client/:clientId/history', authenticateToken, getClientPaymentHistory);

export default router;
