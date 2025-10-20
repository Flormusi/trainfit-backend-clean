"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = exports.whatsappService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class WhatsAppService {
    constructor() {
        this.config = {
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
            webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
            apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0'
        };
        this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`;
        if (!this.config.accessToken || !this.config.phoneNumberId) {
            logger_1.logger.error('WhatsApp configuration missing. Please check environment variables.');
        }
    }
    /**
     * Envía un mensaje de texto a través de WhatsApp Business API
     */
    async sendTextMessage(to, message) {
        try {
            const payload = {
                to: to.replace(/\D/g, ''), // Remover caracteres no numéricos
                type: 'text',
                text: {
                    body: message
                }
            };
            const response = await axios_1.default.post(`${this.baseUrl}/messages`, payload, {
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            logger_1.logger.info('WhatsApp message sent successfully', {
                to,
                messageId: response.data.messages?.[0]?.id
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Error sending WhatsApp message', {
                error: error.response?.data || error.message,
                to
            });
            throw error;
        }
    }
    /**
     * Envía un mensaje usando una plantilla de WhatsApp
     */
    async sendTemplateMessage(to, templateName, components) {
        try {
            const payload = {
                to: to.replace(/\D/g, ''),
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: 'es' // Español
                    },
                    components: components || []
                }
            };
            const response = await axios_1.default.post(`${this.baseUrl}/messages`, payload, {
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            logger_1.logger.info('WhatsApp template message sent successfully', {
                to,
                template: templateName,
                messageId: response.data.messages?.[0]?.id
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Error sending WhatsApp template message', {
                error: error.response?.data || error.message,
                to,
                template: templateName
            });
            throw error;
        }
    }
    /**
     * Verifica el webhook de WhatsApp
     */
    verifyWebhook(mode, token, challenge) {
        if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
            logger_1.logger.info('WhatsApp webhook verified successfully');
            return challenge;
        }
        logger_1.logger.warn('WhatsApp webhook verification failed', { mode, token });
        return null;
    }
    /**
     * Procesa mensajes entrantes de WhatsApp
     */
    processIncomingMessage(body) {
        const messages = [];
        try {
            if (body.entry && body.entry[0] && body.entry[0].changes) {
                const changes = body.entry[0].changes;
                for (const change of changes) {
                    if (change.value && change.value.messages) {
                        for (const message of change.value.messages) {
                            if (message.type === 'text') {
                                messages.push({
                                    from: message.from,
                                    id: message.id,
                                    timestamp: message.timestamp,
                                    text: message.text,
                                    type: message.type
                                });
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error processing incoming WhatsApp message', { error, body });
        }
        return messages;
    }
    /**
     * Marca un mensaje como leído
     */
    async markMessageAsRead(messageId) {
        try {
            await axios_1.default.post(`${this.baseUrl}/messages`, {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            logger_1.logger.info('Message marked as read', { messageId });
        }
        catch (error) {
            logger_1.logger.error('Error marking message as read', {
                error: error.response?.data || error.message,
                messageId
            });
        }
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsappService = new WhatsAppService();
