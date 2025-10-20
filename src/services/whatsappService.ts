import axios from 'axios';
import { logger } from '../utils/logger';

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  apiVersion: string;
}

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  text: {
    body: string;
  };
  type: string;
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0'
    };
    
    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`;
    
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      logger.error('WhatsApp configuration missing. Please check environment variables.');
    }
  }

  /**
   * Envía un mensaje de texto a través de WhatsApp Business API
   */
  async sendTextMessage(to: string, message: string): Promise<any> {
    try {
      const payload: WhatsAppMessage = {
        to: to.replace(/\D/g, ''), // Remover caracteres no numéricos
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp message sent successfully', {
        to,
        messageId: response.data.messages?.[0]?.id
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending WhatsApp message', {
        error: error.response?.data || error.message,
        to
      });
      throw error;
    }
  }

  /**
   * Envía un mensaje usando una plantilla de WhatsApp
   */
  async sendTemplateMessage(to: string, templateName: string, components?: any[]): Promise<any> {
    try {
      const payload: WhatsAppMessage = {
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

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp template message sent successfully', {
        to,
        template: templateName,
        messageId: response.data.messages?.[0]?.id
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending WhatsApp template message', {
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
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      logger.info('WhatsApp webhook verified successfully');
      return challenge;
    }
    
    logger.warn('WhatsApp webhook verification failed', { mode, token });
    return null;
  }

  /**
   * Procesa mensajes entrantes de WhatsApp
   */
  processIncomingMessage(body: any): IncomingMessage[] {
    const messages: IncomingMessage[] = [];
    
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
    } catch (error) {
      logger.error('Error processing incoming WhatsApp message', { error, body });
    }
    
    return messages;
  }

  /**
   * Marca un mensaje como leído
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Message marked as read', { messageId });
    } catch (error: any) {
      logger.error('Error marking message as read', {
        error: error.response?.data || error.message,
        messageId
      });
    }
  }
}

export const whatsappService = new WhatsAppService();
export { WhatsAppService, IncomingMessage };