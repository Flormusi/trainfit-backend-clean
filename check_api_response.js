const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApiResponse() {
  try {
    // Obtener el ID del entrenador actual (magagroca@gmail.com)
    const trainer = await prisma.user.findUnique({
      where: {
        email: 'magagroca@gmail.com'
      }
    });

    if (!trainer) {
      console.log('❌ No se encontró el entrenador con email magagroca@gmail.com');
      return;
    }

    console.log('✅ Entrenador encontrado:');
    console.log('ID:', trainer.id);
    console.log('Nombre:', trainer.name);
    console.log('Email:', trainer.email);

    // Simular la respuesta de la API getTrainerClients
    console.log('\n🔍 Simulando respuesta de API getTrainerClients para el entrenador:', trainer.id);
    
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        trainersAsClient: {
          some: {
            trainerId: trainer.id
          }
        }
      },
      include: {
        clientProfile: true,
        assignedRoutines: {
          where: {
            trainerId: trainer.id
          }
        },
        assignedNutritionPlans: {
          where: {
            trainerId: trainer.id
          }
        }
      }
    });

    console.log('\n📋 Clientes encontrados:', clients.length);
    
    // Mostrar información detallada de cada cliente
    clients.forEach((client, index) => {
      console.log(`\nCliente ${index + 1}:`);
      console.log('ID:', client.id);
      console.log('Nombre:', client.name);
      console.log('Email:', client.email);
      console.log('Perfil:', client.clientProfile ? 'Sí' : 'No');
      console.log('Rutinas asignadas:', client.assignedRoutines.length);
      console.log('Planes de nutrición asignados:', client.assignedNutritionPlans.length);
    });

    // Buscar específicamente el cliente florenciamusitani@gmail.com
    const florenciaClient = clients.find(client => client.email === 'florenciamusitani@gmail.com');
    if (florenciaClient) {
      console.log('\n✅ Cliente florenciamusitani@gmail.com encontrado en la respuesta');
    } else {
      console.log('\n❌ Cliente florenciamusitani@gmail.com NO encontrado en la respuesta');
    }

    // Verificar la estructura de la respuesta
    console.log('\n🔍 Estructura de la respuesta:');
    console.log('La respuesta es un array:', Array.isArray(clients));
    console.log('Tipo de respuesta:', typeof clients);
    
    // Mostrar la estructura JSON que se enviaría al frontend
    console.log('\n📋 Estructura JSON de la respuesta:');
    const jsonResponse = JSON.stringify(clients, null, 2);
    console.log(jsonResponse.substring(0, 500) + '... (truncado)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiResponse();