import { Router } from 'express';
// Importar funciones del controlador mejorado
import {
  getDashboardData,
  getExercises,
  createExercise,
  getTrainerClients,
  getAnalytics,
  getChartsData
} from '../controllers/trainerController';

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
} from '../controllers/trainerController';
import { addClientByTrainer, getClientById, getClientRoutines } from '../controllers/client.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { requestMiddleware } from '../middleware/request.middleware';
import { Role } from '@prisma/client';
import { RequestWithUser } from '../types/express';

const router = Router();

// Client management
router.get('/clients', protect, requestMiddleware, authorize([Role.TRAINER]), getTrainerClients);
router.post('/clients', protect, requestMiddleware, authorize([Role.TRAINER]), addClientByTrainer);
router.get('/clients/:clientId', protect, requestMiddleware, authorize([Role.TRAINER]), getClientById);
router.put('/clients/:clientId', protect, requestMiddleware, authorize([Role.TRAINER]), updateClientInfo);
router.get('/clients/:clientId/routines', protect, requestMiddleware, authorize([Role.TRAINER]), getClientRoutines);
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
router.get('/analytics/charts', protect, requestMiddleware, authorize([Role.TRAINER]), getChartsData);

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

// Migración one-time: importar clientRpe existentes al log con fecha actual
router.post('/migrate-rpe-logs', protect, requestMiddleware, authorize([Role.TRAINER]), async (req: any, res: any) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Obtener todas las rutinas de los clientes del trainer
    const trainerClients = await prisma.trainerClient.findMany({ where: { trainerId: req.user.id } });
    const clientIds = trainerClients.map((tc: any) => tc.clientId);

    const routines = await prisma.routine.findMany({
      where: { clientId: { in: clientIds } }
    });

    let imported = 0;
    for (const routine of routines) {
      const exercises = Array.isArray(routine.exercises) ? routine.exercises as any[] : [];
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        if (ex.clientRpe !== undefined && ex.clientRpe !== null && ex.clientRpe !== '') {
          const id = `${routine.clientId}-${routine.id}-${i}-${year}-${month}`;
          await (prisma as any).exerciseRpeLog.upsert({
            where: { id },
            update: {},
            create: {
              id,
              clientId: routine.clientId,
              routineId: routine.id,
              exerciseIndex: i,
              exerciseName: ex.name || '',
              rpe: Number(ex.clientRpe),
              month,
              year,
            }
          });
          imported++;
        }
      }
    }

    res.json({ success: true, imported });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// RPE logs de un cliente
router.get('/clients/:clientId/rpe-logs', protect, requestMiddleware, authorize([Role.TRAINER]), async (req: any, res: any) => {
  try {
    const { clientId } = req.params;
    const { year, month } = req.query;

    const where: any = { clientId };
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);

    const logs = await prisma.exerciseRpeLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
    });

    // Métricas por mes
    const byMonth: Record<string, { month: number; year: number; avgRpe: number; count: number }> = {};
    logs.forEach((log: any) => {
      const key = `${log.year}-${log.month}`;
      if (!byMonth[key]) byMonth[key] = { month: log.month, year: log.year, avgRpe: 0, count: 0 };
      byMonth[key].avgRpe += log.rpe;
      byMonth[key].count++;
    });
    Object.values(byMonth).forEach((m: any) => { m.avgRpe = Math.round((m.avgRpe / m.count) * 10) / 10; });

    // Métricas por ejercicio (promedio histórico)
    const byExercise: Record<string, { name: string; avgRpe: number; count: number; lastRpe: number }> = {};
    logs.forEach((log: any) => {
      const key = `${log.routineId}-${log.exerciseIndex}`;
      if (!byExercise[key]) byExercise[key] = { name: log.exerciseName, avgRpe: 0, count: 0, lastRpe: log.rpe };
      byExercise[key].avgRpe += log.rpe;
      byExercise[key].count++;
    });
    Object.values(byExercise).forEach((e: any) => { e.avgRpe = Math.round((e.avgRpe / e.count) * 10) / 10; });

    res.json({
      success: true,
      data: {
        logs,
        byMonth: Object.values(byMonth).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month),
        byExercise: Object.values(byExercise).sort((a, b) => b.avgRpe - a.avgRpe),
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Datos de cobro del trainer
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

router.get('/payment-info', protect, requestMiddleware, authorize([Role.TRAINER]), async (req: any, res: any) => {
  const profile = await prisma.trainerProfile.findUnique({ where: { userId: req.user.id } });
  res.json({ success: true, data: { mpLink: profile?.mpLink, cbu: profile?.cbu, alias: profile?.alias, bankName: profile?.bankName, monthlyFee: profile?.monthlyFee } });
});

router.put('/payment-info', protect, requestMiddleware, authorize([Role.TRAINER]), async (req: any, res: any) => {
  const { mpLink, cbu, alias, bankName, monthlyFee } = req.body;
  const profile = await prisma.trainerProfile.update({
    where: { userId: req.user.id },
    data: { mpLink: mpLink || null, cbu: cbu || null, alias: alias || null, bankName: bankName || null, monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null }
  });
  res.json({ success: true, data: profile });
});

// El alumno consulta los datos de cobro de su trainer
router.get('/my-trainer-payment-info', protect, authorize([Role.CLIENT]), async (req: any, res: any) => {
  const trainerClient = await prisma.trainerClient.findFirst({ where: { clientId: req.user.id } });
  if (!trainerClient) return res.status(404).json({ success: false, message: 'No tenés entrenador asignado' });
  const profile = await prisma.trainerProfile.findUnique({ where: { userId: trainerClient.trainerId } });
  res.json({ success: true, data: { mpLink: profile?.mpLink, cbu: profile?.cbu, alias: profile?.alias, bankName: profile?.bankName, monthlyFee: profile?.monthlyFee } });
});

export default router;