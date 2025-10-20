import express from 'express';
import {
  createSubscription,
  getUserSubscription,
  cancelSubscription,
  stripeWebhook,
  getPaymentHistory
} from '../controllers/payment.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

// Rutas protegidas
router.use(protect);

// @route   POST /api/payments/create-subscription
router.post('/create-subscription', createSubscription);

// @route   GET /api/payments/subscription
router.get('/subscription', getUserSubscription);

// @route   POST /api/payments/cancel-subscription
router.post('/cancel-subscription', cancelSubscription);

// @route   GET /api/payments/history
router.get('/history', getPaymentHistory);

export default router;