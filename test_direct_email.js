const nodemailer = require('nodemailer');
require('dotenv').config();

async function testDirectEmail() {
  try {
    console.log('🔧 Configurando transportador de Gmail...');
    
    // Configurar el transportador de Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('✅ Transportador configurado');
    console.log('📧 Verificando conexión con Gmail...');
    
    // Verificar la conexión
    await transporter.verify();
    console.log('✅ Conexión con Gmail exitosa');

    // Datos de prueba
    const emailData = {
      clientName: 'Maria Florencia Musitani',
      trainerName: 'Maga',
      routineName: 'Rutina Julio (Dia 1)',
      startDate: '9/8/2025',
      endDate: '9/9/2025',
      dashboardUrl: 'http://localhost:5173/client/dashboard'
    };

    console.log('📝 Construyendo contenido del email...');

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
          
          <!-- Header con logo TrainFit -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 40px 30px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <svg width="180" height="50" viewBox="0 0 180 50" xmlns="http://www.w3.org/2000/svg">
                <!-- TRAINFIT text como una sola palabra -->
                <text x="10" y="32" 
                      font-family="'Segoe UI', Arial, sans-serif" 
                      font-size="28" 
                      font-weight="900" 
                      fill="white"
                      letter-spacing="1px">TRAINFIT</text>
                <!-- Icono de pesa minimalista -->
                <g transform="translate(150, 15)">
                  <circle cx="5" cy="10" r="3" fill="white"/>
                  <rect x="8" y="9" width="8" height="2" fill="white"/>
                  <circle cx="16" cy="10" r="3" fill="white"/>
                </g>
              </svg>
            </div>
            <h2 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.3px;">Nueva Rutina Asignada</h2>
          </div>
          
          <!-- Contenido principal -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px; color: #374151;">
              Hola <strong style="color: #dc2626;">${emailData.clientName}</strong>,
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #6b7280;">
              ¡Excelentes noticias! Tu entrenador <strong style="color: #dc2626;">${emailData.trainerName}</strong> te ha asignado una nueva rutina personalizada.
            </p>
            
            <!-- Card de la rutina -->
            <div style="background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); border: 2px solid #dc2626; padding: 30px; margin: 30px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 12px 20px; border-radius: 25px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px;">
                  Nueva Rutina
                </div>
                <h3 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: bold;">${emailData.routineName}</h3>
              </div>
              <p style="margin: 8px 0; color: #333; text-align: center;"><strong>Fecha de inicio:</strong> ${emailData.startDate}</p>
              <p style="margin: 8px 0; color: #333; text-align: center;"><strong>Fecha de finalización:</strong> ${emailData.endDate}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.3s ease; box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);">
                🏋️‍♀️ Ver Mi Rutina
              </a>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">También puedes acceder desde tu dashboard</p>
              <a href="${emailData.dashboardUrl}" style="color: #dc2626; text-decoration: none; font-weight: 600; font-size: 14px; border-bottom: 1px solid #dc2626;">Mi Dashboard Personal →</a>
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
          <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 40px 30px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <svg width="120" height="33" viewBox="0 0 180 50" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.9;">
                <!-- TRAINFIT text como una sola palabra -->
                <text x="10" y="32" 
                      font-family="'Segoe UI', Arial, sans-serif" 
                      font-size="28" 
                      font-weight="900" 
                      fill="#ff3b30"
                      letter-spacing="1px">TRAINFIT</text>
                <!-- Icono de pesa minimalista -->
                <g transform="translate(150, 15)">
                  <circle cx="5" cy="10" r="3" fill="#ff3b30"/>
                  <rect x="8" y="9" width="8" height="2" fill="#ff3b30"/>
                  <circle cx="16" cy="10" r="3" fill="#ff3b30"/>
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

    console.log('📤 Enviando email...');

    // Enviar el email
    const info = await transporter.sendMail({
      from: `"TrainFit" <${process.env.EMAIL_USER}>`,
      to: 'florenciamusitani@gmail.com',
      subject: '🎉 ¡Nueva Rutina Asignada! - TrainFit',
      html: emailContent
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 ID del mensaje:', info.messageId);
    console.log('🎯 Destinatario:', 'florenciamusitani@gmail.com');
    console.log('📋 Rutina:', emailData.routineName);
    console.log('👨‍💼 Entrenador:', emailData.trainerName);

  } catch (error) {
    console.error('❌ Error al enviar email:', error);
  }
}

// Ejecutar la prueba
testDirectEmail();