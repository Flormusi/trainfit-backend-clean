"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWhatsAppStatus = exports.sendTestMessage = exports.handleIncomingMessage = exports.verifyWebhook = void 0;
const whatsappService_1 = require("../services/whatsappService");
const aiRoutineService_1 = require("../services/aiRoutineService");
const logger_1 = require("../utils/logger");
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Verifica el webhook de WhatsApp
 */
const verifyWebhook = (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const result = whatsappService_1.whatsappService.verifyWebhook(mode, token, challenge);
        if (result) {
            res.status(200).send(challenge);
        }
        else {
            res.status(403).send('Forbidden');
        }
    }
    catch (error) {
        logger_1.logger.error('Error verifying WhatsApp webhook', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.verifyWebhook = verifyWebhook;
/**
 * Procesa mensajes entrantes de WhatsApp
 */
const handleIncomingMessage = async (req, res) => {
    try {
        const messages = whatsappService_1.whatsappService.processIncomingMessage(req.body);
        // Procesar cada mensaje
        for (const message of messages) {
            await processMessage(message);
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        logger_1.logger.error('Error handling incoming WhatsApp message', { error, body: req.body });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.handleIncomingMessage = handleIncomingMessage;
/**
 * Procesa un mensaje individual
 */
async function processMessage(message) {
    try {
        logger_1.logger.info('Processing WhatsApp message', {
            from: message.from,
            messageId: message.id,
            text: message.text.body
        });
        // Marcar mensaje como leído
        await whatsappService_1.whatsappService.markMessageAsRead(message.id);
        // Verificar si el remitente es un entrenador autorizado
        const trainer = await findTrainerByPhone(message.from);
        if (!trainer) {
            // Enviar mensaje de no autorizado
            await whatsappService_1.whatsappService.sendTextMessage(message.from, '❌ Lo siento, solo los entrenadores autorizados pueden usar este bot. Por favor contacta al administrador.');
            return;
        }
        // Procesar el mensaje para extraer objetivo de entrenamiento
        const objective = await aiRoutineService_1.aiRoutineService.processTrainingObjective(message.text.body);
        if (!objective) {
            // Enviar mensaje de ayuda
            await whatsappService_1.whatsappService.sendTextMessage(message.from, `👋 ¡Hola ${trainer.name}! Soy el bot de TrainFit.\n\n` +
                'Para generar una rutina, envía un mensaje como:\n\n' +
                '• "Necesito una rutina para perder peso, nivel principiante"\n' +
                '• "Rutina de masa muscular para intermedio"\n' +
                '• "Rutina de fuerza para avanzado, 4 días por semana"\n\n' +
                '¿En qué puedo ayudarte? 💪');
            return;
        }
        // Enviar mensaje de confirmación
        await whatsappService_1.whatsappService.sendTextMessage(message.from, `⏳ Generando rutina para: *${objective.goal}*\n` +
            `Nivel: *${objective.level}*\n` +
            `Frecuencia: *${objective.frequency} días/semana*\n\n` +
            'Por favor espera un momento...');
        // Generar la rutina
        const routine = await aiRoutineService_1.aiRoutineService.generateRoutine(objective);
        if (!routine) {
            await whatsappService_1.whatsappService.sendTextMessage(message.from, '❌ Lo siento, no pude generar la rutina en este momento. Por favor intenta de nuevo más tarde.');
            return;
        }
        // Guardar la rutina en la base de datos
        const savedRoutine = await aiRoutineService_1.aiRoutineService.saveRoutineToDatabase(routine, trainer.id);
        // Formatear y enviar la rutina por WhatsApp
        const formattedMessage = aiRoutineService_1.aiRoutineService.formatRoutineForWhatsApp(routine);
        await whatsappService_1.whatsappService.sendTextMessage(message.from, formattedMessage);
        // Enviar mensaje adicional con información de la rutina guardada
        await whatsappService_1.whatsappService.sendTextMessage(message.from, `✅ *Rutina guardada exitosamente*\n\n` +
            `ID de rutina: ${savedRoutine.id}\n` +
            `Puedes encontrarla en tu panel de TrainFit para asignarla a tus clientes.\n\n` +
            '¿Necesitas otra rutina? Solo envíame otro mensaje! 🚀');
        logger_1.logger.info('WhatsApp routine generation completed', {
            trainerId: trainer.id,
            routineId: savedRoutine.id,
            objective
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing WhatsApp message', { error, message });
        // Enviar mensaje de error al usuario
        try {
            await whatsappService_1.whatsappService.sendTextMessage(message.from, '❌ Ocurrió un error procesando tu solicitud. Por favor intenta de nuevo más tarde.');
        }
        catch (sendError) {
            logger_1.logger.error('Error sending error message', { sendError });
        }
    }
}
/**
 * Busca un entrenador por número de teléfono
 */
async function findTrainerByPhone(phoneNumber) {
    try {
        // Limpiar el número de teléfono
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        // Buscar en el perfil del entrenador
        const trainerProfile = await prisma_1.default.trainerProfile.findFirst({
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
        const userWithPhone = await prisma_1.default.user.findFirst({
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
    }
    catch (error) {
        logger_1.logger.error('Error finding trainer by phone', { error, phoneNumber });
        return null;
    }
}
/**
 * Endpoint para enviar mensaje de prueba (solo para desarrollo)
 */
const sendTestMessage = async (req, res) => {
    try {
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({ error: 'Phone number and message are required' });
        }
        const result = await whatsappService_1.whatsappService.sendTextMessage(to, message);
        res.status(200).json({
            success: true,
            messageId: result.messages?.[0]?.id,
            message: 'Message sent successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error sending test message', { error });
        res.status(500).json({ error: 'Failed to send message' });
    }
};
exports.sendTestMessage = sendTestMessage;
/**
 * Obtiene el estado del servicio de WhatsApp
 */
const getWhatsAppStatus = (req, res) => {
    try {
        const hasConfig = !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
        res.status(200).json({
            status: hasConfig ? 'configured' : 'not_configured',
            hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
            hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
            hasWebhookToken: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting WhatsApp status', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getWhatsAppStatus = getWhatsAppStatus;
