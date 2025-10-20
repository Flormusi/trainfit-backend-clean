const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfiguration() {
  console.log('🧪 Probando configuración de email...');
  console.log('📧 Email Service:', process.env.EMAIL_SERVICE);
  console.log('👤 Email User:', process.env.EMAIL_USER);
  console.log('🔑 Email Pass:', process.env.EMAIL_PASS ? '***configurada***' : 'NO CONFIGURADA');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Credenciales de email no configuradas');
    return;
  }

  try {
    // Crear transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('🔍 Verificando conexión con Gmail...');
    
    // Verificar conexión
    await transporter.verify();
    console.log('✅ Conexión con Gmail exitosa!');

    // Enviar email de prueba
    console.log('📤 Enviando email de prueba...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Enviar a ti mismo
      subject: '🧪 Prueba de Email - TrainFit',
      html: `
        <h2>🎉 ¡Email funcionando correctamente!</h2>
        <p>Este es un email de prueba desde TrainFit.</p>
        <p>Configuración:</p>
        <ul>
          <li>Servicio: Gmail</li>
          <li>Usuario: ${process.env.EMAIL_USER}</li>
          <li>Fecha: ${new Date().toLocaleString()}</li>
        </ul>
        <p>✅ El sistema de emails está funcionando correctamente.</p>
      `
    });

    console.log('✅ Email de prueba enviado exitosamente!');
    console.log('📧 Message ID:', info.messageId);
    console.log('🎯 Revisa tu bandeja de entrada:', process.env.EMAIL_USER);
    
  } catch (error) {
    console.error('❌ Error en la configuración de email:');
    console.error('Tipo de error:', error.code || error.name);
    console.error('Mensaje:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 SOLUCIÓN SUGERIDA:');
      console.log('1. Ve a https://myaccount.google.com/');
      console.log('2. Seguridad → Verificación en 2 pasos (debe estar activada)');
      console.log('3. Contraseñas de aplicaciones → Correo → Otro → "TrainFit"');
      console.log('4. Copia la contraseña de 16 caracteres (sin espacios)');
      console.log('5. Actualiza EMAIL_PASS en el archivo .env');
    }
  }
}

testEmailConfiguration();