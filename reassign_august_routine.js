const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reassignAugustRoutine() {
  try {
    console.log('🔍 Buscando rutina "Rutina Agosto (Dia 1)"...');
    
    // Buscar la rutina por nombre
    const routine = await prisma.routine.findFirst({
      where: {
        name: {
          contains: 'Rutina Agosto (Dia 1)',
          mode: 'insensitive'
        }
      },
      include: {
        trainer: true,
        client: true
      }
    });
    
    if (!routine) {
      console.log('❌ Rutina "Rutina Agosto (Dia 1)" no encontrada');
      return;
    }
    
    console.log('✅ Rutina encontrada:');
    console.log(`   - ID: ${routine.id}`);
    console.log(`   - Nombre: ${routine.name}`);
    console.log(`   - Entrenador: ${routine.trainer.email}`);
    console.log(`   - Cliente actual: ${routine.client?.email || 'Sin cliente'}`);
    
    // Buscar el cliente florenciamusitani@gmail.com
    const client = await prisma.user.findUnique({
      where: {
        email: 'florenciamusitani@gmail.com'
      }
    });
    
    if (!client) {
      console.log('❌ Cliente florenciamusitani@gmail.com no encontrado');
      return;
    }
    
    console.log('✅ Cliente encontrado:', client.email);
    
    // Crear asignación de rutina
    console.log('🔄 Creando asignación de rutina...');
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Asignar por 1 mes
    
    const assignment = await prisma.routineAssignment.create({
      data: {
        routineId: routine.id,
        clientId: client.id,
        trainerId: routine.trainerId,
        startDate: startDate,
        endDate: endDate
      },
      include: {
        routine: true,
        client: true,
        trainer: true
      }
    });
    
    console.log('✅ Rutina reasignada exitosamente:');
    console.log(`   - Rutina: ${assignment.routine.name}`);
    console.log(`   - Cliente: ${assignment.client.email}`);
    console.log(`   - Entrenador: ${assignment.trainer.email}`);
    console.log(`   - Fecha asignación: ${assignment.assignedAt}`);
    
    // Verificar la asignación
    const verification = await prisma.user.findUnique({
      where: {
        email: 'florenciamusitani@gmail.com'
      },
      include: {
        routineAssignmentsAsClient: {
          include: {
            routine: true
          }
        }
      }
    });
    
    console.log('\n🔍 Verificación - Rutinas asignadas al cliente:');
    console.log(`   - Total: ${verification.routineAssignmentsAsClient.length}`);
    verification.routineAssignmentsAsClient.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.routine.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error reasignando rutina:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reassignAugustRoutine();