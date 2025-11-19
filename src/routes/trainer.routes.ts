import { Router } from 'express';
// Importar funciones del controlador mejorado
import {
  getDashboardData,
  getExercises,
  createExercise,
  getTrainerClients,
  getAnalytics
} from '../controllers/trainer.controller.improved';

// Importar el resto de funciones del controlador original
import {
  getUnassignedWorkoutPlans,
  getAllWorkoutPlans,
  createWorkoutPlan,
  deleteWorkoutPlan,
  updateExercise,
  deleteExercise,
  getRoutines,
  getRoutineById,
  createClientRoutine as createRoutine,
  updateRoutine,
  deleteRoutine,
  assignRoutineToClient,
  getRoutineAssignments,
  removeRoutineAssignment,
  removeClientRoutine,
  resendRoutineEmail,
  updateClientInfo,
  updateClientPayment,
  getClientPaymentStatus,
  getNutritionPlans,
  createNutritionPlan,
  updateNutritionPlan,
  deleteNutritionPlan,
  getProfile,
  updateProfile,
  getClientNotifications,
  markNotificationAsRead,
  getClientProgressByTrainer,
  markAllNotificationsAsRead,
  getUnreadNotifications,
  createTestNotification
} from '../legacy/trainerController';
import { addClientByTrainer, getClientById, getClientRoutines, deleteClient } from '../controllers/client.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { requestMiddleware } from '../middleware/request.middleware';
import { Role } from '@prisma/client';
import { RequestWithUser } from '../types/express';

const router = Router();

// Log para debug de rutas del entrenador
router.use((req, res, next) => {
  console.log('🎯 trainer.routes.ts - Petición recibida:', req.method, req.path);
  next();
});

// Client management
router.get('/clients', protect, requestMiddleware, authorize([Role.TRAINER]), getTrainerClients);
router.post('/clients', protect, requestMiddleware, authorize([Role.TRAINER]), addClientByTrainer);
router.get('/clients/:clientId', protect, requestMiddleware, authorize([Role.TRAINER]), getClientById);
router.put('/clients/:clientId', protect, requestMiddleware, authorize([Role.TRAINER]), updateClientInfo);
router.put('/clients/:clientId/payment', protect, requestMiddleware, authorize([Role.TRAINER]), updateClientPayment);
router.get('/clients/:clientId/payment', protect, requestMiddleware, authorize([Role.TRAINER]), getClientPaymentStatus);
router.get('/clients/:clientId/routines', protect, requestMiddleware, authorize([Role.TRAINER]), getClientRoutines);
router.delete('/clients/:clientId', protect, requestMiddleware, authorize([Role.TRAINER]), deleteClient);
router.delete('/clients/:clientId/routines/:routineId', protect, requestMiddleware, authorize([Role.TRAINER]), removeClientRoutine);
router.post('/clients/:clientId/routines/:routineId/resend-email', protect, requestMiddleware, authorize([Role.TRAINER]), resendRoutineEmail);
router.get('/clients/:clientId/progress', protect, requestMiddleware, authorize([Role.TRAINER]), getClientProgressByTrainer);

router.get('/dashboard', protect, requestMiddleware, authorize([Role.TRAINER]), getDashboardData);

// Workout Plans management - ORDEN CORREGIDO
router.get('/workout-plans/unassigned', protect, requestMiddleware, authorize([Role.TRAINER]), getUnassignedWorkoutPlans);
router.get('/workout-plans', protect, requestMiddleware, authorize([Role.TRAINER]), getAllWorkoutPlans);
router.post('/workout-plans', protect, requestMiddleware, authorize([Role.TRAINER]), createWorkoutPlan);
router.delete('/workout-plans/:id', protect, requestMiddleware, authorize([Role.TRAINER]), deleteWorkoutPlan);

router.get('/exercises', protect, requestMiddleware, authorize([Role.TRAINER]), getExercises);
router.post('/exercises', protect, requestMiddleware, authorize([Role.TRAINER]), createExercise);
router.put('/exercises/:id', protect, requestMiddleware, authorize([Role.TRAINER]), updateExercise);
router.delete('/exercises/:id', protect, requestMiddleware, authorize([Role.TRAINER]), deleteExercise);

router.get('/routines', protect, requestMiddleware, authorize([Role.TRAINER]), getRoutines);
router.get('/routines/:id', protect, requestMiddleware, authorize([Role.TRAINER]), getRoutineById);
router.post('/routines', protect, requestMiddleware, authorize([Role.TRAINER]), createRoutine);
router.post('/routines/assign', protect, requestMiddleware, authorize([Role.TRAINER]), assignRoutineToClient);
router.get('/routines/assignments', protect, requestMiddleware, authorize([Role.TRAINER]), getRoutineAssignments);
router.delete('/routines/assignments/:assignmentId', protect, requestMiddleware, authorize([Role.TRAINER]), removeRoutineAssignment);
router.put('/routines/:id', protect, requestMiddleware, authorize([Role.TRAINER]), updateRoutine);
router.delete('/routines/:id', protect, requestMiddleware, authorize([Role.TRAINER]), deleteRoutine);

router.get('/nutrition-plans', protect, requestMiddleware, authorize([Role.TRAINER]), getNutritionPlans);
router.post('/nutrition-plans', protect, requestMiddleware, authorize([Role.TRAINER]), createNutritionPlan);
router.put('/nutrition-plans/:id', protect, requestMiddleware, authorize([Role.TRAINER]), updateNutritionPlan);
router.delete('/nutrition-plans/:id', protect, requestMiddleware, authorize([Role.TRAINER]), deleteNutritionPlan);

router.get('/profile', protect, requestMiddleware, authorize([Role.TRAINER]), getProfile);
router.put('/profile', protect, requestMiddleware, authorize([Role.TRAINER]), updateProfile);

router.get('/analytics', protect, requestMiddleware, authorize([Role.TRAINER]), getAnalytics);

// Obtener notificaciones del cliente
router.get('/notifications', protect, requestMiddleware, authorize([Role.TRAINER]), getClientNotifications);

// Marcar notificación como leída
router.put('/notifications/:notificationId/read', protect, requestMiddleware, authorize([Role.TRAINER]), markNotificationAsRead);

// Obtener notificaciones no leídas
router.get('/notifications/unread', protect, requestMiddleware, authorize([Role.TRAINER]), getUnreadNotifications);

// Marcar todas las notificaciones como leídas
router.put('/notifications/mark-all-read', protect, requestMiddleware, authorize([Role.TRAINER]), markAllNotificationsAsRead);

// Crear notificación de prueba (para testing)
router.post('/notifications/test', protect, requestMiddleware, authorize([Role.TRAINER]), createTestNotification);

export default router;