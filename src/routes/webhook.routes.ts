import express from 'express';
import { stripeWebhook } from '../controllers/payment.controller';

const router = express.Router();

// Webhook de Stripe (sin autenticación)
// @route   POST /api/webhooks/stripe
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;