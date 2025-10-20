const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();

async function testFrontendAPI() {
  try {
    console.log('🔍 Buscando entrenador Maga...');
    
    // Buscar el entrenador Maga
    const trainer = await prisma.user.findFirst({
      where: {
        name: 'Maga',
        role: 'TRAINER'
      }
    });

    if (!trainer) {
      console.log('❌ No se encontró el entrenador Maga');
      return;
    }

    console.log('✅ Entrenador encontrado:', trainer.name, 'ID:', trainer.id);

    // Generar token JWT usando el mismo secreto que el servidor
    const JWT_SECRET = 'trainfit_secure_jwt_secret_2023'; // Mismo secreto del .env
    const token = jwt.sign(
      { id: trainer.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🔑 Token generado exitosamente');

    // Hacer la llamada a la API con el token
    console.log('📡 Llamando a la API del dashboard...');
    
    const response = await axios.get('http://localhost:5002/api/trainer/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Respuesta de la API:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendAPI();
