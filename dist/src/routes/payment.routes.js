"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_controller_1 = require("../controllers/payment.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Rutas protegidas
router.use(auth_1.protect);
// @route   POST /api/payments/create-subscription
router.post('/create-subscription', payment_controller_1.createSubscription);
// @route   GET /api/payments/subscription
router.get('/subscription', payment_controller_1.getUserSubscription);
// @route   POST /api/payments/cancel-subscription
router.post('/cancel-subscription', payment_controller_1.cancelSubscription);
// @route   GET /api/payments/history
router.get('/history', payment_controller_1.getPaymentHistory);
exports.default = router;
