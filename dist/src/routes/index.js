"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const client_routes_1 = __importDefault(require("./client.routes"));
const clientProfile_routes_1 = __importDefault(require("./clientProfile.routes"));
const clientProgress_routes_1 = __importDefault(require("./clientProgress.routes"));
const clientStats_routes_1 = __importDefault(require("./clientStats.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const trainer_routes_1 = __importDefault(require("./trainer.routes"));
const routine_routes_1 = __importDefault(require("./routine.routes"));
const routineTemplate_routes_1 = __importDefault(require("./routineTemplate.routes"));
const routineSchedule_routes_1 = __importDefault(require("./routineSchedule.routes"));
const messageRoutes_1 = __importDefault(require("./messageRoutes"));
const appointmentRoutes_1 = __importDefault(require("./appointmentRoutes"));
const reminderRoutes_1 = __importDefault(require("./reminderRoutes"));
const paymentRoutes_1 = __importDefault(require("./paymentRoutes"));
const paymentReminderRoutes_1 = __importDefault(require("./paymentReminderRoutes"));
const webhook_routes_1 = __importDefault(require("./webhook.routes"));
const whatsapp_routes_1 = __importDefault(require("./whatsapp.routes"));
const router = (0, express_1.Router)();
// Log para debug - verificar si las peticiones llegan al enrutador
router.use((req, res, next) => {
    console.log(`[ROUTER DEBUG] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});
// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
router.use('/auth', auth_routes_1.default);
router.use('/clients', client_routes_1.default);
router.use('/clients/profile', clientProfile_routes_1.default);
router.use('/clients/progress', clientProgress_routes_1.default);
router.use('/clients/stats', clientStats_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/trainer', trainer_routes_1.default);
router.use('/routines', routine_routes_1.default);
router.use('/routine-templates', routineTemplate_routes_1.default);
router.use('/routine-schedule', routineSchedule_routes_1.default);
router.use('/messages', messageRoutes_1.default);
router.use('/appointments', appointmentRoutes_1.default);
router.use('/reminders', reminderRoutes_1.default);
router.use('/payments', paymentRoutes_1.default);
router.use('/payment-reminders', paymentReminderRoutes_1.default);
router.use('/webhooks', webhook_routes_1.default);
router.use('/whatsapp', whatsapp_routes_1.default);
exports.default = router;
