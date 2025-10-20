const axios = require('axios');

// Configurar axios para usar la URL base correcta
axios.defaults.baseURL = 'http://localhost:5002/api';

async function testAuthAndClients() {
  // Lista de credenciales para probar
  const credentials = [
    { email: 'magagroca@gmail.com', password: 'Maga1234' },
    { email: 'magagroca@gmail.com', password: 'password' },
    { email: 'magagroca@gmail.com', password: '123456' },
    { email: 'test@trainfit.com', password: 'password' },
    { email: 'test@trainfit.com', password: '123456' },
    { email: 'trainer.test@trainfit.com', password: 'password' },
    { email: 'trainer.test@trainfit.com', password: '123456' },
    { email: 'trainer.demo@trainfit.com', password: 'password' },
    { email: 'trainer.demo@trainfit.com', password: '123456' },
    { email: 'trainer.test@example.com', password: 'password' },
    { email: 'trainer.test@example.com', password: '123456' }
  ];

  let token = null;
  let successfulCredentials = null;

  for (const cred of credentials) {
    try {
      console.log(`🔐 Probando login con: ${cred.email} / ${cred.password}`);
      
      const loginResponse = await axios.post('/auth/login', {
        email: cred.email,
        password: cred.password
      });
      
      console.log('✅ Login exitoso!');
      console.log('Token recibido:', loginResponse.data.token ? 'SÍ' : 'NO');
      
      token = loginResponse.data.token;
      successfulCredentials = cred;
      break;
      
    } catch (error) {
      console.log(`❌ Falló: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
  }

  if (!token) {
    console.error('❌ No se pudo hacer login con ninguna credencial');
    return;
  }

  console.log(`\n✅ Login exitoso con: ${successfulCredentials.email}`);
  
  try {
    
    // 2. Probar API de clientes con el token
    console.log('\n👥 Probando API de clientes...');
    
    const clientsResponse = await axios.get('/trainer/clients', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API de clientes funcionando');
    console.log('Número de clientes:', clientsResponse.data.data ? clientsResponse.data.data.length : 'No data');
    console.log('Estructura de respuesta:', Object.keys(clientsResponse.data));
    
    // 3. Mostrar información del primer cliente si existe
    if (clientsResponse.data.data && clientsResponse.data.data.length > 0) {
      console.log('\n📋 Primer cliente:');
      const firstClient = clientsResponse.data.data[0];
      console.log('- ID:', firstClient.id);
      console.log('- Nombre:', firstClient.name);
      console.log('- Email:', firstClient.email);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAuthAndClients();