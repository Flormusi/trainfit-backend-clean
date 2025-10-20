const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserPermissions() {
  try {
    console.log('🔍 Verificando permisos del usuario...');
    
    // Buscar el usuario por email
    const user = await prisma.user.findFirst({
      where: {
        email: 'florenciamusitani@gmail.com'
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:', user.name);
    console.log('📧 Email:', user.email);
    console.log('👤 Rol:', user.role);
    console.log('🆔 ID:', user.id);

    // Verificar si el usuario es entrenador o cliente
    if (user.role === 'TRAINER') {
      console.log('✅ El usuario tiene permisos de ENTRENADOR');
      
      // Buscar clientes de este entrenador
      const clients = await prisma.trainerClient.findMany({
        where: {
          trainerId: user.id
        },
        include: {
          client: true
        }
      });
      
      console.log(`👥 Clientes asignados: ${clients.length}`);
      clients.forEach((relation, index) => {
        console.log(`${index + 1}. ${relation.client.name} (${relation.client.email})`);
      });
      
    } else if (user.role === 'CLIENT') {
      console.log('ℹ️ El usuario es un CLIENTE');
      
      // Buscar entrenadores de este cliente
      const trainers = await prisma.trainerClient.findMany({
        where: {
          clientId: user.id
        },
        include: {
          trainer: true
        }
      });
      
      console.log(`👨‍💼 Entrenadores asignados: ${trainers.length}`);
      trainers.forEach((relation, index) => {
        console.log(`${index + 1}. ${relation.trainer.name} (${relation.trainer.email})`);
      });
    }

    // Verificar rutinas relacionadas
    const routinesAsClient = await prisma.routine.findMany({
      where: {
        clientId: user.id
      },
      include: {
        trainer: true
      }
    });

    const routinesAsTrainer = await prisma.routine.findMany({
      where: {
        trainerId: user.id
      },
      include: {
        client: true
      }
    });

    console.log(`\n🏋️‍♀️ Rutinas como cliente: ${routinesAsClient.length}`);
    routinesAsClient.forEach((routine, index) => {
      console.log(`${index + 1}. ${routine.name} (Entrenador: ${routine.trainer.name})`);
    });

    console.log(`\n🏋️‍♂️ Rutinas como entrenador: ${routinesAsTrainer.length}`);
    routinesAsTrainer.forEach((routine, index) => {
      console.log(`${index + 1}. ${routine.name} (Cliente: ${routine.client.name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions();