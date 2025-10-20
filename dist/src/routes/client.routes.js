"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/client.routes.ts
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const client_controller_1 = require("../controllers/client.controller");
const clientController_1 = require("../controllers/clientController");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// Rutas activas
router.get('/routines', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT, client_1.Role.TRAINER]), async (req, res, next) => {
    const typedReq = req;
    try {
        await (0, client_controller_1.getClientRoutines)(typedReq, res);
    }
    catch (error) {
        next(error);
    }
});
// Ruta para agregar cliente por entrenador
router.post('/add-by-trainer', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), async (req, res, next) => {
    const typedReq = req;
    try {
        await (0, client_controller_1.addClientByTrainer)(typedReq, res);
    }
    catch (error) {
        next(error);
    }
});
// Rutas de notificaciones para clientes
router.get('/:userId/notifications', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.getClientNotifications);
router.get('/:userId/notifications/unread-count', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.getUnreadNotificationsCount);
router.put('/notifications/:notificationId/read', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.markNotificationAsRead);
router.put('/:userId/notifications/mark-all-read', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.markAllNotificationsAsRead);
// Rutas adicionales para el dashboard del cliente
router.get('/:userId/assigned-routines', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.getAssignedRoutines);
router.get('/routines/:routineId/details', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.getRoutineDetails);
router.get('/:userId/progress', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.getClientProgress);
router.get('/:userId/payment-status', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.getClientPaymentStatus);
router.get('/:userId/profile', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.getClientProfile);
router.put('/:userId/profile', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), clientController_1.updateClientProfile);
// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
    console.log('🚨 Error en middleware de multer:', err);
    if (err instanceof Error) {
        if (err.message === 'Solo se permiten archivos de imagen') {
            return res.status(400).json({ message: 'Solo se permiten archivos de imagen' });
        }
        if (err.message.includes('File too large')) {
            return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 5MB.' });
        }
    }
    return res.status(400).json({ message: 'Error al procesar el archivo' });
};
router.post('/:userId/profile/upload-image', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), (req, res, next) => {
    console.log('🎯 Llegó a la ruta de upload-image');
    upload_middleware_1.upload.single('profileImage')(req, res, (err) => {
        if (err) {
            console.log('❌ Error en multer:', err);
            return handleMulterError(err, req, res, next);
        }
        console.log('✅ Multer procesó correctamente, pasando al controlador');
        (0, clientController_1.uploadProfileImage)(req, res);
    });
});
// Ruta de prueba para verificar token y rol
router.get('/test', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT, client_1.Role.TRAINER]), async (req, res, next) => {
    const typedReq = req;
    try {
        res.status(200).json({
            message: '✅ client routes are working!',
            user: {
                id: typedReq.user?.id,
                role: typedReq.user?.role
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Ruta para eliminar cliente
router.delete('/:clientId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), async (req, res, next) => {
    const typedReq = req;
    try {
        await (0, client_controller_1.deleteClient)(typedReq, res);
    }
    catch (error) {
        next(error);
    }
});
// Ruta para obtener estado de pago del cliente
router.get('/payment-status', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), async (req, res, next) => {
    const typedReq = req;
    try {
        await (0, client_controller_1.getPaymentStatus)(typedReq, res);
    }
    catch (error) {
        next(error);
    }
});
// Ruta para eliminar rutina asignada (solo clientes)
router.delete('/routines/:routineId', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), async (req, res, next) => {
    const typedReq = req;
    try {
        await (0, client_controller_1.deleteAssignedRoutine)(typedReq, res);
    }
    catch (error) {
        next(error);
    }
});
// Ruta para enviar rutina mensual por email
router.post('/send-monthly-routine', auth_middleware_1.protect, (0, auth_middleware_1.authorize)([client_1.Role.CLIENT]), async (req, res, next) => {
    const typedReq = req;
    try {
        await (0, client_controller_1.sendMonthlyRoutineEmail)(typedReq, res);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
