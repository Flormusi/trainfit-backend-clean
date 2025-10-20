const axios = require('axios');

// Configurar axios para usar la URL base correcta
axios.defaults.baseURL = 'http://localhost:5002/api';

async function testLogin() {
  try {
    console.log('🔐 Probando login con credenciales de prueba...');
    
    const loginResponse = await axios.post('/auth/login', {
      email: 'test.trainer@trainfit.com',
      password: 'test123'
    });
    
    console.log('✅ Login exitoso!');
    console.log('Respuesta completa:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token;
    
    if (token) {
      console.log('\n👥 Probando API de clientes...');
      
      const clientsResponse = await axios.get('/trainer/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API de clientes funcionando!');
      console.log('Respuesta:', JSON.stringify(clientsResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLogin();