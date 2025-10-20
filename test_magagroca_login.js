const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Probando login con magagroca@gmail.com...');
    console.log('Enviando solicitud de login a: http://localhost:5002/api/auth/login');
    
    const loginData = {
      email: 'magagroca@gmail.com',
      password: 'magaroca'
    };
    
    console.log('Datos de login:', { email: loginData.email, password: '***' });
    
    const response = await axios.post('http://localhost:5002/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Login exitoso!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ Error en login:');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testLogin();