const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Probando login con credenciales de prueba...');
    
    const loginData = {
      email: 'trainer.demo@trainfit.com',
      password: 'test123'
    };

    console.log('📤 Enviando solicitud de login a http://localhost:5002/api/auth/login');
    console.log('📧 Email:', loginData.email);
    
    const response = await axios.post('http://localhost:5002/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Login exitoso!');
    console.log('📊 Respuesta del servidor:');
    console.log('- Status:', response.status);
    console.log('- Success:', response.data.success);
    console.log('- Usuario:', response.data.user?.name);
    console.log('- Rol:', response.data.user?.role);
    console.log('- Token recibido:', response.data.token ? 'Sí' : 'No');

  } catch (error) {
    console.error('❌ Error en el login:');
    
    if (error.response) {
      console.error('📊 Respuesta del servidor:');
      console.error('- Status:', error.response.status);
      console.error('- Data:', error.response.data);
    } else if (error.request) {
      console.error('📡 No se recibió respuesta del servidor');
      console.error('- Error:', error.message);
    } else {
      console.error('⚙️ Error de configuración:', error.message);
    }
  }
}

testLogin();