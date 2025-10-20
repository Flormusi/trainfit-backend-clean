const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtYmg4azJoMDAwMDBmNXo4a3ByZWp0c3AiLCJlbWFpbCI6Im1hZ2Fncm9jYUBnbWFpbC5jb20iLCJyb2xlIjoiVFJBSU5FUiIsImlhdCI6MTc1MzIyNTAxMywiZXhwIjoxNzUzMjI4NjEzfQ.AVhS5Z-9faH_kFUaOKtlQqbYReo1F3ZrjqyJHrX0Uck';

async function testAPI() {
  try {
    console.log('🔍 Probando API /api/trainer/clients...');
    
    const response = await axios.get('http://localhost:5002/api/trainer/clients', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status);
    console.error('📝 Error message:', error.response?.data);
    console.error('🔍 Full error:', error.message);
  }
}

testAPI();