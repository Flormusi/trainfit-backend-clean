const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findRoutineAgosto() {
  try {
    console.log('🔍 Buscando rutina de agosto...');
    
    const routine = await prisma.routine.findFirst({
      where: {
        name: {
          contains: 'Rutina Agosto'
        }
      }
    });
    
    if (routine) {
      console.log('✅ Rutina encontrada:');
      console.log(`- ID: ${routine.id}`);
      console.log(`- Nombre: ${routine.name}`);
      console.log(`- Entrenador ID: ${routine.trainerId}`);
    } else {
      console.log('❌ No se encontró la rutina de agosto');
    }
    
  } catch (error) {
    console.error('❌ Error buscando rutina:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findRoutineAgosto();