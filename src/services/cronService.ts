import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { EmailService } from './emailService';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export class CronService {
  
  /**
   * Inicializar todos los trabajos cron
   */
  static initializeCronJobs() {
    console.log('🕐 Inicializando trabajos cron...');
    
    // Ejecutar verificación de pagos vencidos todos los días a las 9:00 AM
    this.schedulePaymentReminders();
    
    // Limpiar notificaciones antiguas cada domingo a las 2:00 AM
    this.scheduleNotificationCleanup();
    
    console.log('✅ Trabajos cron inicializados correctamente');
  }

  /**
   * Programar recordatorios de pago automáticos
   * Se ejecuta todos los días a las 9:00 AM
   */
  private static schedulePaymentReminders() {
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Ejecutando verificación de recordatorios de pago...');
      
      try {
        await this.checkAndSendPaymentReminders();
      } catch (error) {
        console.error('Error en verificación de pagos:', error);
      }
    }, {
      timezone: 'America/Argentina/Buenos_Aires'
    });
  }

  /**
   * Programar limpieza de notificaciones antiguas
   * Se ejecuta todos los domingos a las 2:00 AM
   */
  private static scheduleNotificationCleanup() {
    cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Ejecutando limpieza de notificaciones antiguas...');
      
      try {
        await NotificationService.cleanupOldNotifications();
      } catch (error) {
        console.error('Error en limpieza de notificaciones:', error);
      }
    }, {
      timezone: 'America/Argentina/Buenos_Aires'
    });
  }

  /**
   * Verificar y enviar recordatorios de pago
   */
  private static async checkAndSendPaymentReminders() {
    try {
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
      const oneDayAgo = new Date(today.getTime() - (1 * 24 * 60 * 60 * 1000));
      const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

      // Buscar todas las suscripciones activas que necesitan recordatorios
      const subscriptionsNeedingReminders = await prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            // Pagos que vencen en 3 días
            {
              currentPeriodEnd: {
                gte: today,
                lte: threeDaysFromNow
              }
            },
            // Pagos vencidos hace 1 día
            {
              currentPeriodEnd: {
                gte: oneDayAgo,
                lt: today
              }
            },
            // Pagos vencidos hace 7 días
            {
              currentPeriodEnd: {
                gte: sevenDaysAgo,
                lt: oneDayAgo
              }
            }
          ]
        },
        include: {
          user: {
            include: {
              clientProfile: true,
              trainersAsClient: {
                include: {
                  trainer: {
                    include: {
                      trainerProfile: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      console.log(`📊 Encontradas ${subscriptionsNeedingReminders.length} suscripciones que necesitan recordatorios`);

      for (const subscription of subscriptionsNeedingReminders) {
        await this.processPaymentReminder(subscription);
      }

    } catch (error) {
      console.error('Error verificando recordatorios de pago:', error);
    }
  }

  /**
   * Procesar recordatorio de pago individual
   */
  private static async processPaymentReminder(subscription: any) {
    try {
      const user = subscription.user;
      const dueDate = new Date(subscription.currentPeriodEnd);
      const today = new Date();
      const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Determinar el tipo de recordatorio
      let reminderType: 'upcoming' | 'overdue' | 'urgent';
      let emailSubject: string;
      let notificationTitle: string;

      if (daysDifference > 0) {
        reminderType = 'upcoming';
        emailSubject = `Recordatorio: Tu pago vence en ${daysDifference} días - TrainFit`;
        notificationTitle = `Pago próximo a vencer (${daysDifference} días)`;
      } else if (daysDifference >= -7) {
        reminderType = 'overdue';
        emailSubject = `Pago vencido hace ${Math.abs(daysDifference)} días - TrainFit`;
        notificationTitle = `Pago vencido (${Math.abs(daysDifference)} días)`;
      } else {
        reminderType = 'urgent';
        emailSubject = `URGENTE: Pago vencido hace ${Math.abs(daysDifference)} días - TrainFit`;
        notificationTitle = `URGENTE: Pago vencido (${Math.abs(daysDifference)} días)`;
      }

      // Verificar si ya se envió un recordatorio hoy para evitar spam
      const existingNotificationToday = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'payment_reminder',
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
          }
        }
      });

      if (existingNotificationToday) {
        console.log(`⏭️  Recordatorio ya enviado hoy para usuario ${user.email}`);
        return;
      }

      // Obtener información del entrenador si existe
      let trainerName = 'tu entrenador';
      if (user.trainersAsClient && user.trainersAsClient.length > 0) {
        const trainerProfile = user.trainersAsClient[0].trainer.trainerProfile;
        trainerName = trainerProfile?.name || user.trainersAsClient[0].trainer.name || 'tu entrenador';
      }

      // Enviar email al cliente
      const emailSent = await this.sendPaymentReminderEmail(
        user.email,
        user.clientProfile?.name || user.name || 'Cliente',
        trainerName,
        dueDate,
        reminderType,
        emailSubject
      );

      // Crear notificación en el dashboard del cliente
      if (emailSent) {
        await NotificationService.createNotification({
          userId: user.id,
          title: notificationTitle,
          message: this.getNotificationMessage(reminderType, daysDifference, dueDate),
          type: 'payment_reminder'
        });

        // Notificar también al entrenador si existe
        if (user.trainersAsClient && user.trainersAsClient.length > 0) {
          const trainerId = user.trainersAsClient[0].trainerId;
          await NotificationService.createNotification({
            userId: trainerId,
            title: `Cliente con pago ${reminderType === 'upcoming' ? 'próximo a vencer' : 'vencido'}`,
            message: `${user.clientProfile?.name || user.name} tiene un pago ${reminderType === 'upcoming' ? `que vence en ${daysDifference} días` : `vencido hace ${Math.abs(daysDifference)} días`}`,
            type: 'payment_reminder',
            clientId: user.id
          });
        }

        console.log(`✅ Recordatorio enviado a ${user.email} (${reminderType})`);
      }

    } catch (error) {
      console.error(`Error procesando recordatorio para suscripción ${subscription.id}:`, error);
    }
  }

  /**
   * Enviar email de recordatorio de pago personalizado
   */
  private static async sendPaymentReminderEmail(
    clientEmail: string,
    clientName: string,
    trainerName: string,
    dueDate: Date,
    reminderType: 'upcoming' | 'overdue' | 'urgent',
    subject: string
  ): Promise<boolean> {
    const formattedDueDate = dueDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let emailContent = '';
    
    if (reminderType === 'upcoming') {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">TrainFit</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Tu plataforma de entrenamiento personal</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">🔔 Recordatorio de Pago</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola <strong>${clientName}</strong>,</p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Este es un recordatorio amistoso de que tu próximo pago con <strong>${trainerName}</strong> 
              vence el <strong>${formattedDueDate}</strong>.
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>💡 Tip:</strong> Realiza tu pago con anticipación para evitar interrupciones en tu entrenamiento.
              </p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Puedes realizar tu pago contactando directamente a tu entrenador o a través de los métodos de pago acordados.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/client/dashboard" 
                 style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Ir a mi Dashboard
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Si ya realizaste el pago, puedes ignorar este mensaje.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              Saludos,<br>
              <strong>El equipo de TrainFit</strong>
            </p>
          </div>
        </div>
      `;
    } else if (reminderType === 'overdue') {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">TrainFit</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Tu plataforma de entrenamiento personal</p>
            </div>
            
            <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ Pago Vencido</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola <strong>${clientName}</strong>,</p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Notamos que tu pago con <strong>${trainerName}</strong> venció el <strong>${formattedDueDate}</strong>.
            </p>
            
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;">
                <strong>⚠️ Importante:</strong> Para continuar disfrutando de todos los beneficios de tu entrenamiento, 
                por favor realiza tu pago lo antes posible.
              </p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Contacta a tu entrenador para coordinar el pago y evitar cualquier interrupción en tu plan de entrenamiento.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/client/dashboard" 
                 style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Ir a mi Dashboard
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Si ya realizaste el pago, por favor ignora este mensaje.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              Saludos,<br>
              <strong>El equipo de TrainFit</strong>
            </p>
          </div>
        </div>
      `;
    } else { // urgent
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: 2px solid #dc2626;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">TrainFit</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Tu plataforma de entrenamiento personal</p>
            </div>
            
            <h2 style="color: #dc2626; margin-bottom: 20px;">🚨 PAGO URGENTE REQUERIDO</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola <strong>${clientName}</strong>,</p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Tu pago con <strong>${trainerName}</strong> venció el <strong>${formattedDueDate}</strong> 
              y requiere atención inmediata.
            </p>
            
            <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #991b1b; font-weight: bold; font-size: 16px;">
                🚨 ACCIÓN REQUERIDA: Tu cuenta puede ser suspendida si no se realiza el pago pronto.
              </p>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              <strong>Por favor contacta inmediatamente a tu entrenador para regularizar tu situación.</strong>
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/client/dashboard" 
                 style="background-color: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                PAGAR AHORA
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              Saludos,<br>
              <strong>El equipo de TrainFit</strong>
            </p>
          </div>
        </div>
      `;
    }

    const result = await EmailService.sendEmail({
      to: clientEmail,
      subject: subject,
      html: emailContent
    });
    return result.success;
  }

  /**
   * Obtener mensaje de notificación según el tipo de recordatorio
   */
  private static getNotificationMessage(reminderType: 'upcoming' | 'overdue' | 'urgent', daysDifference: number, dueDate: Date): string {
    const formattedDate = dueDate.toLocaleDateString('es-ES');
    
    if (reminderType === 'upcoming') {
      return `Tu próximo pago vence en ${daysDifference} días (${formattedDate}). Recuerda realizarlo a tiempo para evitar interrupciones.`;
    } else if (reminderType === 'overdue') {
      return `Tu pago venció hace ${Math.abs(daysDifference)} días (${formattedDate}). Por favor, contacta a tu entrenador para regularizar tu situación.`;
    } else {
      return `URGENTE: Tu pago venció hace ${Math.abs(daysDifference)} días (${formattedDate}). Tu cuenta puede ser suspendida. Contacta inmediatamente a tu entrenador.`;
    }
  }

  /**
   * Método manual para probar recordatorios (solo para desarrollo)
   */
  static async testPaymentReminders(): Promise<void> {
    console.log('🧪 Ejecutando prueba de recordatorios de pago...');
    await this.checkAndSendPaymentReminders();
    console.log('✅ Prueba de recordatorios completada');
  }
}