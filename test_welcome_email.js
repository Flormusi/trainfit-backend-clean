const axios = require('axios');
const fs = require('fs');

// Configuración de la API
const API_BASE_URL = 'http://localhost:5002/api';
const TEST_EMAIL = 'test.client@example.com';
const TEST_TRAINER_EMAIL = 'florenciamusitani@gmail.com';
const TEST_TRAINER_PASSWORD = 'Flor123456';

/**
 * Script de prueba para verificar el envío de correos de bienvenida
 */
async function testWelcomeEmailFunctionality() {
  console.log('🧪 Iniciando pruebas de funcionalidad de correo de bienvenida\n');
  
  try {
    // 1. Login del entrenador
    console.log('1️⃣ Iniciando sesión como entrenador...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_TRAINER_EMAIL,
      password: TEST_TRAINER_PASSWORD
    });
    
    if (!loginResponse.data.token) {
      throw new Error('No se pudo obtener el token de autenticación');
    }
    
    const authToken = loginResponse.data.token;
    const trainerId = loginResponse.data.user.id;
    console.log('✅ Login exitoso. Trainer ID:', trainerId);
    
    // 2. Configurar headers de autenticación
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // 3. Generar datos únicos para el cliente de prueba
    const timestamp = Date.now();
    const testClientData = {
      name: `Cliente Prueba ${timestamp}`,
      email: `test.client.${timestamp}@example.com`,
      phone: '+54 11 1234-5678',
      birthDate: '1990-01-01',
      gender: 'MALE',
      fitnessGoal: 'WEIGHT_LOSS',
      activityLevel: 'BEGINNER',
      medicalConditions: 'Ninguna',
      password: 'TempPassword123!'
    };
    
    console.log('\n2️⃣ Agregando nuevo cliente...');
    console.log('📧 Email del cliente:', testClientData.email);
    
    // 4. Agregar cliente (esto debería enviar el correo de bienvenida)
    const addClientResponse = await axios.post(
      `${API_BASE_URL}/clients/add-by-trainer`,
      testClientData,
      { headers: authHeaders }
    );
    
    console.log('✅ Cliente agregado exitosamente');
    console.log('📊 Respuesta del servidor:', {
      message: addClientResponse.data.message,
      emailSent: addClientResponse.data.emailSent,
      emailError: addClientResponse.data.emailError,
      clientId: addClientResponse.data.client?.id
    });
    
    // 5. Verificar el estado del correo
    if (addClientResponse.data.emailSent) {
      console.log('\n✅ ÉXITO: El correo de bienvenida fue enviado correctamente');
    } else {
      console.log('\n⚠️ ADVERTENCIA: El correo de bienvenida no se pudo enviar');
      if (addClientResponse.data.emailError) {
        console.log('❌ Error del email:', addClientResponse.data.emailError);
      }
    }
    
    // 6. Probar con cliente existente (debería enviar correo de asociación)
    console.log('\n3️⃣ Probando asociación de cliente existente...');
    
    try {
      const existingClientResponse = await axios.post(
        `${API_BASE_URL}/clients/add-by-trainer`,
        {
          ...testClientData,
          name: `${testClientData.name} - Actualizado`
        },
        { headers: authHeaders }
      );
      
      console.log('📊 Respuesta para cliente existente:', {
        message: existingClientResponse.data.message,
        emailSent: existingClientResponse.data.emailSent,
        emailError: existingClientResponse.data.emailError
      });
      
    } catch (existingClientError) {
      console.log('ℹ️ Cliente ya existe (comportamiento esperado)');
      if (existingClientError.response?.data) {
        console.log('📊 Respuesta:', existingClientError.response.data);
      }
    }
    
    // 7. Verificar logs de email (si están disponibles)
    console.log('\n4️⃣ Verificando logs de email...');
    try {
      const logsResponse = await axios.get(
        `${API_BASE_URL}/email/logs`,
        { headers: authHeaders }
      );
      
      if (logsResponse.data && logsResponse.data.length > 0) {
        console.log('📋 Últimos logs de email:');
        logsResponse.data.slice(-3).forEach((log, index) => {
          console.log(`  ${index + 1}. ${log.to} - ${log.success ? '✅' : '❌'} - ${log.timestamp}`);
        });
      } else {
        console.log('ℹ️ No hay logs de email disponibles');
      }
    } catch (logError) {
      console.log('ℹ️ Endpoint de logs no disponible (normal en desarrollo)');
    }
    
    // 8. Resumen de la prueba
    console.log('\n🎯 RESUMEN DE LA PRUEBA:');
    console.log('=' .repeat(50));
    console.log('✅ Login de entrenador: EXITOSO');
    console.log('✅ Creación de cliente: EXITOSO');
    console.log(`${addClientResponse.data.emailSent ? '✅' : '⚠️'} Envío de correo: ${addClientResponse.data.emailSent ? 'EXITOSO' : 'FALLÓ'}`);
    
    if (addClientResponse.data.emailSent) {
      console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
      console.log('📧 El sistema de correos de bienvenida está funcionando correctamente.');
      console.log(`📬 Revisa la bandeja de entrada de: ${testClientData.email}`);
    } else {
      console.log('\n⚠️ PRUEBAS PARCIALMENTE EXITOSAS');
      console.log('🔧 El cliente se creó correctamente, pero el correo no se envió.');
      console.log('💡 Esto puede ser normal si estás en modo de simulación.');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:');
    console.error('=' .repeat(50));
    
    if (error.response) {
      console.error('📊 Respuesta del servidor:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('🌐 Error de conexión:', error.message);
      console.error('💡 Asegúrate de que el servidor backend esté ejecutándose en http://localhost:3000');
    } else {
      console.error('🐛 Error inesperado:', error.message);
    }
    
    console.error('\n🔧 PASOS PARA SOLUCIONAR:');
    console.error('1. Verifica que el servidor backend esté ejecutándose');
    console.error('2. Confirma las credenciales del entrenador de prueba');
    console.error('3. Revisa la configuración de email en el archivo .env');
    console.error('4. Verifica los logs del servidor para más detalles');
  }
}

// Función para verificar la configuración del entorno
async function checkEnvironmentSetup() {
  console.log('🔍 Verificando configuración del entorno...\n');
  
  try {
    // Verificar si el servidor está ejecutándose
    const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    });
    console.log('✅ Servidor backend: ACTIVO');
  } catch (error) {
    console.log('❌ Servidor backend: NO DISPONIBLE');
    console.log('💡 Ejecuta "npm run dev" en la carpeta backend');
    return false;
  }
  
  // Verificar archivo .env
  const envPath = './backend/.env';
  if (fs.existsSync(envPath)) {
    console.log('✅ Archivo .env: ENCONTRADO');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasEmailConfig = envContent.includes('EMAIL_USER') && envContent.includes('EMAIL_PASS');
    console.log(`${hasEmailConfig ? '✅' : '⚠️'} Configuración de email: ${hasEmailConfig ? 'CONFIGURADA' : 'FALTANTE'}`);
  } else {
    console.log('⚠️ Archivo .env: NO ENCONTRADO');
  }
  
  console.log('\n');
  return true;
}

// Ejecutar las pruebas
async function runTests() {
  console.log('🚀 INICIANDO PRUEBAS DE CORREO DE BIENVENIDA');
  console.log('=' .repeat(60));
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
  console.log(`🌐 API Base URL: ${API_BASE_URL}`);
  console.log('=' .repeat(60));
  
  const envOk = await checkEnvironmentSetup();
  if (envOk) {
    await testWelcomeEmailFunctionality();
  }
  
  console.log('\n🏁 Pruebas completadas.');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testWelcomeEmailFunctionality,
  checkEnvironmentSetup,
  runTests
};