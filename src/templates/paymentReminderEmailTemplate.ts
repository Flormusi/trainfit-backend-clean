export interface PaymentReminderEmailData {
  clientName: string;
  clientEmail: string;
  trainerName: string;
  supportEmail?: string;
  supportPhone?: string;
  mpLink?: string;
  cbu?: string;
  alias?: string;
  bankName?: string;
  monthlyFee?: number;
}

export const generatePaymentReminderEmailTemplate = (data: PaymentReminderEmailData): string => {
  const {
    clientName,
    trainerName,
    supportEmail = 'soporte@trainfit.com',
    supportPhone = '+54 11 1234-5678',
    mpLink,
    cbu,
    alias,
    bankName,
    monthlyFee
  } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Pago - TrainFit</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
      .header { padding: 30px 20px !important; }
      .payment-box { padding: 20px !important; }
      .button { padding: 12px 20px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
  <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <!-- Header con logo TrainFit -->
    <div class="header" style="background: linear-gradient(135deg, #000000 0%, #333333 100%); color: white; padding: 40px 30px; text-align: center;">
      <div style="margin-bottom: 20px;">
        <svg width="200" height="50" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
          <defs>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100" y2="0%">
              <stop offset="0%" style="stop-color:#ff4444;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#cc0000;stop-opacity:1" />
            </linearGradient>
          </defs>
          
          <!-- Icono de pesa -->
          <g transform="translate(10, 12)">
            <rect x="0" y="10" width="6" height="6" fill="url(#redGradient)" rx="1"/>
            <rect x="8" y="8" width="10" height="10" fill="url(#redGradient)" rx="2"/>
            <rect x="20" y="12" width="4" height="2" fill="url(#redGradient)"/>
            <rect x="26" y="8" width="10" height="10" fill="url(#redGradient)" rx="2"/>
            <rect x="38" y="10" width="6" height="6" fill="url(#redGradient)" rx="1"/>
          </g>
          
          <!-- Texto TrainFit -->
          <text x="60" y="32" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">TrainFit</text>
        </svg>
      </div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Recordatorio de Pago</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu plataforma de entrenamiento personal</p>
    </div>

    <!-- Contenido principal -->
    <div class="content" style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #333; font-size: 24px; margin: 0 0 10px 0; font-weight: 600;">Hola ${clientName} 💳</h2>
        <p style="color: #666; font-size: 16px; margin: 0; line-height: 1.5;">
          Esperamos que estés bien y disfrutando de tus entrenamientos.
        </p>
      </div>

      <!-- Mensaje principal del recordatorio -->
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💰 Recordatorio de Pago</h3>
        <p style="margin: 0 0 15px 0; color: #333; font-size: 16px; line-height: 1.6;">
          Te escribimos para recordarte que tienes un pago pendiente con tu entrenador <strong>${trainerName}</strong>.
        </p>
        ${monthlyFee ? `<p style="margin: 0; color: #333; font-size: 16px; font-weight: 700;">Monto: $${monthlyFee.toLocaleString('es-AR')}</p>` : ''}
      </div>

      <!-- Métodos de pago -->
      ${(mpLink || cbu || alias) ? `
      <div style="margin: 25px 0;">
        <h3 style="color: #333; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">💳 Cómo pagar</h3>
        ${mpLink ? `
        <div style="background: #009ee3; border-radius: 10px; padding: 20px; margin-bottom: 12px; text-align: center;">
          <p style="color: #fff; font-weight: 700; font-size: 16px; margin: 0 0 12px 0;">🟦 Mercado Pago</p>
          <a href="${mpLink}" style="display: inline-block; background: #fff; color: #009ee3; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">Pagar con Mercado Pago</a>
        </div>` : ''}
        ${(cbu || alias) ? `
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 10px; padding: 20px; margin-bottom: 12px;">
          <p style="color: #333; font-weight: 700; font-size: 16px; margin: 0 0 12px 0;">🏦 Transferencia bancaria</p>
          ${bankName ? `<p style="margin: 4px 0; color: #555; font-size: 14px;"><strong>Banco:</strong> ${bankName}</p>` : ''}
          ${cbu ? `<p style="margin: 4px 0; color: #555; font-size: 14px;"><strong>CBU:</strong> <span style="font-family: monospace; font-size: 13px;">${cbu}</span></p>` : ''}
          ${alias ? `<p style="margin: 4px 0; color: #555; font-size: 14px;"><strong>Alias:</strong> <span style="font-family: monospace;">${alias}</span></p>` : ''}
        </div>` : ''}
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px;">
          <p style="color: #166534; font-size: 14px; margin: 0;">💵 También podés pagar en efectivo. Coordiná con tu entrenador.</p>
        </div>
      </div>` : ''}

      <!-- Información importante -->
      <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.5;">
          <strong>📝 Nota:</strong> Si ya realizaste el pago, registralo en la app de TrainFit para que tu entrenador lo vea. Tu entrenador confirmará la recepción en breve.
        </p>
      </div>

      <!-- Recordatorio de servicios -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🏋️‍♂️ Tu Plan de Entrenamiento</h3>
        <p style="color: #666; margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
          Mantener tu pago al día te permite seguir disfrutando de:
        </p>
        <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
          <li style="margin-bottom: 6px;">Rutinas personalizadas por ${trainerName}</li>
          <li style="margin-bottom: 6px;">Seguimiento de tu progreso</li>
          <li style="margin-bottom: 6px;">Comunicación directa con tu entrenador</li>
          <li style="margin-bottom: 0;">Actualizaciones de tu plan</li>
        </ul>
      </div>

      <!-- Información de contacto -->
      <div style="background: #e9ecef; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
        <h3 style="color: #495057; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">💬 ¿Tienes alguna consulta?</h3>
        <p style="color: #666; margin: 0 0 12px 0; font-size: 13px; line-height: 1.4;">
          Puedes contactar a tu entrenador <strong>${trainerName}</strong> o a nuestro equipo de soporte:
        </p>
        <p style="margin: 8px 0; color: #333; font-size: 13px;">
          📧 <a href="mailto:${supportEmail}" style="color: #ff4444; text-decoration: none;">${supportEmail}</a>
        </p>
        <p style="margin: 8px 0; color: #333; font-size: 13px;">
          📞 <a href="tel:${supportPhone}" style="color: #ff4444; text-decoration: none;">${supportPhone}</a>
        </p>
      </div>

      <!-- Mensaje de cierre -->
      <div style="text-align: center; margin: 30px 0 20px 0; padding: 15px;">
        <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
          Gracias por tu comprensión y por ser parte de TrainFit.<br>
          <strong>¡Seguimos trabajando juntos hacia tus objetivos! 💪</strong>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #dee2e6;">
      <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.4;">
        Este es un mensaje automático de TrainFit. Por favor, no respondas a este email.<br>
        Si tienes alguna consulta, utiliza nuestros canales de soporte mencionados arriba.
      </p>
    </div>
  </div>
</body>
</html>
`;
};