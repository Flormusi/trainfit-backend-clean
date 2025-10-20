"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWelcomeEmailTemplate = void 0;
const generateWelcomeEmailTemplate = (data) => {
    const { clientName, clientEmail, temporaryPassword, trainerName, loginUrl, supportEmail = 'soporte@trainfit.com', supportPhone = '+54 11 1234-5678' } = data;
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a TrainFit!</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 20px !important; }
      .header { padding: 30px 20px !important; }
      .credentials-box { padding: 20px !important; }
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
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">¡Bienvenido a TrainFit!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu plataforma de entrenamiento personal</p>
    </div>

    <!-- Contenido principal -->
    <div class="content" style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #333; font-size: 24px; margin: 0 0 10px 0; font-weight: 600;">¡Hola ${clientName}! 👋</h2>
        <p style="color: #666; font-size: 16px; margin: 0; line-height: 1.5;">
          Tu entrenador <strong>${trainerName}</strong> te ha agregado a TrainFit. <br>
          Aquí tienes tus credenciales de acceso:
        </p>
      </div>

      <!-- Caja de credenciales -->
      <div class="credentials-box" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #dee2e6; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
        <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">🔐 Tus Credenciales de Acceso</h3>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #ff4444;">
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; font-weight: 500;">📧 Usuario (Email):</p>
          <p style="margin: 0; color: #333; font-size: 16px; font-weight: 600; word-break: break-all;">${clientEmail}</p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #ff4444;">
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; font-weight: 500;">🔑 Contraseña Temporal:</p>
          <p style="margin: 0; color: #333; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace; background: #f8f9fa; padding: 8px; border-radius: 4px; letter-spacing: 1px;">${temporaryPassword}</p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.4;">
            ⚠️ <strong>Importante:</strong> Por tu seguridad, te recomendamos cambiar esta contraseña en tu primer acceso.
          </p>
        </div>
      </div>

      <!-- Instrucciones de primer acceso -->
      <div style="background: #e7f3ff; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Instrucciones para tu Primer Acceso</h3>
        <ol style="color: #333; margin: 0; padding-left: 20px; line-height: 1.6;">
          <li style="margin-bottom: 8px;">Haz clic en el botón "Acceder a TrainFit" de abajo</li>
          <li style="margin-bottom: 8px;">Ingresa tu email y la contraseña temporal proporcionada</li>
          <li style="margin-bottom: 8px;">Cambia tu contraseña por una personal y segura</li>
          <li style="margin-bottom: 8px;">Completa tu perfil con tus datos personales</li>
          <li style="margin-bottom: 0;">¡Comienza a entrenar con las rutinas de tu entrenador!</li>
        </ol>
      </div>

      <!-- Botón de acceso -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${loginUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3); transition: all 0.3s ease;">
          🚀 Acceder a TrainFit
        </a>
      </div>

      <!-- Información de soporte -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💬 ¿Necesitas Ayuda?</h3>
        <p style="color: #666; margin: 0 0 15px 0; line-height: 1.5;">
          Nuestro equipo de soporte está aquí para ayudarte:
        </p>
        <div style="display: inline-block; text-align: left;">
          <p style="margin: 8px 0; color: #333;">
            📧 <strong>Email:</strong> <a href="mailto:${supportEmail}" style="color: #ff4444; text-decoration: none;">${supportEmail}</a>
          </p>
          <p style="margin: 8px 0; color: #333;">
            📞 <strong>Teléfono:</strong> <a href="tel:${supportPhone}" style="color: #ff4444; text-decoration: none;">${supportPhone}</a>
          </p>
        </div>
        <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">
          También puedes contactar directamente a tu entrenador <strong>${trainerName}</strong>
        </p>
      </div>

      <!-- Mensaje de bienvenida final -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">
          Estamos emocionados de tenerte en TrainFit. <br>
          ¡Prepárate para alcanzar tus objetivos de fitness! 💪
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: 600;">
        TrainFit - Tu plataforma de entrenamiento personal
      </p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
        Este correo contiene información confidencial. Si no eres el destinatario, <br>
        por favor elimínalo y notifica al remitente.
      </p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af;">
          © 2025 TrainFit. Todos los derechos reservados. <br>
          Este email fue enviado automáticamente, por favor no respondas a este mensaje.
        </p>
      </div>
    </div>
    
  </div>
</body>
</html>
  `;
};
exports.generateWelcomeEmailTemplate = generateWelcomeEmailTemplate;
