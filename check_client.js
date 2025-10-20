const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClient() {
  try {
    // Buscar el cliente por email
    const client = await prisma.user.findUnique({
      where: {
        email: 'florenciamusitani@gmail.com'
      },
      include: {
        trainersAsClient: {
          include: {
            trainer: true
          }
        },
        clientProfile: true
      }
    });

    if (client) {
      console.log('✅ Cliente encontrado:');
      console.log('ID:', client.id);
      console.log('Nombre:', client.name);
      console.log('Email:', client.email);
      console.log('Rol:', client.role);
      console.log('Entrenadores asociados:', client.trainersAsClient.length);
      
      if (client.trainersAsClient.length > 0) {
        client.trainersAsClient.forEach((relation, index) => {
          console.log(`Entrenador ${index + 1}:`, relation.trainer.name, '(', relation.trainer.email, ')');
        });
      }
      
      if (client.clientProfile) {
        console.log('Perfil de cliente:', 'Sí');
      } else {
        console.log('Perfil de cliente:', 'No');
      }
    } else {
      console.log('❌ Cliente no encontrado con email: florenciamusitani@gmail.com');
    }

    // Buscar todos los usuarios con rol CLIENT
    const allClients = await prisma.user.findMany({
      where: {
        role: 'CLIENT'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    console.log('\n📋 Todos los clientes en la base de datos:');
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} (${client.email})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClient();