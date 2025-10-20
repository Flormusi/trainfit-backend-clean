"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importar funciones del controlador mejorado
const trainer_controller_improved_1 = require("../controllers/trainer.controller.improved");
// Importar el resto de funciones del controlador original
const trainerController_1 = require("../controllers/trainerController");
const client_controller_1 = require("../controllers/client.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const request_middleware_1 = require("../middleware/request.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Log para debug de rutas del entrenador
router.use((req, res, next) => {
    console.log('🎯 trainer.routes.ts - Petición recibida:', req.method, req.path);
    next();
});
// Client management
router.get('/clients', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainer_controller_improved_1.getTrainerClients);
router.post('/clients', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), client_controller_1.addClientByTrainer);
router.get('/clients/:clientId', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), client_controller_1.getClientById);
router.put('/clients/:clientId', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.updateClientInfo);
router.put('/clients/:clientId/payment', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.updateClientPayment);
router.get('/clients/:clientId/payment', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getClientPaymentStatus);
router.get('/clients/:clientId/routines', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), client_controller_1.getClientRoutines);
router.delete('/clients/:clientId', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), client_controller_1.deleteClient);
router.delete('/clients/:clientId/routines/:routineId', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.removeClientRoutine);
router.post('/clients/:clientId/routines/:routineId/resend-email', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.resendRoutineEmail);
router.get('/clients/:clientId/progress', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getClientProgressByTrainer);
router.get('/dashboard', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainer_controller_improved_1.getDashboardData);
// Workout Plans management - ORDEN CORREGIDO
router.get('/workout-plans/unassigned', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getUnassignedWorkoutPlans);
router.get('/workout-plans', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getAllWorkoutPlans);
router.post('/workout-plans', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.createWorkoutPlan);
router.delete('/workout-plans/:id', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.deleteWorkoutPlan);
router.get('/exercises', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainer_controller_improved_1.getExercises);
router.post('/exercises', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainer_controller_improved_1.createExercise);
router.put('/exercises/:id', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.updateExercise);
router.delete('/exercises/:id', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.deleteExercise);
router.get('/routines', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getRoutines);
router.get('/routines/:id', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getRoutineById);
router.post('/routines', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.createClientRoutine);
router.post('/routines/assign', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.assignRoutineToClient);
router.get('/routines/assignments', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getRoutineAssignments);
router.delete('/routines/assignments/:assignmentId', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.removeRoutineAssignment);
router.put('/routines/:id', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.updateRoutine);
router.delete('/routines/:id', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.deleteRoutine);
router.get('/nutrition-plans', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getNutritionPlans);
router.post('/nutrition-plans', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.createNutritionPlan);
router.put('/nutrition-plans/:id', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.updateNutritionPlan);
router.delete('/nutrition-plans/:id', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.deleteNutritionPlan);
router.get('/profile', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getProfile);
router.put('/profile', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.updateProfile);
router.get('/analytics', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainer_controller_improved_1.getAnalytics);
// Obtener notificaciones del cliente
router.get('/notifications', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getClientNotifications);
// Marcar notificación como leída
router.put('/notifications/:notificationId/read', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.markNotificationAsRead);
// Obtener notificaciones no leídas
router.get('/notifications/unread', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.getUnreadNotifications);
// Marcar todas las notificaciones como leídas
router.put('/notifications/mark-all-read', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.markAllNotificationsAsRead);
// Crear notificación de prueba (para testing)
router.post('/notifications/test', auth_middleware_1.protect, request_middleware_1.requestMiddleware, (0, auth_middleware_1.authorize)([client_1.Role.TRAINER]), trainerController_1.createTestNotification);
exports.default = router;
