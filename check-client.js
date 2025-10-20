const axios = require('axios');

async function checkClientData() {
  try {
    // Primero hacer login para obtener el token
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'magagroca@gmail.com',
      password: 'magaroca'
    });
    
    console.log('Login exitoso');
    const token = loginResponse.data.token;
    
    // Obtener datos del cliente específico
    const clientResponse = await axios.get(
      'http://localhost:5002/api/trainer/clients/cmcxkgizo0002f5ljs8ubspxn',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Datos del cliente:');
    console.log(JSON.stringify(clientResponse.data, null, 2));
    
    // Verificar campos específicos
    const client = clientResponse.data.data || clientResponse.data;
    const profile = client.clientProfile || {};
    
    console.log('\n=== VERIFICACIÓN DE CAMPOS ===');
    console.log('phone:', profile.phone);
    console.log('weight:', profile.weight);
    console.log('height:', profile.height);
    console.log('goals:', profile.goals);
    
    // Verificar si el perfil está completo
    const missingFields = [];
    if (!profile.phone) missingFields.push('Teléfono');
    if (!profile.weight) missingFields.push('Peso');
    if (!profile.height) missingFields.push('Altura');
    if (!profile.goals || profile.goals.length === 0) missingFields.push('Objetivos');
    
    console.log('\n=== ESTADO DEL PERFIL ===');
    if (missingFields.length === 0) {
      console.log('✅ Perfil COMPLETO');
    } else {
      console.log('❌ Perfil INCOMPLETO');
      console.log('Campos faltantes:', missingFields.join(', '));
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkClientData();