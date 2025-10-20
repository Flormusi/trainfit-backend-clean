import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CalendarIntegrationModel } from '../models/CalendarIntegration';

/**
 * Middleware para validar tokens OAuth y verificar permisos de calendario
 */
export const validateOAuthToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, provider } = req.body;

    if (!clientId || !provider) {
      return res.status(400).json({
        success: false,
        message: 'Client ID y proveedor requeridos'
      });
    }

    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar que existe la integración de calendario para este usuario
    const integration = await CalendarIntegrationModel.findByClientId(clientId);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integración de calendario no encontrada'
      });
    }

    // Verificar que la integración pertenece al usuario autenticado
    if (integration.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a esta integración'
      });
    }

    // Verificar que el token no haya expirado
    if (integration.expiresAt <= new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Token OAuth expirado. Reautorización requerida'
      });
    }

    // Agregar la integración al request para uso posterior
    req.calendarIntegration = integration;
    next();

  } catch (error) {
    console.error('Error validando token OAuth:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para validar permisos de escritura en calendario
 */
export const validateCalendarWritePermissions = (req: Request, res: Response, next: NextFunction) => {
  const integration = req.calendarIntegration;

  if (!integration) {
    return res.status(400).json({
      success: false,
      message: 'Integración de calendario no encontrada en el request'
    });
  }

  // Verificar que tiene permisos de escritura
  if (!integration.permissions.includes('write')) {
    return res.status(403).json({
      success: false,
      message: 'Permisos insuficientes para crear eventos en el calendario'
    });
  }

  next();
};

/**
 * Middleware para validar permisos de lectura en calendario
 */
export const validateCalendarReadPermissions = (req: Request, res: Response, next: NextFunction) => {
  const integration = req.calendarIntegration;

  if (!integration) {
    return res.status(400).json({
      success: false,
      message: 'Integración de calendario no encontrada en el request'
    });
  }

  // Verificar que tiene permisos de lectura
  if (!integration.permissions.includes('read')) {
    return res.status(403).json({
      success: false,
      message: 'Permisos insuficientes para leer eventos del calendario'
    });
  }

  next();
};

/**
 * Middleware para sanitizar datos de eventos de calendario
 */
export const sanitizeCalendarEventData = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, location } = req.body;

  // Sanitizar campos de texto para prevenir XSS
  if (title) {
    req.body.title = title.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  }

  if (description) {
    req.body.description = description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  }

  if (location) {
    req.body.location = location.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  }

  next();
};

/**
 * Middleware para validar límites de rate limiting específicos para OAuth
 */
export const oauthRateLimit = () => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
  const MAX_REQUESTS = 100; // 100 requests por ventana

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.user?.id || req.ip}_oauth`;
    const now = Date.now();

    // Limpiar entradas expiradas
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < now) {
        requests.delete(k);
      }
    }

    const current = requests.get(key) || { count: 0, resetTime: now + WINDOW_MS };

    if (current.resetTime < now) {
      current.count = 0;
      current.resetTime = now + WINDOW_MS;
    }

    current.count++;

    if (current.count > MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes OAuth. Intente más tarde.',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }

    requests.set(key, current);
    next();
  };
};

// Extender el tipo Request para incluir calendarIntegration
declare global {
  namespace Express {
    interface Request {
      calendarIntegration?: any;
    }
  }
}