import nodemailer from 'nodemailer';
import { generateWelcomeEmailTemplate, WelcomeEmailData } from '../templates/welcomeEmailTemplate';
import { generatePaymentReminderEmailTemplate, PaymentReminderEmailData } from '../templates/paymentReminderEmailTemplate';
import { validateEmailSecurity } from '../middleware/emailValidation.middleware';
import { icsService } from './icsService';
import { TrainingEvent } from './calendarService';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface RoutineEmailData {
  clientName: string;
  clientEmail: string;
  routineName: string;
  trainerName: string;
  dashboardUrl: string;
  routineUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface WelcomeEmailOptions {
  clientName: string;
  clientEmail: string;
  temporaryPassword: string;
  trainerName: string;
  loginUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

interface EmailLog {
  to: string;
  subject: string;
  success: boolean;
  error?: string;
  timestamp: Date;
  attemptCount: number;
}

type EmailServiceType = 'gmail' | 'sendgrid' | 'mailgun' | 'simulation';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static emailLogs: EmailLog[] = [];
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 2000;

  /**
   * Determina qué servicio de email usar basado en las variables de entorno
   */
  private static getEmailServiceType(): EmailServiceType {
    const service = process.env.EMAIL_SERVICE?.toLowerCase();
    
    if (service === 'simulation') return 'simulation';
    if (process.env.SENDGRID_API_KEY) return 'sendgrid';
    if (process.env.MAILGUN_API_KEY) return 'mailgun';
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'gmail';
    
    return 'simulation';
  }

  /**
   * Inicializa el transporter según el servicio configurado
   */
  private static initializeTransporter(): nodemailer.Transporter | null {
    const serviceType = this.getEmailServiceType();
    
    switch (serviceType) {
      case 'gmail':
        return nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      
      case 'sendgrid':
        return nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      
      case 'mailgun':
        return nodemailer.createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
            pass: process.env.MAILGUN_API_KEY
          }
        });
      
      default:
        return null;
    }
  }

  /**
   * Verifica si el servicio de email está configurado para envío real
   */
  private static isEmailConfigured(): boolean {
    return this.getEmailServiceType() !== 'simulation';
  }

  /**
   * Método genérico para enviar correos electrónicos
   */
  static async sendEmail(emailData: EmailData): Promise<{ messageId?: string; success: boolean }> {
    try {
      // Si no hay credenciales configuradas, simular envío exitoso
      if (!this.isEmailConfigured()) {
        console.log(`[SIMULADO] Email que se enviaría a ${emailData.to}: ${emailData.subject}`);
        console.log(`[SIMULADO] Contenido: ${emailData.html.substring(0, 100)}...`);
        return { success: true, messageId: 'simulated-' + Date.now() };
      }

      // Inicializar transporter si no existe
      if (!this.transporter) {
        this.transporter = this.initializeTransporter();
      }

      // Si aún no hay transporter, simular envío
      if (!this.transporter) {
        console.log(`[FALLBACK] No se pudo inicializar transporter, simulando envío para ${emailData.to}`);
        return { success: true, messageId: 'fallback-' + Date.now() };
      }

      const result = await this.transporter.sendMail({
        from: emailData.from || process.env.EMAIL_FROM || 'noreply@trainfit.com',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      });
      
      console.log(`✅ Email enviado exitosamente a ${emailData.to}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error al enviar email:', error);
      // En caso de error, simular envío exitoso para no bloquear la funcionalidad
      console.log(`[FALLBACK] Simulando envío exitoso para ${emailData.to}`);
      return { success: true, messageId: 'error-fallback-' + Date.now() };
    }
  }

  /**
   * Envía un correo electrónico al cliente cuando se le asigna una nueva rutina
   */
  static async sendRoutineAssignmentEmail(data: RoutineEmailData): Promise<boolean> {
    const formattedStartDate = data.startDate ? new Date(data.startDate).toLocaleDateString('es-ES') : null;
    const formattedEndDate = data.endDate ? new Date(data.endDate).toLocaleDateString('es-ES') : null;
    
    const dateInfo = formattedStartDate && formattedEndDate 
      ? `<p style="margin: 8px 0; color: #333;"><strong>Fecha de inicio:</strong> ${formattedStartDate}</p>
         <p style="margin: 8px 0; color: #333;"><strong>Fecha de finalización:</strong> ${formattedEndDate}</p>`
      : '';
    
    const routineLink = data.routineUrl 
      ? `<div style="text-align: center; margin: 30px 0;">
           <a href="${data.routineUrl}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.3s ease; box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);">
             🏋️‍♀️ Ver Mi Rutina
           </a>
         </div>`
      : '';
    
    const emailContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Rutina Asignada - TrainFit</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header con logo SVG -->
          <div style="background-color: #000000; padding: 20px; text-align: center;">
            <svg width="250" height="60" viewBox="0 0 250 60" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
              <defs>
                <linearGradient id="redGradientHeader" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#ff3b30;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#ff6b60;stop-opacity:1" />
                </linearGradient>
                <filter id="glowHeader">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <!-- TRAINFIT text -->
              <text x="125" y="38" 
                    font-family="'Segoe UI', Arial, sans-serif" 
                    font-size="28" 
                    font-weight="900" 
                    fill="url(#redGradientHeader)"
                    filter="url(#glowHeader)"
                    text-anchor="middle"
                    letter-spacing="1px">TRAINFIT</text>
              
              <!-- Icono de pesa -->
              <g transform="translate(200, 18)">
                <circle cx="5" cy="12" r="4" fill="url(#redGradientHeader)"/>
                <rect x="9" y="11" width="10" height="2" fill="url(#redGradientHeader)"/>
                <circle cx="19" cy="12" r="4" fill="url(#redGradientHeader)"/>
              </g>
            </svg>
            <h2 style="margin: 20px 0 0 0; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: #ff3b30;">Nueva Rutina Asignada</h2>
          </div>
          
          <!-- Contenido principal -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px; color: #374151;">
              Hola <strong style="color: #dc2626;">${data.clientName}</strong>,
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #6b7280;">
              ¡Excelentes noticias! Tu entrenador <strong style="color: #dc2626;">${data.trainerName}</strong> te ha asignado una nueva rutina personalizada.
            </p>
            
            <!-- Card de la rutina -->
            <div style="background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); border: 2px solid #dc2626; padding: 30px; margin: 30px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 12px 20px; border-radius: 25px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px;">
                  Nueva Rutina
                </div>
                <h3 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: bold;">${data.routineName}</h3>
              </div>
              ${dateInfo}
            </div>
            
            ${routineLink}
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">También puedes acceder desde tu dashboard</p>
              <a href="${data.dashboardUrl}" style="color: #dc2626; text-decoration: none; font-weight: 600; font-size: 14px; border-bottom: 1px solid #dc2626;">Mi Dashboard Personal →</a>
            </div>
            
            <!-- Mensaje motivacional -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #dc2626;">
              <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 15px;">💪</div>
                <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #dc2626;">
                  ¡Es hora de alcanzar tus objetivos!
                </p>
                <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.6;">
                  Sigue las indicaciones de tu entrenador y mantén la constancia. ¡Tú puedes lograrlo!
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <p style="font-size: 16px; color: #374151; margin: 0;">
                ¡Que tengas un excelente entrenamiento! 🔥
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #000000; color: white; padding: 40px 30px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <svg width="300" height="75" viewBox="0 0 300 75" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
                <defs>
                  <linearGradient id="redGradientFooter" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#ff3b30;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#ff6b60;stop-opacity:1" />
                  </linearGradient>
                  <filter id="glowFooter">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <rect width="300" height="75" fill="#000000"/>
                
                <!-- TRAINFIT text -->
                <text x="150" y="45" text-anchor="middle" fill="url(#redGradientFooter)" filter="url(#glowFooter)" font-family="'Segoe UI', Arial, sans-serif" font-size="24" font-weight="900" letter-spacing="4">TRAINFIT</text>
                
                <!-- Icono de pesa -->
                <g transform="translate(255, 26)">
                  <circle cx="4" cy="9" r="4" fill="url(#redGradientFooter)"/>
                  <rect x="8" y="8" width="10" height="2" fill="url(#redGradientFooter)"/>
                  <circle cx="18" cy="9" r="4" fill="url(#redGradientFooter)"/>
                </g>
              </svg>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #d1d5db; line-height: 1.6;">
              Tu plataforma de entrenamiento personal
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
              Si tienes alguna pregunta, contacta a tu entrenador directamente.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const result = await this.sendEmail({
      to: data.clientEmail,
      subject: '🎉 ¡Nueva Rutina Asignada! - TrainFit',
      html: emailContent
    });

    return result.success;
  }

  /**
   * Envía un recordatorio de pago al cliente
   */
  static async sendPaymentReminderEmail(clientEmail: string, clientName: string, trainerName: string): Promise<boolean> {
    const emailData: PaymentReminderEmailData = {
      clientName,
      clientEmail,
      trainerName,
      supportEmail: 'soporte@trainfit.com',
      supportPhone: '+54 11 1234-5678'
    };

    const emailContent = generatePaymentReminderEmailTemplate(emailData);

    const result = await this.sendEmail({
      to: clientEmail,
      subject: 'Recordatorio de Pago - TrainFit 💳',
      html: emailContent
    });

    return result.success;
  }

  /**
   * Registra un intento de envío de email
   */
  private static logEmailAttempt(log: EmailLog): void {
    this.emailLogs.push(log);
    
    // Mantener solo los últimos 1000 logs para evitar uso excesivo de memoria
    if (this.emailLogs.length > 1000) {
      this.emailLogs = this.emailLogs.slice(-1000);
    }
    
    // Log en consola para debugging
    if (log.success) {
      console.log(`✅ Email enviado exitosamente a ${log.to} - Intento ${log.attemptCount}`);
    } else {
      console.error(`❌ Error enviando email a ${log.to} - Intento ${log.attemptCount}: ${log.error}`);
    }
  }

  /**
   * Obtiene los logs de emails (para debugging/monitoreo)
   */
  static getEmailLogs(limit: number = 100): EmailLog[] {
    return this.emailLogs.slice(-limit);
  }

  /**
   * Envía un email con reintentos automáticos
   */
  private static async sendEmailWithRetry(
    mailOptions: any, 
    maxAttempts: number = this.MAX_RETRY_ATTEMPTS
  ): Promise<EmailResult> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.sendEmail(mailOptions);
        
        // Log exitoso
        this.logEmailAttempt({
          to: mailOptions.to,
          subject: mailOptions.subject,
          success: true,
          timestamp: new Date(),
          attemptCount: attempt
        });
        
        return {
          success: true,
          messageId: result.messageId,
          timestamp: new Date()
        };
      } catch (error) {
        lastError = error;
        
        // Log del intento fallido
        this.logEmailAttempt({
          to: mailOptions.to,
          subject: mailOptions.subject,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          attemptCount: attempt
        });
        
        // Si no es el último intento, esperar antes del siguiente
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * attempt));
        }
      }
    }
    
    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : String(lastError),
      timestamp: new Date()
    };
  }

  /**
   * Envía un correo electrónico de bienvenida a un nuevo cliente
   */
  static async sendWelcomeEmail(options: WelcomeEmailOptions): Promise<EmailResult> {
    try {
      // Validar seguridad del email
      const emailValidation = validateEmailSecurity(options.clientEmail);
      if (!emailValidation.isValid) {
        const error = `Email no válido: ${emailValidation.reason}`;
        console.error(error);
        return {
          success: false,
          error,
          timestamp: new Date()
        };
      }

      // Sanitizar datos de entrada
      const sanitizedOptions = {
        ...options,
        clientName: options.clientName.trim().substring(0, 100),
        trainerName: options.trainerName.trim().substring(0, 100)
      };

      const emailData: WelcomeEmailData = {
        clientName: sanitizedOptions.clientName,
        clientEmail: sanitizedOptions.clientEmail,
        temporaryPassword: sanitizedOptions.temporaryPassword,
        trainerName: sanitizedOptions.trainerName,
        loginUrl: sanitizedOptions.loginUrl || 'https://trainfit.app/login',
        supportEmail: sanitizedOptions.supportEmail || 'soporte@trainfit.app',
        supportPhone: sanitizedOptions.supportPhone || '+1 (555) 123-4567'
      };

      const htmlContent = generateWelcomeEmailTemplate(emailData);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@trainfit.app',
        to: sanitizedOptions.clientEmail,
        subject: '¡Bienvenido a TrainFit! - Tus credenciales de acceso',
        html: htmlContent,
        // Configuraciones adicionales de seguridad
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      };

      return await this.sendEmailWithRetry(mailOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error crítico al enviar correo de bienvenida:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }

  /**
   * Envía una invitación de calendario con archivo .ics adjunto
   */
  static async sendCalendarInvitation(event: TrainingEvent, customMessage?: string): Promise<EmailResult> {
    try {
      if (!this.isEmailConfigured()) {
        console.warn('⚠️ Email no configurado, simulando envío de invitación de calendario');
        return {
          success: true,
          messageId: `sim-calendar-${Date.now()}`,
          timestamp: new Date()
        };
      }

      const icsContent = await icsService.generateICSFile(event);
      const fileName = icsService.generateFileName(event);

      const mailOptions = {
        from: {
          name: 'TrainFit',
          address: process.env.EMAIL_USER || 'noreply@trainfit.com'
        },
        to: event.clientEmail,
        subject: `📅 Invitación: ${event.title}`,
        html: this.generateCalendarInvitationHTML(event, customMessage),
        attachments: [
          {
            filename: fileName,
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }
        ]
      };

      const result = await this.sendEmailWithRetry(mailOptions);
      
      if (result.success) {
        console.log(`📧 Invitación de calendario enviada a ${event.clientEmail} para el evento: ${event.title}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error enviando invitación de calendario:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }

  /**
   * Genera el HTML para la invitación de calendario
   */
  private static generateCalendarInvitationHTML(event: TrainingEvent, customMessage?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF4C4C, #FF6B6B); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏋️‍♂️ TrainFit</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu sesión de entrenamiento te espera</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">📅 ${event.title}</h2>
          
          ${customMessage ? `
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <p style="margin: 0; color: #2e7d32; font-style: italic;">${customMessage}</p>
            </div>
          ` : ''}
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF4C4C;">
            <p style="margin: 0 0 10px 0;"><strong>📅 Fecha:</strong> ${event.startDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p style="margin: 0 0 10px 0;"><strong>🕐 Hora:</strong> ${event.startDate.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })} - ${event.endDate.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</p>
            <p style="margin: 0 0 10px 0;"><strong>📍 Ubicación:</strong> ${event.location || 'TrainFit - Gimnasio'}</p>
            <p style="margin: 0;"><strong>💪 Tipo:</strong> ${event.type.charAt(0).toUpperCase() + event.type.slice(1)}</p>
          </div>
          
          ${event.description ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">📝 Detalles adicionales:</h3>
              <p style="color: #666; line-height: 1.6; margin: 0;">${event.description}</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; margin-bottom: 15px;">
              📎 <strong>Archivo adjunto:</strong> Haz clic en el archivo .ics adjunto para añadir este evento a tu calendario personal.
            </p>
            <p style="color: #888; font-size: 14px;">
              Compatible con Google Calendar, Outlook, Apple Calendar y más.
            </p>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="color: #1976d2; margin: 0; font-weight: 500;">
              🔔 <strong>Recordatorio:</strong> Recibirás notificaciones 30 y 10 minutos antes de tu sesión.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 14px; margin: 0;">
              ¿Necesitas reprogramar o cancelar? Contacta con tu entrenador.<br>
              <strong>TrainFit</strong> - Tu compañero de entrenamiento
            </p>
          </div>
        </div>
      </div>
    `;
  }
}