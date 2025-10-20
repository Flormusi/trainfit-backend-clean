"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("../controllers/payment.controller");
const router = express_1.default.Router();
// Webhook de Stripe (sin autenticación)
// @route   POST /api/webhooks/stripe
router.post('/stripe', express_1.default.raw({ type: 'application/json' }), payment_controller_1.stripeWebhook);
exports.default = router;
