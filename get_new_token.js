const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function generateNewToken() {
  try {
    // Buscar el usuario entrenador
    const trainer = await prisma.user.findUnique({
      where: { email: 'magagroca@gmail.com' }
    });
    
    if (!trainer) {
      console.log('Entrenador no encontrado');
      return;
    }
    
    console.log('Entrenador encontrado:', trainer.email, trainer.name);
    
    // Generar un nuevo token
    const tokenPayload = {
      id: trainer.id,
      email: trainer.email,
      role: trainer.role
    };
    
    // Usar la misma clave secreta que usa la aplicación
    // Normalmente esto estaría en una variable de entorno
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
    
    // Generar token con expiración de 1 hora
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    
    console.log('Nuevo token generado:', token);
    
    // Guardar el token en un archivo
    const tokenFilePath = path.join(__dirname, '..', 'client', 'src', 'token.txt');
    fs.writeFileSync(tokenFilePath, token);
    console.log('Token guardado en:', tokenFilePath);
    
    // Verificar que el cliente existe
    const client = await prisma.user.findUnique({
      where: { email: 'florenciamusitani@gmail.com' }
    });
    
    if (client) {
      console.log('\nCliente encontrado:', client.email, client.name);
      
      // Verificar la relación trainer-client
      const relation = await prisma.trainerClient.findUnique({
        where: {
          trainerId_clientId: {
            trainerId: trainer.id,
            clientId: client.id
          }
        }
      });
      
      if (relation) {
        console.log('Relación trainer-client confirmada');
      } else {
        console.log('No existe relación trainer-client');
      }
    } else {
      console.log('Cliente no encontrado');
    }
    
  } catch (error) {
    console.error('Error al generar token:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateNewToken();