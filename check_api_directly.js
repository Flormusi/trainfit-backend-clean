// Script para verificar directamente la API del backend
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando la relación entre entrenadores y clientes...');
    
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
    
    // Buscar las relaciones de este entrenador con sus clientes
    const trainerClients = await prisma.trainerClient.findMany({
      where: {
        trainerId: trainer.id
      },
      include: {
        client: true
      }
    });
    
    console.log('Relaciones del entrenador con clientes:', trainerClients);
    
    // Buscar específicamente la relación con florenciamusitani@gmail.com
    const florenciaClient = trainerClients.find(tc => tc.client.email === 'florenciamusitani@gmail.com');
    
    if (florenciaClient) {
      console.log('Cliente florenciamusitani@gmail.com encontrado:', florenciaClient);
    } else {
      console.log('Cliente florenciamusitani@gmail.com NO encontrado');
      
      // Mostrar todos los emails de clientes para verificar
      console.log('Emails de clientes asociados al entrenador:');
      trainerClients.forEach(tc => {
        console.log('- Email:', tc.client.email);
      });
    }
    
    // Verificar la estructura de la respuesta que debería devolver la API
    const clientsForApi = trainerClients.map(tc => tc.client);
    console.log('Estructura de respuesta esperada de la API:', JSON.stringify(clientsForApi, null, 2));
    
  } catch (error) {
    console.error('Error al verificar la API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();