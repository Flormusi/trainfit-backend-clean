import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import clientProfileRoutes from './clientProfile.routes';
import clientProgressRoutes from './clientProgress.routes';
import clientStatsRoutes from './clientStats.routes';
import userRoutes from './user.routes';
import trainerRoutes from './trainer.routes';
import routineRoutes from './routine.routes';
import routineTemplateRoutes from './routineTemplate.routes';
import routineScheduleRoutes from './routineSchedule.routes';
import messageRoutes from './messageRoutes';
import appointmentRoutes from './appointmentRoutes';
import reminderRoutes from './reminderRoutes';
import paymentRoutes from './paymentRoutes';
import paymentReminderRoutes from './paymentReminderRoutes';
import webhookRoutes from './webhook.routes';
import whatsappRoutes from './whatsapp.routes';
import calendarRoutes from './calendarRoutes';
import calendarApiRoutes from './calendar';
import securityRoutes from './security.routes';

const router = Router();

// Log para debug - verificar si las peticiones llegan al enrutador
router.use((req, res, next) => {
    console.log(`[ROUTER DEBUG] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/clients/profile', clientProfileRoutes);
router.use('/clients/progress', clientProgressRoutes);
router.use('/clients/stats', clientStatsRoutes);
router.use('/users', userRoutes);
router.use('/trainer', trainerRoutes);
router.use('/routines', routineRoutes);
router.use('/routine-templates', routineTemplateRoutes);
router.use('/routine-schedule', routineScheduleRoutes);
router.use('/messages', messageRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/reminders', reminderRoutes);
router.use('/payments', paymentRoutes);
router.use('/payment-reminders', paymentReminderRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/calendar', calendarRoutes);
router.use('/calendar-api', calendarApiRoutes);
router.use('/security', securityRoutes);

export default router;