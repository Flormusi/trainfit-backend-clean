import { createEvent, EventAttributes } from 'ics';
import { TrainingEvent } from './calendarService';

export interface ICSGenerationOptions {
  includeAlarms?: boolean;
  alarmMinutes?: number[];
  organizerName?: string;
  organizerEmail?: string;
  categories?: string[];
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
  busyStatus?: 'FREE' | 'BUSY' | 'TENTATIVE';
}

export class ICSService {
  private defaultOptions: ICSGenerationOptions = {
    includeAlarms: true,
    alarmMinutes: [30, 10],
    organizerName: 'TrainFit',
    organizerEmail: process.env.EMAIL_USER || 'noreply@trainfit.com',
    categories: ['TrainFit'],
    status: 'CONFIRMED',
    busyStatus: 'BUSY'
  };

  /**
   * Genera un archivo .ics para un evento de entrenamiento
   */
  async generateICSFile(event: TrainingEvent, options?: ICSGenerationOptions): Promise<string> {
    const config = { ...this.defaultOptions, ...options };
    
    const eventAttributes: EventAttributes = {
      start: [
        event.startDate.getFullYear(),
        event.startDate.getMonth() + 1,
        event.startDate.getDate(),
        event.startDate.getHours(),
        event.startDate.getMinutes()
      ],
      end: [
        event.endDate.getFullYear(),
        event.endDate.getMonth() + 1,
        event.endDate.getDate(),
        event.endDate.getHours(),
        event.endDate.getMinutes()
      ],
      title: event.title,
      description: this.generateEventDescription(event),
      location: event.location || 'TrainFit - Gimnasio',
      url: `${process.env.FRONTEND_URL}/events/${event.id}`,
      uid: `trainfit-${event.id}@trainfit.com`,
      organizer: { 
        name: config.organizerName!, 
        email: config.organizerEmail! 
      },
      attendees: [
        { 
          name: event.clientName, 
          email: event.clientEmail, 
          rsvp: true,
          role: 'REQ-PARTICIPANT'
        }
      ],
      status: config.status,
      busyStatus: config.busyStatus,
      categories: [...config.categories!, event.type],
      productId: 'TrainFit Calendar System',
      calName: 'TrainFit - Sesiones de Entrenamiento'
    };

    // Agregar alarmas si están habilitadas
    if (config.includeAlarms && config.alarmMinutes) {
      eventAttributes.alarms = config.alarmMinutes.map(minutes => ({
        action: 'display',
        description: `Recordatorio: ${event.title} en ${minutes} minutos`,
        trigger: { minutes, before: true }
      }));
    }

    return new Promise((resolve, reject) => {
      createEvent(eventAttributes, (error, value) => {
        if (error) {
          console.error('❌ Error generando archivo .ics:', error);
          reject(error);
        } else {
          console.log(`✅ Archivo .ics generado para evento: ${event.title}`);
          resolve(value);
        }
      });
    });
  }

  /**
   * Genera múltiples archivos .ics para una serie de eventos
   */
  async generateMultipleICSFiles(events: TrainingEvent[], options?: ICSGenerationOptions): Promise<{ [eventId: string]: string }> {
    const results: { [eventId: string]: string } = {};
    
    for (const event of events) {
      try {
        results[event.id] = await this.generateICSFile(event, options);
      } catch (error) {
        console.error(`❌ Error generando .ics para evento ${event.id}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Genera una descripción detallada para el evento
   */
  private generateEventDescription(event: TrainingEvent): string {
    const typeDescriptions = {
      entrenamiento: 'Sesión de entrenamiento personalizado',
      consulta: 'Consulta con tu entrenador personal',
      evaluacion: 'Evaluación física y análisis de progreso',
      nutricion: 'Consulta nutricional y planificación dietética'
    };

    let description = typeDescriptions[event.type] || 'Sesión con tu entrenador';
    
    if (event.description) {
      description += `\n\nDetalles adicionales:\n${event.description}`;
    }
    
    description += `\n\nCliente: ${event.clientName}`;
    description += `\nTipo de sesión: ${event.type.charAt(0).toUpperCase() + event.type.slice(1)}`;
    description += `\n\nGenerado por TrainFit - Tu compañero de entrenamiento`;
    description += `\nMás información: ${process.env.FRONTEND_URL}`;
    
    return description;
  }

  /**
   * Valida que un evento tenga todos los campos requeridos
   */
  validateEvent(event: TrainingEvent): boolean {
    const requiredFields = ['id', 'title', 'startDate', 'endDate', 'clientId', 'clientName', 'clientEmail', 'trainerId', 'type'];
    
    for (const field of requiredFields) {
      if (!event[field as keyof TrainingEvent]) {
        console.error(`❌ Campo requerido faltante: ${field}`);
        return false;
      }
    }
    
    // Validar que la fecha de fin sea posterior a la de inicio
    if (event.endDate <= event.startDate) {
      console.error('❌ La fecha de fin debe ser posterior a la fecha de inicio');
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(event.clientEmail)) {
      console.error('❌ Formato de email inválido');
      return false;
    }
    
    return true;
  }

  /**
   * Genera un nombre de archivo único para el .ics
   */
  generateFileName(event: TrainingEvent): string {
    const date = event.startDate.toISOString().split('T')[0];
    const sanitizedTitle = event.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `trainfit-${event.id}-${date}-${sanitizedTitle}.ics`;
  }
}

export const icsService = new ICSService();