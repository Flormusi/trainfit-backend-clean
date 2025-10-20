const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar el transportador de Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Datos de prueba
const testData = {
  clientName: 'María Florencia',
  clientEmail: 'florenciamusitani@gmail.com',
  routineName: 'Rutina de Fuerza Avanzada',
  trainerName: 'Carlos Trainer',
  dashboardUrl: 'http://localhost:5173/client/dashboard',
  routineUrl: 'http://localhost:5173/client/routine/123',
  startDate: '2024-01-15',
  endDate: '2024-02-15'
};

// Formatear fechas
const formattedStartDate = testData.startDate ? new Date(testData.startDate).toLocaleDateString('es-ES') : null;
const formattedEndDate = testData.endDate ? new Date(testData.endDate).toLocaleDateString('es-ES') : null;

const dateInfo = formattedStartDate && formattedEndDate 
  ? `<p style="margin: 8px 0; color: #333;"><strong>Fecha de inicio:</strong> ${formattedStartDate}</p>
     <p style="margin: 8px 0; color: #333;"><strong>Fecha de finalización:</strong> ${formattedEndDate}</p>`
  : '';

const routineLink = testData.routineUrl 
  ? `<div style="text-align: center; margin: 30px 0;">
       <a href="${testData.routineUrl}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background-color 0.3s ease; box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);">
         🏋️‍♀️ Ver Mi Rutina
       </a>
     </div>`
  : '';

// HTML del email con el nuevo logo simplificado
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
    <div style="background: #000000; color: white; padding: 40px 30px; text-align: center;">
      <div style="margin-bottom: 20px;">
        <div style="display: inline-block; background: #000000; padding: 20px; border-radius: 10px;">
          <div style="font-family: 'Arial Black', Arial, sans-serif; font-size: 36px; font-weight: 900; color: #ff3b30; letter-spacing: 2px; text-transform: uppercase; line-height: 1;">
            TRAINFIT
          </div>
        </div>
      </div>
      <h2 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: #ff3b30;">Nueva Rutina Asignada</h2>
    </div>
    
    <!-- Contenido principal -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px; color: #374151;">
        Hola <strong style="color: #dc2626;">${testData.clientName}</strong>,
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #6b7280;">
        ¡Excelentes noticias! Tu entrenador <strong style="color: #dc2626;">${testData.trainerName}</strong> te ha asignado una nueva rutina personalizada.
      </p>
      
      <!-- Card de la rutina -->
      <div style="background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); border: 2px solid #dc2626; padding: 30px; margin: 30px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 12px 20px; border-radius: 25px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px;">
            Nueva Rutina
          </div>
          <h3 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: bold;">${testData.routineName}</h3>
        </div>
        ${dateInfo}
      </div>
      
      ${routineLink}
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">También puedes acceder desde tu dashboard</p>
        <a href="${testData.dashboardUrl}" style="color: #dc2626; text-decoration: none; font-weight: 600; font-size: 14px; border-bottom: 1px solid #dc2626;">Mi Dashboard Personal →</a>
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
        <div style="font-family: 'Arial Black', Arial, sans-serif; font-size: 24px; font-weight: 900; color: #ff3b30; letter-spacing: 2px; text-transform: uppercase;">
          TRAINFIT
        </div>
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

// Función para enviar el email
async function sendTestEmail() {
  try {
    console.log('🚀 Enviando email de prueba con el nuevo logo...');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@trainfit.com',
      to: testData.clientEmail,
      subject: '🎉 ¡Nueva Rutina Asignada! - TrainFit (Prueba Logo Final)',
      html: emailContent
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Enviado a:', testData.clientEmail);
    console.log('🎨 Logo: Texto TRAINFIT en rojo sobre fondo negro');
    
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
  }
}

// Ejecutar la prueba
sendTestEmail();