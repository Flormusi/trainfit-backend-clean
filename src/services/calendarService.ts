import { CalendarIntegrationModel } from '../models/CalendarIntegration';
import { google } from 'googleapis';
import { icsService } from './icsService';
import { EmailService } from './emailService';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface TrainingEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  trainerId: string;
  type: 'entrenamiento' | 'consulta' | 'evaluacion' | 'nutricion';
}

export interface CalendarIntegration {
  clientId: string;
  provider: 'google' | 'outlook' | 'icloud';
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class CalendarService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Genera un archivo .ics para un evento de entrenamiento
   */
  async generateICSFile(event: TrainingEvent): Promise<string> {
    return await icsService.generateICSFile(event);
  }

  /**
   * Envía un email con el archivo .ics adjunto
   */
  async sendCalendarInvitation(event: TrainingEvent, customMessage?: string): Promise<void> {
    try {
      const result = await EmailService.sendCalendarInvitation(event, customMessage);
      
      if (!result.success) {
        throw new Error(result.error || 'Error enviando invitación de calendario');
      }
      

    } catch (error) {
      console.error("❌ Error enviando invitación de calendario:");
      throw error;
    }
  }

  /**
   * Sincroniza un evento directamente con Google Calendar
   */
  async syncWithGoogleCalendar(event: TrainingEvent, integration: CalendarIntegration): Promise<void> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const calendarEvent = {
        summary: event.title,
        description: event.description || `Sesión de ${event.type} con TrainFit`,
        location: event.location || 'TrainFit - Gimnasio',
        start: {
          dateTime: event.startDate.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires'
        },
        end: {
          dateTime: event.endDate.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires'
        },
        attendees: [
          { email: event.clientEmail, displayName: event.clientName }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'popup', minutes: 10 }
          ]
        },
        colorId: '11', // Rojo para eventos de TrainFit
        source: {
          title: 'TrainFit',
          url: `${process.env.FRONTEND_URL}/events/${event.id}`
        }
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: calendarEvent,
        sendUpdates: 'all'
      });


    } catch (error) {
      console.error("❌ Error sincronizando con Google Calendar:");
      throw error;
    }
  }

  /**
   * Procesa un evento y decide si enviarlo por email o sincronizar directamente
   */
  async processTrainingEvent(event: TrainingEvent, integration?: CalendarIntegration): Promise<void> {
    try {
      if (integration && integration.provider === 'google') {
        // Cliente tiene calendario conectado - sincronizar directamente
        await this.syncWithGoogleCalendar(event, integration);

      } else {
        // Cliente no tiene calendario conectado - enviar por email
        await this.sendCalendarInvitation(event);

      }
    } catch (error) {
      console.error("❌ Error procesando evento de entrenamiento:");
      // Fallback: si falla la sincronización directa, enviar por email
      if (integration) {

        await this.sendCalendarInvitation(event);
      }
      throw error;
    }
  }

  /**
   * Verifica si un cliente tiene integración de calendario activa
   */
  async hasCalendarIntegration(clientId: string): Promise<CalendarIntegration | null> {
    try {
      const { CalendarIntegrationModel } = await import('../models/CalendarIntegration');
      const integration = await CalendarIntegrationModel.findByClientId(clientId);
      
      if (integration) {
        return {
          clientId: integration.clientId,
          provider: integration.provider as 'google' | 'outlook' | 'icloud',
          accessToken: integration.accessToken,
          refreshToken: integration.refreshToken,
          expiresAt: integration.expiresAt
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error checking calendar integration:");
      return null;
    }
  }
}

export const calendarService = new CalendarService();