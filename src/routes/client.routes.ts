// routes/client.routes.ts
import express, { Response, NextFunction, Request } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { getClientRoutines, addClientByTrainer, deleteClient, getPaymentStatus, sendMonthlyRoutineEmail, deleteAssignedRoutine } from '../controllers/client.controller';
import { getClientNotifications, getUnreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead, uploadProfileImage } from '../legacy/clientController';
import { getAssignedRoutines, getProfile as getClientProfile, createOrUpdateProfile as updateClientProfile } from '../controllers/clientProfile.controller';
import { getClientProgress } from '../controllers/clientProgress.controller';
import { getRoutineDetailsForClient as getRoutineDetails } from '../controllers/routine.controller';
import { RequestWithUser } from '../types/express';
import { Role } from '@prisma/client';

const router = express.Router();

// Rutas activas
router.get('/routines', protect, authorize([Role.CLIENT, Role.TRAINER]), async (req: Request<any, any, any, any>, res: Response, next: NextFunction): Promise<void> => {
  const typedReq = req as RequestWithUser;
  try {
    await getClientRoutines(typedReq, res);
  } catch (error) {
    next(error);
  }
});

// Ruta para agregar cliente por entrenador
router.post('/add-by-trainer', protect, authorize([Role.TRAINER]), async (req: Request<any, any, any, any>, res: Response, next: NextFunction): Promise<void> => {
  const typedReq = req as RequestWithUser;
  try {
    await addClientByTrainer(typedReq, res);
  } catch (error) {
    next(error);
  }
});

// Rutas de notificaciones para clientes
router.get('/:userId/notifications', protect, authorize([Role.CLIENT]), getClientNotifications);
router.get('/:userId/notifications/unread-count', protect, authorize([Role.CLIENT]), getUnreadNotificationsCount);
router.put('/notifications/:notificationId/read', protect, authorize([Role.CLIENT]), markNotificationAsRead);
router.put('/:userId/notifications/mark-all-read', protect, authorize([Role.CLIENT]), markAllNotificationsAsRead);

// Rutas adicionales para el dashboard del cliente
router.get('/:userId/assigned-routines', protect, authorize([Role.CLIENT]), getAssignedRoutines);
router.get('/routines/:id/details', protect, authorize([Role.CLIENT]), getRoutineDetails);
router.get('/:userId/progress', protect, authorize([Role.CLIENT]), getClientProgress);
// Usar el handler actual basado en Prisma para estado de pago
router.get('/:userId/payment-status', protect, authorize([Role.CLIENT]), getPaymentStatus);
router.get('/:userId/profile', protect, authorize([Role.CLIENT]), getClientProfile);
router.put('/:userId/profile', protect, authorize([Role.CLIENT]), updateClientProfile);
// Middleware para manejar errores de multer
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
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

router.post('/:userId/profile/upload-image', protect, authorize([Role.CLIENT]), (req: Request, res: Response, next: NextFunction) => {
  console.log('🎯 Llegó a la ruta de upload-image');
  upload.single('profileImage')(req, res, (err: any) => {
    if (err) {
      console.log('❌ Error en multer:', err);
      return handleMulterError(err, req, res, next);
    }
    console.log('✅ Multer procesó correctamente, pasando al controlador');
    uploadProfileImage(req, res);
  });
});

// Ruta de prueba para verificar token y rol
router.get('/test', protect, authorize([Role.CLIENT, Role.TRAINER]), async (req: Request<any, any, any, any>, res: Response, next: NextFunction): Promise<void> => {
  const typedReq = req as RequestWithUser;
  try {
    res.status(200).json({
      message: '✅ client routes are working!',
      user: {
        id: typedReq.user?.id,
        role: typedReq.user?.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Ruta para eliminar cliente
router.delete('/:clientId', protect, authorize([Role.TRAINER]), async (req: Request<any, any, any, any>, res: Response, next: NextFunction): Promise<void> => {
  const typedReq = req as RequestWithUser;
  try {
    await deleteClient(typedReq, res);
  } catch (error) {
    next(error);
  }
});

// Ruta para obtener estado de pago del cliente
router.get('/payment-status', protect, authorize([Role.CLIENT]), async (req: Request<any, any, any, any>, res: Response, next: NextFunction): Promise<void> => {
  const typedReq = req as RequestWithUser;
  try {
    await getPaymentStatus(typedReq, res);
  } catch (error) {
    next(error);
  }
});

// Ruta para eliminar rutina asignada (solo clientes)
router.delete('/routines/:routineId', protect, authorize([Role.CLIENT]), async (req: Request<any, any, any, any>, res: Response, next: NextFunction): Promise<void> => {
  const typedReq = req as RequestWithUser;
  try {
    await deleteAssignedRoutine(typedReq, res);
  } catch (error) {
    next(error);
  }
});

// Ruta para enviar rutina mensual por email
router.post('/send-monthly-routine', protect, authorize([Role.CLIENT]), async (req: Request<any, any, any, any>, res: Response, next: NextFunction): Promise<void> => {
  const typedReq = req as RequestWithUser;
  try {
    await sendMonthlyRoutineEmail(typedReq, res);
  } catch (error) {
    next(error);
  }
});

export default router;