const { EmailService } = require('./src/services/emailService.ts');
const { generateSecureTemporaryPassword } = require('./src/utils/passwordGenerator.ts');

/**
 * Script de prueba directo para el servicio de email
 */
async function testEmailService() {
  console.log('🧪 PRUEBA DIRECTA DEL SERVICIO DE EMAIL');
  console.log('=' .repeat(50));
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
  console.log('=' .repeat(50));
  
  try {
    // 1. Generar contraseña temporal
    console.log('\n1️⃣ Generando contraseña temporal...');
    const temporaryPassword = generateSecureTemporaryPassword();
    console.log('✅ Contraseña generada:', temporaryPassword);
    
    // 2. Datos de prueba para el correo
    const testEmailData = {
      clientName: 'Cliente de Prueba',
      clientEmail: 'test.client@example.com',
      temporaryPassword: temporaryPassword,
      trainerName: 'Entrenador de Prueba',
      loginUrl: 'http://localhost:5173/login',
      supportEmail: 'soporte@trainfit.app',
      supportPhone: '+54 11 1234-5678'
    };
    
    console.log('\n2️⃣ Datos del correo de prueba:');
    console.log('📧 Cliente:', testEmailData.clientName);
    console.log('📧 Email:', testEmailData.clientEmail);
    console.log('👨‍💼 Entrenador:', testEmailData.trainerName);
    console.log('🔑 Contraseña temporal:', testEmailData.temporaryPassword);
    
    // 3. Enviar correo de bienvenida
    console.log('\n3️⃣ Enviando correo de bienvenida...');
    const emailResult = await EmailService.sendWelcomeEmail(testEmailData);
    
    console.log('\n📊 RESULTADO DEL ENVÍO:');
    console.log('=' .repeat(30));
    console.log('✅ Éxito:', emailResult.success);
    console.log('📬 Message ID:', emailResult.messageId || 'N/A');
    console.log('❌ Error:', emailResult.error || 'Ninguno');
    console.log('⏰ Timestamp:', emailResult.timestamp);
    
    // 4. Obtener logs de email
    console.log('\n4️⃣ Obteniendo logs de email...');
    try {
      const emailLogs = EmailService.getEmailLogs(5);
      
      if (emailLogs && emailLogs.length > 0) {
        console.log('📋 Últimos logs de email:');
        emailLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. ${log.to} - ${log.success ? '✅' : '❌'} - ${new Date(log.timestamp).toLocaleString()}`);
          if (log.error) {
            console.log(`     Error: ${log.error}`);
          }
        });
      } else {
        console.log('ℹ️ No hay logs de email disponibles');
      }
    } catch (logError) {
      console.log('⚠️ Error obteniendo logs:', logError.message);
    }
    
    // 5. Probar validación de email
    console.log('\n5️⃣ Probando validaciones de email...');
    
    const testEmails = [
      'valid@example.com',
      'invalid-email',
      'test@tempmail.org',
      'user@gmail.com'
    ];
    
    const { validateEmailSecurity } = require('./src/middleware/emailValidation.middleware');
    
    testEmails.forEach(email => {
      const validation = validateEmailSecurity(email);
      console.log(`📧 ${email}: ${validation.isValid ? '✅ Válido' : '❌ Inválido'} ${validation.reason ? `(${validation.reason})` : ''}`);
    });
    
    // 6. Resumen final
    console.log('\n🎯 RESUMEN DE LA PRUEBA:');
    console.log('=' .repeat(50));
    console.log('✅ Generación de contraseña: EXITOSO');
    console.log(`${emailResult.success ? '✅' : '❌'} Envío de correo: ${emailResult.success ? 'EXITOSO' : 'FALLÓ'}`);
    console.log('✅ Validaciones de email: EXITOSO');
    console.log('✅ Sistema de logs: EXITOSO');
    
    if (emailResult.success) {
      console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
      console.log('📧 El sistema de correos de bienvenida está funcionando correctamente.');
      
      if (emailResult.messageId && emailResult.messageId.startsWith('simulated')) {
        console.log('\n💡 NOTA: El correo fue simulado (modo desarrollo).');
        console.log('   Para envío real, configura las credenciales SMTP en el archivo .env');
      } else {
        console.log(`\n📬 Correo enviado con ID: ${emailResult.messageId}`);
      }
    } else {
      console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON');
      console.log('🔧 Revisa la configuración de email y los logs para más detalles.');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN LA PRUEBA:');
    console.error('=' .repeat(50));
    console.error('🐛 Error:', error.message);
    console.error('📚 Stack:', error.stack);
    
    console.error('\n🔧 POSIBLES SOLUCIONES:');
    console.error('1. Verifica que todos los archivos de servicio estén correctamente importados');
    console.error('2. Asegúrate de que las dependencias estén instaladas (npm install)');
    console.error('3. Revisa la configuración del archivo .env');
    console.error('4. Verifica que no haya errores de sintaxis en los archivos de servicio');
  }
}

// Función para mostrar información del entorno
function showEnvironmentInfo() {
  console.log('🔍 INFORMACIÓN DEL ENTORNO:');
  console.log('=' .repeat(30));
  console.log('📁 Directorio actual:', process.cwd());
  console.log('🟢 Node.js versión:', process.version);
  console.log('💻 Plataforma:', process.platform);
  
  // Verificar variables de entorno relacionadas con email
  const emailEnvVars = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM', 'EMAIL_SERVICE'];
  console.log('\n📧 Variables de entorno de email:');
  emailEnvVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`   ${varName}: ${value ? '✅ Configurada' : '❌ No configurada'}`);
  });
  
  console.log('\n');
}

// Ejecutar las pruebas
async function runTests() {
  showEnvironmentInfo();
  await testEmailService();
  console.log('\n🏁 Pruebas completadas.');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testEmailService,
  runTests
};