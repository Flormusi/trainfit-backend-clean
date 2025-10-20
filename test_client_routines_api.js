const axios = require('axios');

// Configurar la URL base del servidor
const API_BASE_URL = 'http://localhost:5002';

// Simular login para obtener token válido
async function getClientToken() {
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'florenciamusitani@gmail.com',
      password: 'password123'
    });
    return loginResponse.data.token;
  } catch (error) {
    console.error('❌ Error obteniendo token:', error.message);
    return null;
  }
}

async function testClientRoutinesAPI() {
  try {
    console.log('🔑 Obteniendo token de cliente...');
    const token = await getClientToken();
    
    if (!token) {
      console.error('❌ No se pudo obtener el token');
      return;
    }
    
    console.log('✅ Token obtenido exitosamente');
    console.log('🧪 Probando endpoint /api/clients/profile/routines');
    console.log('🔗 URL:', `${API_BASE_URL}/api/clients/profile/routines`);
    
    const response = await axios.get(`${API_BASE_URL}/api/clients/profile/routines`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log('📊 Status:', response.status);
    console.log('📦 Data:', JSON.stringify(response.data, null, 2));
    console.log('📈 Cantidad de rutinas:', response.data?.data?.length || 0);
    
  } catch (error) {
    console.error('❌ Error en la petición:');
    console.error('📊 Status:', error.response?.status);
    console.error('📦 Data:', error.response?.data);
    console.error('💬 Message:', error.message);
  }
}

testClientRoutinesAPI();