import { Request, Response } from 'express';
import { google } from 'googleapis';
import { CalendarIntegrationModel } from '../models/CalendarIntegration';
import { RequestWithUser } from '../types/express';

// Configuración OAuth para Google Calendar
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5002/api/calendar/google/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email'
];

/**
 * Iniciar proceso de autenticación OAuth con Google Calendar
 */
export const initiateGoogleAuth = async (req: RequestWithUser, res: Response) => {
  try {
    const clientId = req.user?.id;
    if (!clientId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ message: 'Configuración OAuth incompleta' });
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: clientId // Pasamos el clientId en el state para identificar al usuario
    });

    res.json({
      success: true,
      authUrl,
      message: 'Redirige al usuario a esta URL para autorizar el acceso'
    });
  } catch (error) {
    console.error('Error iniciando autenticación Google:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Manejar callback de Google OAuth
 */
export const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const clientId = state as string;

    if (!code || !clientId) {
      return res.status(400).json({ message: 'Código de autorización o estado faltante' });
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      return res.status(400).json({ message: 'Tokens inválidos recibidos' });
    }

    // Obtener información del usuario de Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Calcular fecha de expiración
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    // Guardar integración en la base de datos
    await CalendarIntegrationModel.create({
      clientId,
      provider: 'google',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      scope: SCOPES.join(' '),
      email: userInfo.data.email || undefined
    });

    // Redirigir al frontend con éxito
    res.redirect(`${process.env.FRONTEND_URL}/calendar-integration?success=true&provider=google`);
  } catch (error) {
    console.error('Error en callback de Google:', error);
    res.redirect(`${process.env.FRONTEND_URL}/calendar-integration?error=true&provider=google`);
  }
};

/**
 * Obtener estado de integración de calendario del cliente
 */
export const getCalendarIntegrationStatus = async (req: RequestWithUser, res: Response) => {
  try {
    const clientId = req.user?.id;
    if (!clientId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const integration = await CalendarIntegrationModel.findByClientId(clientId);

    if (!integration) {
      return res.json({
        hasIntegration: false,
        provider: null,
        email: null
      });
    }

    res.json({
      hasIntegration: true,
      provider: integration.provider,
      email: integration.email,
      connectedAt: integration.createdAt
    });
  } catch (error) {
    console.error('Error obteniendo estado de integración:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Desconectar integración de calendario
 */
export const disconnectCalendarIntegration = async (req: RequestWithUser, res: Response) => {
  try {
    const clientId = req.user?.id;
    const { provider } = req.params;

    if (!clientId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!['google', 'outlook', 'icloud'].includes(provider)) {
      return res.status(400).json({ message: 'Proveedor de calendario inválido' });
    }

    await CalendarIntegrationModel.deactivate(clientId, provider);

    res.json({
      success: true,
      message: `Integración con ${provider} desconectada exitosamente`
    });
  } catch (error) {
    console.error('Error desconectando integración:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Refrescar token de acceso (para uso interno)
 */
export const refreshAccessToken = async (clientId: string, provider: string): Promise<boolean> => {
  try {
    const integration = await CalendarIntegrationModel.findByClientId(clientId);
    
    if (!integration || integration.provider !== provider) {
      return false;
    }

    if (provider === 'google') {
      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: integration.refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        const expiresAt = new Date(Date.now() + ((credentials.expiry_date ? credentials.expiry_date - Date.now() : 3600000)));
        
        await CalendarIntegrationModel.updateTokens(
          integration.id,
          credentials.access_token,
          credentials.refresh_token || integration.refreshToken,
          expiresAt
        );
        
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error refrescando token:', error);
    return false;
  }
};

/**
 * Middleware para verificar y refrescar tokens automáticamente
 */
export const ensureValidToken = async (clientId: string, provider: string): Promise<string | null> => {
  try {
    const integration = await CalendarIntegrationModel.findByClientId(clientId);
    
    if (!integration || integration.provider !== provider) {
      return null;
    }

    // Verificar si el token está próximo a expirar (menos de 5 minutos)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    
    if (integration.expiresAt <= fiveMinutesFromNow) {
      console.log('Token próximo a expirar, refrescando...');
      const refreshed = await refreshAccessToken(clientId, provider);
      
      if (!refreshed) {
        console.error('No se pudo refrescar el token');
        return null;
      }
      
      // Obtener el token actualizado
      const updatedIntegration = await CalendarIntegrationModel.findByClientId(clientId);
      return updatedIntegration?.accessToken || null;
    }

    return integration.accessToken;
  } catch (error) {
    console.error('Error verificando token:', error);
    return null;
  }
};