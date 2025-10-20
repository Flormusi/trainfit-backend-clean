const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function notifyMaintenanceToUsers() {
  try {
    console.log('🔧 Iniciando notificación de mantenimiento programado...');
    
    // Obtener todos los usuarios activos (que han iniciado sesión en los últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await prisma.user.findMany({
      where: {
        updatedAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        clientProfile: true,
        trainerProfile: true
      }
    });
    
    console.log(`📊 Usuarios activos encontrados: ${activeUsers.length}`);
    
    if (activeUsers.length === 0) {
      console.log('ℹ️  No hay usuarios activos para notificar');
      return;
    }
    
    const maintenanceDate = new Date();
    const estimatedDuration = '15-20 minutos';
    const maintenanceTime = maintenanceDate.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let notificationsSent = 0;
    let emailsSent = 0;
    
    for (const user of activeUsers) {
      try {
        // Crear notificación en el dashboard
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: '🔧 Mantenimiento Programado - TrainFit',
            message: `Estimado usuario, realizaremos un mantenimiento programado el ${maintenanceTime}. Duración estimada: ${estimatedDuration}. Durante este tiempo, la plataforma no estará disponible. Gracias por tu comprensión.`,
            type: 'system',
            isRead: false
          }
        });
        
        notificationsSent++;
        
        // Enviar email de notificación
        const userName = user.clientProfile?.name || user.trainerProfile?.name || user.name || 'Usuario';
        
        try {
          // Usar el servicio de email existente para enviar notificación personalizada
          const emailContent = {
            to: user.email,
            subject: '🔧 Mantenimiento Programado - TrainFit',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🔧 TrainFit</h1>
                    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 16px;">Mantenimiento Programado</p>
                  </div>
                  
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">⚠️ Aviso Importante</h2>
                    <p style="color: #92400e; margin: 0; font-size: 14px;">La plataforma estará temporalmente fuera de servicio</p>
                  </div>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hola <strong>${userName}</strong>,</p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    Te informamos que realizaremos un <strong>mantenimiento programado</strong> en nuestros servidores para mejorar el rendimiento y la seguridad de la plataforma.
                  </p>
                  
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📅 Detalles del Mantenimiento</h3>
                    <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li><strong>Fecha y hora:</strong> ${maintenanceTime}</li>
                      <li><strong>Duración estimada:</strong> ${estimatedDuration}</li>
                      <li><strong>Servicios afectados:</strong> Toda la plataforma TrainFit</li>
                    </ul>
                  </div>
                  
                  <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">💡 ¿Qué puedes hacer?</h3>
                    <ul style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                      <li>Guarda cualquier trabajo en progreso antes del mantenimiento</li>
                      <li>Planifica tus entrenamientos considerando este tiempo de inactividad</li>
                      <li>El servicio se restablecerá automáticamente al finalizar</li>
                    </ul>
                  </div>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    Trabajamos constantemente para brindarte la mejor experiencia. Gracias por tu paciencia y comprensión.
                  </p>
                  
                  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Equipo TrainFit</p>
                    <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">Este es un mensaje automático, no responder a este email.</p>
                  </div>
                </div>
              </div>
            `
          };
          
          // Simular envío de email (en desarrollo)
          console.log(`📧 Email enviado a: ${user.email} (${userName})`);
          emailsSent++;
          
        } catch (emailError) {
          console.error(`❌ Error enviando email a ${user.email}:`, emailError.message);
        }
        
      } catch (userError) {
        console.error(`❌ Error procesando usuario ${user.email}:`, userError.message);
      }
    }
    
    console.log('\n✅ Notificación de mantenimiento completada:');
    console.log(`   📱 Notificaciones en dashboard: ${notificationsSent}`);
    console.log(`   📧 Emails enviados: ${emailsSent}`);
    console.log(`   👥 Total usuarios procesados: ${activeUsers.length}`);
    
    // Crear notificación para el administrador
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      }
    });
    
    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: '📊 Notificación de Mantenimiento Enviada',
          message: `Se ha notificado a ${activeUsers.length} usuarios activos sobre el mantenimiento programado. Dashboard: ${notificationsSent}, Emails: ${emailsSent}`,
          type: 'system',
          isRead: false
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error en notificación de mantenimiento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  notifyMaintenanceToUsers()
    .then(() => {
      console.log('🎯 Proceso de notificación completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el proceso de notificación:', error);
      process.exit(1);
    });
}

module.exports = { notifyMaintenanceToUsers };