const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTrainerClientRelation() {
  try {
    // Buscar todas las relaciones entre entrenadores y clientes
    const trainerClients = await prisma.trainerClient.findMany({
      include: {
        trainer: true,
        client: true
      }
    });

    console.log('\n📋 Relaciones entre entrenadores y clientes:');
    trainerClients.forEach((relation, index) => {
      console.log(`\nRelación ${index + 1}:`);
      console.log(`Entrenador: ${relation.trainer.name} (${relation.trainer.email})`);
      console.log(`Cliente: ${relation.client.name} (${relation.client.email})`);
      console.log(`ID de relación: ${relation.id}`);
    });

    // Buscar específicamente la relación para florenciamusitani@gmail.com
    const specificClient = await prisma.user.findUnique({
      where: {
        email: 'florenciamusitani@gmail.com'
      }
    });

    if (specificClient) {
      console.log('\n🔍 Buscando relaciones para el cliente florenciamusitani@gmail.com');
      
      const clientRelations = await prisma.trainerClient.findMany({
        where: {
          clientId: specificClient.id
        },
        include: {
          trainer: true
        }
      });

      if (clientRelations.length > 0) {
        console.log(`Encontradas ${clientRelations.length} relaciones:`);
        clientRelations.forEach((relation, index) => {
          console.log(`${index + 1}. Con entrenador: ${relation.trainer.name} (${relation.trainer.email})`);
        });
      } else {
        console.log('No se encontraron relaciones para este cliente en la tabla TrainerClient');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainerClientRelation();