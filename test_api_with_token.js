// Script para probar directamente la API del backend con un token válido
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando la API del backend con un token válido...');
    
    // Buscar el entrenador por email
    const trainer = await prisma.user.findUnique({
      where: {
        email: 'magagroca@gmail.com'
      }
    });
    
    if (!trainer) {
      console.log('No se encontró el entrenador con email magagroca@gmail.com');
      return;
    }
    
    console.log('Entrenador encontrado:', trainer);
    
    // Generar un token JWT válido para el entrenador
    const token = jwt.sign(
      { 
        id: trainer.id, // Usar 'id' en lugar de 'userId' para que coincida con el middleware
        email: trainer.email,
        role: trainer.role
      }, 
      process.env.JWT_SECRET || 'your_jwt_secret_key', // Usar la misma clave secreta que usa la aplicación
      { expiresIn: '1h' }
    );
    
    console.log('Token JWT generado:', token);
    console.log('\nPuedes usar este token para probar la API directamente con curl:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5002/api/trainer/clients`);
    
    // Guardar el token en un archivo para usarlo en pruebas
    const fs = require('fs');
    fs.writeFileSync('../client/src/token.txt', token);
    console.log('\nToken guardado en ../client/src/token.txt');
    
  } catch (error) {
    console.error('Error al generar el token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();