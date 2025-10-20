const axios = require('axios');

async function testLoginWithTestUsers() {
  try {
    console.log('🧪 Probando login con usuario de prueba (TRAINER)...');
    
    const trainerLoginData = {
      email: 'test@trainfit.com',
      password: 'test123'
    };
    
    console.log('Enviando solicitud de login a:', 'http://localhost:5002/api/auth/login');
    console.log('Datos de login:', { ...trainerLoginData, password: '***' });
    
    const trainerResponse = await axios.post('http://localhost:5002/api/auth/login', trainerLoginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('\n✅ Login TRAINER exitoso!');
    console.log('Status:', trainerResponse.status);
    console.log('Response data:', JSON.stringify(trainerResponse.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ Error en login TRAINER:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No se recibió respuesta del servidor');
      console.log('Error:', error.message);
    } else {
      console.log('Error configurando la solicitud:', error.message);
    }
  }

  try {
    console.log('\n\n🧪 Probando login con usuario de prueba (CLIENT)...');
    
    const clientLoginData = {
      email: 'client@trainfit.com',
      password: 'test123'
    };
    
    console.log('Enviando solicitud de login a:', 'http://localhost:5002/api/auth/login');
    console.log('Datos de login:', { ...clientLoginData, password: '***' });
    
    const clientResponse = await axios.post('http://localhost:5002/api/auth/login', clientLoginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('\n✅ Login CLIENT exitoso!');
    console.log('Status:', clientResponse.status);
    console.log('Response data:', JSON.stringify(clientResponse.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ Error en login CLIENT:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No se recibió respuesta del servidor');
      console.log('Error:', error.message);
    } else {
      console.log('Error configurando la solicitud:', error.message);
    }
  }
}

testLoginWithTestUsers();