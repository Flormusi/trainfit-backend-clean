import express from 'express';
import { 
  initiateGoogleAuth, 
  handleGoogleCallback, 
  getCalendarIntegrationStatus, 
  disconnectCalendarIntegration 
} from '../controllers/calendarController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

// Rutas para Google Calendar OAuth
router.get('/google/auth', authenticateToken, initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Rutas para gestión de integraciones
router.get('/integration/status', authenticateToken, getCalendarIntegrationStatus);
router.delete('/integration/:provider', authenticateToken, disconnectCalendarIntegration);

// TODO: Implementar rutas para Outlook y iCloud
// router.get('/outlook/auth', authenticateToken, initiateOutlookAuth);
// router.get('/outlook/callback', handleOutlookCallback);
// router.get('/icloud/auth', authenticateToken, initiateICloudAuth);
// router.get('/icloud/callback', handleICloudCallback);

export default router;