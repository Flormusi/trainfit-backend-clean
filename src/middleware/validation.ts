import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para validar datos de eventos de calendario
 */
export const validateCalendarEvent = (req: Request, res: Response, next: NextFunction) => {
  const { title, startDate, endDate, clientEmail, type } = req.body;

  // Validar campos requeridos
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'El título del evento es requerido y debe ser una cadena válida'
    });
  }

  if (!startDate) {
    return res.status(400).json({
      success: false,
      message: 'La fecha de inicio es requerida'
    });
  }

  if (!endDate) {
    return res.status(400).json({
      success: false,
      message: 'La fecha de fin es requerida'
    });
  }

  if (!clientEmail || typeof clientEmail !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'El email del cliente es requerido'
    });
  }

  if (!type || typeof type !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'El tipo de entrenamiento es requerido'
    });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clientEmail)) {
    return res.status(400).json({
      success: false,
      message: 'El formato del email no es válido'
    });
  }

  // Validar fechas
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'La fecha de inicio no es válida'
    });
  }

  if (isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'La fecha de fin no es válida'
    });
  }

  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: 'La fecha de inicio debe ser anterior a la fecha de fin'
    });
  }

  // Validar que la fecha no sea en el pasado
  const now = new Date();
  if (start < now) {
    return res.status(400).json({
      success: false,
      message: 'No se pueden crear eventos en el pasado'
    });
  }

  // Validar tipos de entrenamiento permitidos
  const allowedTypes = ['personal', 'group', 'functional', 'strength', 'cardio', 'yoga', 'pilates'];
  if (!allowedTypes.includes(type.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Tipo de entrenamiento no válido. Tipos permitidos: ${allowedTypes.join(', ')}`
    });
  }

  // Validar duración del evento (mínimo 15 minutos, máximo 4 horas)
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  if (durationMinutes < 15) {
    return res.status(400).json({
      success: false,
      message: 'La duración mínima del evento es de 15 minutos'
    });
  }

  if (durationMinutes > 240) { // 4 horas
    return res.status(400).json({
      success: false,
      message: 'La duración máxima del evento es de 4 horas'
    });
  }

  // Normalizar el tipo a lowercase
  req.body.type = type.toLowerCase();

  next();
};

/**
 * Middleware para validar parámetros de OAuth
 */
export const validateOAuthParams = (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Código de autorización OAuth requerido'
    });
  }

  next();
};

/**
 * Middleware para validar parámetros de sincronización
 */
export const validateSyncParams = (req: Request, res: Response, next: NextFunction) => {
  const { eventId, accessToken } = req.body;

  if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'ID del evento requerido'
    });
  }

  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  next();
};

/**
 * Middleware para validar parámetros de consulta de eventos
 */
export const validateEventQuery = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;

  if (startDate && typeof startDate === 'string') {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio no válida'
      });
    }
  }

  if (endDate && typeof endDate === 'string') {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de fin no válida'
      });
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }
  }

  next();
};