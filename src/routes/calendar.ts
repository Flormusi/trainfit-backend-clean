import express from 'express';
import { CalendarService } from '../services/calendarService';
import { icsService } from '../services/icsService';
import { EmailService } from '../services/emailService';
import { protect } from '../middleware/auth.middleware';
import { 
  validateCalendarEvent, 
  validateOAuthParams, 
  validateSyncParams, 
  validateEventQuery 
} from '../middleware/validation';
import { 
  validateOAuthToken, 
  validateCalendarWritePermissions, 
  validateCalendarReadPermissions,
  sanitizeCalendarEventData,
  oauthRateLimit
} from '../middleware/oauthSecurity';

const router = express.Router();
const calendarService = new CalendarService();

/**
 * @route   POST /api/calendar-api/events
 * @desc    Crear evento de entrenamiento y enviar invitación
 * @access  Private
 */
router.post('/events', 
  protect, 
  oauthRateLimit(),
  validateCalendarEvent, 
  sanitizeCalendarEventData,
  validateOAuthToken,
  validateCalendarWritePermissions,
  async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, type, clientEmail } = req.body;
    const trainerId = req.user?.id;

    if (!trainerId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Crear evento de entrenamiento
    const event = {
      id: `training_${Date.now()}`,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      clientId: req.calendarIntegration.clientId,
      clientName: req.calendarIntegration.email || 'Cliente',
      clientEmail,
      trainerId,
      type: type as 'entrenamiento' | 'consulta' | 'evaluacion' | 'nutricion'
    };

    // Generar archivo .ics
    const icsContent = icsService.generateICSFile(event);
    
    // Enviar invitación por email
    await EmailService.sendCalendarInvitation(event);

    res.json({
      success: true,
      message: 'Evento creado y invitación enviada',
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate
      }
    });

  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   GET /api/calendar-api/download/:eventId
 * @desc    Descargar archivo .ics de un evento
 * @access  Private
 */
router.get('/download/:eventId', 
  protect,
  validateCalendarReadPermissions,
  async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Crear evento de ejemplo (en producción obtener de BD)
    const event = {
      id: eventId,
      title: 'Sesión de Entrenamiento',
      description: 'Entrenamiento personalizado',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 60 * 1000),
      location: 'Gimnasio',
      type: 'entrenamiento' as const,
      clientId: req.user?.id || '',
      clientName: 'Cliente',
      clientEmail: 'cliente@example.com',
      trainerId: req.user?.id || ''
    };

    const icsContent = icsService.generateICSFile(event);

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${eventId}.ics"`);
    res.send(icsContent);

  } catch (error) {
    console.error('Error generando archivo .ics:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando archivo de calendario'
    });
  }
});

/**
 * @route   POST /api/calendar-api/sync/google
 * @desc    Sincronizar con Google Calendar
 * @access  Private
 */
router.post('/sync/google', 
  protect, 
  oauthRateLimit(),
  validateSyncParams,
  validateOAuthToken,
  validateCalendarWritePermissions,
  async (req, res) => {
  try {
    const { eventId, title, description, startDate, endDate, location } = req.body;
    const trainerId = req.user?.id;

    if (!trainerId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const event = {
      id: eventId,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      type: 'entrenamiento' as const,
      clientId: req.calendarIntegration.clientId,
      clientName: req.calendarIntegration.email || 'Cliente',
      clientEmail: req.calendarIntegration.email || '',
      trainerId
    };

    // Sincronizar con Google Calendar
    const result = await calendarService.syncWithGoogleCalendar(event);

    res.json({
      success: true,
      message: 'Evento sincronizado con Google Calendar',
      googleEventId: result?.googleEventId || null,
      eventLink: result?.eventLink || null
    });

  } catch (error) {
    console.error('Error sincronizando con Google Calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Error sincronizando con Google Calendar'
    });
  }
});

/**
 * @route   POST /api/calendar-api/resend/:eventId
 * @desc    Reenviar invitación de calendario
 * @access  Private
 */
router.post('/resend/:eventId', 
  protect,
  oauthRateLimit(),
  validateOAuthToken,
  async (req, res) => {
  try {
    const { eventId } = req.params;
    const { customMessage } = req.body;
    const trainerId = req.user?.id;

    if (!trainerId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Crear evento de ejemplo (en producción obtener de BD)
    const event = {
      id: eventId,
      title: 'Sesión de Entrenamiento',
      description: 'Entrenamiento personalizado',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 60 * 1000),
      location: 'Gimnasio',
      type: 'entrenamiento' as const,
      clientId: req.calendarIntegration.clientId,
      clientName: req.calendarIntegration.email || 'Cliente',
      clientEmail: req.calendarIntegration.email || '',
      trainerId
    };

    await calendarService.sendCalendarInvitation(event, customMessage);

    res.json({
      success: true,
      message: 'Invitación reenviada exitosamente'
    });

  } catch (error) {
    console.error('Error reenviando invitación:', error);
    res.status(500).json({
      success: false,
      message: 'Error reenviando invitación'
    });
  }
});

/**
 * @route   GET /api/calendar-api/oauth/google/url
 * @desc    Obtener URL de autorización de Google
 * @access  Private
 */
router.get('/oauth/google/url', protect, async (req, res) => {
  try {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || '')}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}&` +
      `access_type=offline&` +
      `prompt=consent`;

    res.json({
      success: true,
      authUrl
    });

  } catch (error) {
    console.error('Error generando URL de autorización:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando URL de autorización'
    });
  }
});

/**
 * @route   POST /api/calendar-api/oauth/google/callback
 * @desc    Manejar callback de OAuth de Google
 * @access  Private
 */
router.post('/oauth/google/callback', 
  protect, 
  validateOAuthParams, 
  async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Aquí implementarías el intercambio del código por tokens
    // const tokens = await exchangeCodeForTokens(code);
    // await saveCalendarIntegration(userId, tokens);

    res.json({
      success: true,
      message: 'Integración con Google Calendar configurada exitosamente'
    });

  } catch (error) {
    console.error('Error en callback OAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Error configurando integración con Google Calendar'
    });
  }
});

/**
 * @route   GET /api/calendar-api/events
 * @desc    Obtener eventos de calendario
 * @access  Private
 */
router.get('/events', 
  protect, 
  validateEventQuery,
  validateCalendarReadPermissions,
  async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    // Aquí implementarías la lógica para obtener eventos
    const events = []; // Placeholder

    res.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo eventos de calendario'
    });
  }
});

export default router;