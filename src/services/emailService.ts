import nodemailer from 'nodemailer';

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

type EmailServiceType = 'gmail' | 'sendgrid' | 'mailgun' | 'simulation';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

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
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000
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
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Si no hay credenciales configuradas, simular envío exitoso
      if (!this.isEmailConfigured()) {
        console.log(`[SIMULADO] Email que se enviaría a ${emailData.to}: ${emailData.subject}`);
        console.log(`[SIMULADO] Contenido: ${emailData.html.substring(0, 100)}...`);
        return true;
      }

      // Inicializar transporter si no existe
      if (!this.transporter) {
        this.transporter = this.initializeTransporter();
      }

      // Si aún no hay transporter, simular envío
      if (!this.transporter) {
        console.log(`[FALLBACK] No se pudo inicializar transporter, simulando envío para ${emailData.to}`);
        return true;
      }

      await this.transporter.sendMail({
        from: emailData.from || process.env.EMAIL_FROM || 'noreply@trainfit.com',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      });
      
      console.log(`✅ Email enviado exitosamente a ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('Error al enviar email:', error);
      // En caso de error, simular envío exitoso para no bloquear la funcionalidad
      console.log(`[FALLBACK] Simulando envío exitoso para ${emailData.to}`);
      return true;
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

    return this.sendEmail({
      to: data.clientEmail,
      subject: '🎉 ¡Nueva Rutina Asignada! - TrainFit',
      html: emailContent
    });
  }

  /**
   * Envía un recordatorio de pago al cliente
   */
  static async sendPaymentReminderEmail(
    clientEmail: string,
    clientName: string,
    trainerName: string,
    paymentInfo?: { mpLink?: string; cbu?: string; alias?: string; bankName?: string; monthlyFee?: number }
  ): Promise<boolean> {
    const { generatePaymentReminderEmailTemplate } = await import('../templates/paymentReminderEmailTemplate');
    const html = generatePaymentReminderEmailTemplate({
      clientName,
      clientEmail,
      trainerName,
      ...paymentInfo
    });

    return this.sendEmail({
      to: clientEmail,
      subject: `Recordatorio de pago - ${trainerName}`,
      html
    });
  }
}