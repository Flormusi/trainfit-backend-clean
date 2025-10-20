const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClientTrainer() {
  try {
    console.log('🔍 Buscando información del cliente...');
    
    // Buscar el cliente
    const client = await prisma.user.findFirst({
      where: {
        email: 'florenciamusitani@gmail.com'
      },
      include: {
        trainersAsClient: {
          include: {
            trainer: true
          }
        }
      }
    });

    if (!client) {
      console.log('❌ Cliente no encontrado');
      return;
    }

    console.log('✅ Cliente encontrado:', client.name);
    console.log('📧 Email:', client.email);
    console.log('🆔 ID:', client.id);

    if (client.trainersAsClient.length === 0) {
      console.log('❌ El cliente no tiene entrenador asignado');
      return;
    }

    console.log('\n👨‍💼 Entrenadores asignados:');
    client.trainersAsClient.forEach((relation, index) => {
      console.log(`${index + 1}. ${relation.trainer.name} (${relation.trainer.email})`);
      console.log(`   ID: ${relation.trainer.id}`);
    });

    // Buscar rutinas del cliente
    console.log('\n🏋️‍♀️ Rutinas del cliente:');
    const routines = await prisma.routine.findMany({
      where: {
        clientId: client.id
      },
      include: {
        trainer: true
      }
    });

    if (routines.length === 0) {
      console.log('❌ No hay rutinas para este cliente');
    } else {
      routines.forEach((routine, index) => {
        console.log(`${index + 1}. ${routine.name}`);
        console.log(`   ID: ${routine.id}`);
        console.log(`   Entrenador: ${routine.trainer.name} (${routine.trainer.email})`);
        console.log(`   Trainer ID: ${routine.trainer.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientTrainer();