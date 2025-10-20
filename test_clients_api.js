const axios = require('axios');

// Token del usuario autenticado (Maga)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtYmg4azJoMDAwMDBmNXo4a3ByZWp0c3AiLCJpYXQiOjE3NTI0MTkwMzgsImV4cCI6MTc1MzAyMzgzOH0.m53RRe_vdLGb_SMxmROQO3NbiE7lzNldBaA6pV5DCAw';

async function testClientsAPI() {
  try {
    console.log('Haciendo solicitud a /api/trainer/clients...');
    
    const response = await axios.get('http://localhost:5002/api/trainer/clients', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.status);
    console.error('Error message:', error.response?.data);
    console.error('Full error:', error.message);
  }
}

testClientsAPI();