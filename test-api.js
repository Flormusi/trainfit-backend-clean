const axios = require('axios');

async function testUpdateClientInfo() {
  try {
    // Primero hacer login para obtener el token
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'magagroca@gmail.com',
      password: 'magaroca'
    });
    
    console.log('Login exitoso:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // Ahora probar la actualización del cliente
    const updateResponse = await axios.put(
      'http://localhost:5002/api/trainer/clients/cmcxkgizo0002f5ljs8ubspxn',
      {
        phone: '1156578922',
        weight: 52,
        height: 160,
        goals: 'Ganar Masa Muscular'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Actualización exitosa:', updateResponse.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testUpdateClientInfo();