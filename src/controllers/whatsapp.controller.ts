import { Request, Response } from 'express';
import { whatsappService } from '../services/whatsappService';
import { aiRoutineService } from '../services/aiRoutineService';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';

/**
 * Verifica el webhook de WhatsApp
 */
export const verifyWebhook = (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const result = whatsappService.verifyWebhook(
      mode as string,
      token as string,
      challenge as string
    );

    if (result) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  } catch (error) {
    logger.error('Error verifying WhatsApp webhook', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Procesa mensajes entrantes de WhatsApp
 */
export const handleIncomingMessage = async (req: Request, res: Response) => {
  try {
    const messages = whatsappService.processIncomingMessage(req.body);
    
    // Procesar cada mensaje
    for (const message of messages) {
      await processMessage(message);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error handling incoming WhatsApp message', { error, body: req.body });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Procesa un mensaje individual
 */
async function processMessage(message: any) {
  try {
    logger.info('Processing WhatsApp message', {
      from: message.from,
      messageId: message.id,
      text: message.text.body
    });

    // Marcar mensaje como leído
    await whatsappService.markMessageAsRead(message.id);

    // Verificar si el remitente es un entrenador autorizado
    const trainer = await findTrainerByPhone(message.from);
    
    if (!trainer) {
      // Enviar mensaje de no autorizado
      await whatsappService.sendTextMessage(
        message.from,
        '❌ Lo siento, solo los entrenadores autorizados pueden usar este bot. Por favor contacta al administrador.'
      );
      return;
    }

    // Procesar el mensaje para extraer objetivo de entrenamiento
    const objective = await aiRoutineService.processTrainingObjective(message.text.body);
    
    if (!objective) {
      // Enviar mensaje de ayuda
      await whatsappService.sendTextMessage(
        message.from,
        `👋 ¡Hola ${trainer.name}! Soy el bot de TrainFit.\n\n` +
        'Para generar una rutina, envía un mensaje como:\n\n' +
        '• "Necesito una rutina para perder peso, nivel principiante"\n' +
        '• "Rutina de masa muscular para intermedio"\n' +
        '• "Rutina de fuerza para avanzado, 4 días por semana"\n\n' +
        '¿En qué puedo ayudarte? 💪'
      );
      return;
    }

    // Enviar mensaje de confirmación
    await whatsappService.sendTextMessage(
      message.from,
      `⏳ Generando rutina para: *${objective.goal}*\n` +
      `Nivel: *${objective.level}*\n` +
      `Frecuencia: *${objective.frequency} días/semana*\n\n` +
      'Por favor espera un momento...'
    );

    // Generar la rutina
    const routine = await aiRoutineService.generateRoutine(objective);
    
    if (!routine) {
      await whatsappService.sendTextMessage(
        message.from,
        '❌ Lo siento, no pude generar la rutina en este momento. Por favor intenta de nuevo más tarde.'
      );
      return;
    }

    // Guardar la rutina en la base de datos
    const savedRoutine = await aiRoutineService.saveRoutineToDatabase(
      routine,
      trainer.id
    );

    // Formatear y enviar la rutina por WhatsApp
    const formattedMessage = aiRoutineService.formatRoutineForWhatsApp(routine);
    await whatsappService.sendTextMessage(message.from, formattedMessage);

    // Enviar mensaje adicional con información de la rutina guardada
    await whatsappService.sendTextMessage(
      message.from,
      `✅ *Rutina guardada exitosamente*\n\n` +
      `ID de rutina: ${savedRoutine.id}\n` +
      `Puedes encontrarla en tu panel de TrainFit para asignarla a tus clientes.\n\n` +
      '¿Necesitas otra rutina? Solo envíame otro mensaje! 🚀'
    );

    logger.info('WhatsApp routine generation completed', {
      trainerId: trainer.id,
      routineId: savedRoutine.id,
      objective
    });

  } catch (error) {
    logger.error('Error processing WhatsApp message', { error, message });
    
    // Enviar mensaje de error al usuario
    try {
      await whatsappService.sendTextMessage(
        message.from,
        '❌ Ocurrió un error procesando tu solicitud. Por favor intenta de nuevo más tarde.'
      );
    } catch (sendError) {
      logger.error('Error sending error message', { sendError });
    }
  }
}

/**
 * Busca un entrenador por número de teléfono
 */
async function findTrainerByPhone(phoneNumber: string): Promise<any> {
  try {
    // Limpiar el número de teléfono
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Buscar en el perfil del entrenador
    const trainerProfile = await prisma.trainerProfile.findFirst({
      where: {
        user: {
          role: 'TRAINER'
        }
      },
      include: {
        user: {
          include: {
            clientProfile: true
          }
        }
      }
    });

    // Por ahora, buscar en clientProfile.phone ya que no hay campo phone en trainerProfile
    const userWithPhone = await prisma.user.findFirst({
      where: {
        role: 'TRAINER',
        clientProfile: {
          phone: {
            contains: cleanPhone.slice(-8) // Últimos 8 dígitos para mayor flexibilidad
          }
        }
      },
      include: {
        trainerProfile: true,
        clientProfile: true
      }
    });

    if (userWithPhone) {
      return {
        id: userWithPhone.id,
        name: userWithPhone.trainerProfile?.name || userWithPhone.clientProfile?.name || userWithPhone.name || 'Entrenador',
        phone: userWithPhone.clientProfile?.phone
      };
    }

    return null;
  } catch (error) {
    logger.error('Error finding trainer by phone', { error, phoneNumber });
    return null;
  }
}

/**
 * Endpoint para enviar mensaje de prueba (solo para desarrollo)
 */
export const sendTestMessage = async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    const result = await whatsappService.sendTextMessage(to, message);
    
    res.status(200).json({ 
      success: true, 
      messageId: result.messages?.[0]?.id,
      message: 'Message sent successfully'
    });
  } catch (error) {
    logger.error('Error sending test message', { error });
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * Obtiene el estado del servicio de WhatsApp
 */
export const getWhatsAppStatus = (req: Request, res: Response) => {
  try {
    const hasConfig = !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
    
    res.status(200).json({
      status: hasConfig ? 'configured' : 'not_configured',
      hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
      hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      hasWebhookToken: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    });
  } catch (error) {
    logger.error('Error getting WhatsApp status', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};